import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';
import {
  ContactRow,
  insertContactMessage,
  isAllowedStatus,
  mapContactRow,
} from '../_lib/contact-messages';

function parseId(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getSegments(req: VercelRequest): string[] {
  const raw = req.query.id;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSegments(req);
  const id = segments.length === 1 ? parseId(segments[0]) : null;

  try {
    // ─── /api/contact-messages (collection) ───────────────────────
    if (segments.length === 0) {
      if (req.method === 'GET') {
        if (!requireAdmin(req, res)) return;
        const conn = await getConnection();
        try {
          const [rows] = await conn.execute(
            `SELECT id, name, email, topic, message, status, user_agent, created_at
               FROM contact_messages
              ORDER BY created_at DESC, id DESC`,
          );
          const list = (rows as ContactRow[]).map(mapContactRow);
          const newCount = list.filter((m) => m.status === 'new').length;
          return res.status(200).json({
            success: true,
            data: list,
            meta: { total: list.length, newCount },
          });
        } finally {
          await conn.end();
        }
      }

      if (req.method === 'POST') {
        const body = (req.body || {}) as Record<string, unknown>;
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const message =
          typeof body.message === 'string' ? body.message.trim() : '';
        const topic = typeof body.topic === 'string' ? body.topic : 'other';
        if (!name || !email || !message) {
          return res.status(400).json({
            success: false,
            error: 'Name, email, and message are required',
          });
        }
        const conn = await getConnection();
        try {
          const newId = await insertContactMessage(conn, {
            name,
            email,
            topic,
            message,
            userAgent:
              typeof req.headers['user-agent'] === 'string'
                ? req.headers['user-agent']
                : null,
          });
          return res.status(201).json({ success: true, data: { id: newId } });
        } finally {
          await conn.end();
        }
      }

      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    // ─── /api/contact-messages/:id (item) ─────────────────────────
    if (!requireAdmin(req, res)) return;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = (req.body || {}) as Record<string, unknown>;
      const status =
        typeof body.status === 'string' ? body.status.toLowerCase() : '';
      if (!isAllowedStatus(status)) {
        return res.status(400).json({
          success: false,
          error: 'status must be new | replied | archived',
        });
      }
      const conn = await getConnection();
      try {
        const [result] = await conn.execute(
          'UPDATE contact_messages SET status = ? WHERE id = ?',
          [status, id],
        );
        const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
        if (!affected) {
          return res
            .status(404)
            .json({ success: false, error: 'Message not found' });
        }
        const [rows] = await conn.execute(
          `SELECT id, name, email, topic, message, status, user_agent, created_at
             FROM contact_messages WHERE id = ?`,
          [id],
        );
        const updated = (rows as ContactRow[])[0];
        return res.status(200).json({
          success: true,
          data: updated ? mapContactRow(updated) : { id },
        });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'DELETE') {
      const conn = await getConnection();
      try {
        const [result] = await conn.execute(
          'DELETE FROM contact_messages WHERE id = ?',
          [id],
        );
        const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
        if (!affected) {
          return res
            .status(404)
            .json({ success: false, error: 'Message not found' });
        }
        return res.status(200).json({ success: true });
      } finally {
        await conn.end();
      }
    }

    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const formatted = formatDbError(error);
    console.error('Database error in /api/contact-messages:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
