import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withConnection, withTransaction } from './db.js';
import { getCurrentEmailConfig, sendEmailJS, type EmailPayload } from './email.js';
import { consumeRateLimit } from './rate-limit.js';
import { getIdentifierHash, hashIdentifier } from './security.js';
import { contactSchema, fieldErrors } from './validation.js';
import { requireAdmin } from './auth.js';

type Delivery = 'pending' | 'processing' | 'sent' | 'failed' | 'unknown';

interface StoredContact {
  id: number;
  delivery_status: Delivery;
}

function idempotencyHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getHeader(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return typeof value === 'string' ? value : undefined;
}

export async function handleContact(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  const parsed = contactSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({
    success: false,
    error: 'Contact form is invalid',
    code: 'VALIDATION_ERROR',
    fieldErrors: fieldErrors(parsed.error),
  });
  const key = getHeader(req, 'idempotency-key');
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return res.status(400).json({ success: false, error: 'A valid Idempotency-Key UUID is required', code: 'IDEMPOTENCY_KEY_REQUIRED' });
  }
  const idemHash = idempotencyHash(key);
  const existing = await withConnection(async (conn) => {
    const [rows] = await conn.execute('SELECT id, delivery_status FROM contact_messages WHERE idempotency_hash = ? LIMIT 1', [idemHash]);
    return (rows as StoredContact[])[0] || null;
  });
  if (existing) return res.status(200).json({ success: true, data: { messageId: existing.id, delivery: existing.delivery_status } });

  const input = parsed.data;
  const emailKeySecret = process.env.RATE_LIMIT_HMAC_KEY || process.env.ADMIN_SESSION_SECRET || 'development-only-rate-limit-key';
  const emailHash = hashIdentifier(input.email, emailKeySecret, process.env.RATE_LIMIT_KEY_VERSION || 'v1');
  const ipHash = getIdentifierHash(req);
  let messageId: number;
  try {
    messageId = await withTransaction(async (conn) => {
      const ipLimit = await consumeRateLimit(conn, 'contact:ip', ipHash, 10, 86_400);
      const emailLimit = await consumeRateLimit(conn, 'contact:email', emailHash, 3, 86_400);
      if (!ipLimit.allowed || !emailLimit.allowed) {
        const error = new Error('CONTACT_RATE_LIMITED') as Error & { retryAfter?: number };
        error.retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
        throw error;
      }
      const [result] = await conn.execute(
        `INSERT INTO contact_messages
          (name, email, topic, message, status, user_agent, idempotency_hash, delivery_status)
         VALUES (?, ?, ?, ?, 'new', ?, ?, 'pending')`,
        [input.name, input.email, input.topic, input.message, getHeader(req, 'user-agent')?.slice(0, 255) || null, idemHash],
      );
      return Number((result as { insertId: number }).insertId);
    });
  } catch (error) {
    if ((error as Error).message === 'CONTACT_RATE_LIMITED') {
      const retryAfter = Number((error as Error & { retryAfter?: number }).retryAfter || 86_400);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: 'Too many contact requests', code: 'CONTACT_RATE_LIMITED' });
    }
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      const duplicate = await withConnection(async (conn) => {
        const [rows] = await conn.execute('SELECT id, delivery_status FROM contact_messages WHERE idempotency_hash = ? LIMIT 1', [idemHash]);
        return (rows as StoredContact[])[0];
      });
      if (duplicate) return res.status(200).json({ success: true, data: { messageId: duplicate.id, delivery: duplicate.delivery_status } });
    }
    throw error;
  }

  const claimed = await withConnection(async (conn) => {
    const [result] = await conn.execute(
      `UPDATE contact_messages
          SET delivery_status = 'processing', delivery_attempted_at = NOW()
        WHERE id = ? AND delivery_status = 'pending'`,
      [messageId],
    );
    return Number((result as { affectedRows?: number }).affectedRows || 0) === 1;
  });
  if (!claimed) return res.status(202).json({ success: true, data: { messageId, delivery: 'processing' } });

  const delivery = await deliverContact(input);
  await withConnection(async (conn) => {
    await conn.execute(
      'UPDATE contact_messages SET delivery_status = ?, delivery_error_code = ? WHERE id = ?',
      [delivery.status, delivery.code || null, messageId],
    );
  });
  console.info(JSON.stringify({ type: 'email-delivery', messageId, delivery: delivery.status, code: delivery.code || null }));
  return res.status(delivery.status === 'sent' ? 200 : 202).json({ success: true, data: { messageId, delivery: delivery.status } });
}

export async function handleContactResend(req: VercelRequest, res: VercelResponse, id: number) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  if (!requireAdmin(req, res)) return;
  const claimed = await withConnection(async (conn) => {
    const [result] = await conn.execute(
      `UPDATE contact_messages
          SET delivery_status = 'processing', delivery_attempted_at = NOW(), delivery_error_code = NULL
        WHERE id = ? AND delivery_status IN ('failed', 'unknown')`,
      [id],
    );
    if (Number((result as { affectedRows?: number }).affectedRows || 0) !== 1) return null;
    const [rows] = await conn.execute(
      'SELECT name, email, topic, message FROM contact_messages WHERE id = ? LIMIT 1',
      [id],
    );
    return (rows as Array<{ name: string; email: string; topic: string; message: string }>)[0] || null;
  });
  if (!claimed) {
    return res.status(409).json({
      success: false,
      error: 'Only failed or unknown deliveries can be resent',
      code: 'DELIVERY_NOT_RESENDABLE',
    });
  }
  const delivery = await deliverContact(claimed);
  await withConnection((conn) => conn.execute(
    'UPDATE contact_messages SET delivery_status = ?, delivery_error_code = ? WHERE id = ?',
    [delivery.status, delivery.code || null, id],
  ).then(() => undefined));
  console.info(JSON.stringify({ type: 'email-delivery', messageId: id, delivery: delivery.status, code: delivery.code || null, manualResend: true }));
  return res.status(delivery.status === 'sent' ? 200 : 202).json({
    success: true,
    data: { messageId: id, delivery: delivery.status },
  });
}

async function deliverContact(input: { name: string; email: string; topic: string; message: string }): Promise<{ status: Delivery; code?: string }> {
  const config = getCurrentEmailConfig();
  if (!config) return { status: 'failed', code: 'EMAIL_NOT_CONFIGURED' };
  const payload: EmailPayload = {
    service_id: config.serviceId,
    template_id: config.contactTemplateId,
    user_id: config.publicKey,
    accessToken: config.privateKey,
    template_params: {
      from_name: input.name,
      from_email: input.email,
      topic: input.topic,
      message: input.message,
      timestamp: new Date().toISOString(),
    },
  };
  const result = await sendEmailJS(payload);
  if (result.ok) return { status: 'sent' };
  return { status: result.ambiguous ? 'unknown' : 'failed', code: result.code || 'EMAIL_PROVIDER_FAILED' };
}
