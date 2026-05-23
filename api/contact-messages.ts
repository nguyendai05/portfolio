import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from './_lib/db';
import { applyCors, requireAdmin } from './_lib/auth';
import {
  ContactRow,
  insertContactMessage,
  mapContactRow,
} from './_lib/contact-messages';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
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
        const id = await insertContactMessage(conn, {
          name,
          email,
          topic,
          message,
          userAgent:
            typeof req.headers['user-agent'] === 'string'
              ? req.headers['user-agent']
              : null,
        });
        return res.status(201).json({ success: true, data: { id } });
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
