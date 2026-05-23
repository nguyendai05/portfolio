import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';
import {
  ContactRow,
  isAllowedStatus,
  mapContactRow,
} from '../_lib/contact-messages';

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!requireAdmin(req, res)) return;

  const id = parseId(req.query.id);
  if (!id) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
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
        return res
          .status(200)
          .json({ success: true, data: updated ? mapContactRow(updated) : { id } });
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
    console.error('Database error in /api/contact-messages/[id]:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
