import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';

const ALLOWED_TYPES = [
  'language',
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'other',
];

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = parseId(req.query.id);
  if (!id) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      const conn = await getConnection();
      try {
        const [existing] = await conn.execute(
          'SELECT id, name, skill_type FROM skills WHERE id = ?',
          [id],
        );
        const list = existing as Array<{
          id: number;
          name: string;
          skill_type: string;
        }>;
        if (list.length === 0) {
          return res
            .status(404)
            .json({ success: false, error: 'Skill not found' });
        }
        const current = list[0];
        const name =
          typeof body.name === 'string' && body.name.trim()
            ? body.name.trim()
            : current.name;
        const type =
          typeof body.type === 'string'
            ? body.type.toLowerCase()
            : current.skill_type;
        const skillType = ALLOWED_TYPES.includes(type) ? type : current.skill_type;

        await conn.execute(
          'UPDATE skills SET name = ?, skill_type = ? WHERE id = ?',
          [name, skillType, id],
        );
        return res.status(200).json({
          success: true,
          data: { id, name, type: skillType },
        });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const conn = await getConnection();
      try {
        const [result] = await conn.execute(
          'DELETE FROM skills WHERE id = ?',
          [id],
        );
        const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
        if (!affected) {
          return res
            .status(404)
            .json({ success: false, error: 'Skill not found' });
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
    console.error('Database error in /api/skills/[id]:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
