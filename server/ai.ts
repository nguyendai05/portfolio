import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMessageToMantis } from './providers/gemini.js';
import { withConnection } from './db.js';
import { consumeRateLimit } from './rate-limit.js';
import { getIdentifierHash } from './security.js';
import { aiChatSchema, fieldErrors } from './validation.js';

export async function handleAiChat(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  const parsed = aiChatSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Chat request is invalid',
      code: 'VALIDATION_ERROR',
      fieldErrors: fieldErrors(parsed.error),
    });
  }
  const rate = await withConnection((conn) =>
    consumeRateLimit(conn, 'ai:ip', getIdentifierHash(req), 10, 600),
  );
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfterSeconds));
    return res.status(429).json({ success: false, error: 'AI request limit reached', code: 'AI_RATE_LIMITED' });
  }
  try {
    const text = await sendMessageToMantis(parsed.data.history, parsed.data.message);
    return res.status(200).json({ success: true, data: { text } });
  } catch (error) {
    const providerCode = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
    console.error(JSON.stringify({ type: 'ai-provider-failure', code: providerCode || 'AI_PROVIDER_UNAVAILABLE' }));
    return res.status(503).json({
      success: false,
      error: providerCode === 'AI_PROVIDER_QUOTA'
        ? 'The AI provider quota is temporarily unavailable'
        : 'The AI assistant is temporarily unavailable',
      code: 'AI_UNAVAILABLE',
    });
  }
}
