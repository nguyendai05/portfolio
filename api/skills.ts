import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from './_lib/db';
import { applyCors, requireAdmin } from './_lib/auth';

interface SkillRow {
  id: number;
  name: string;
  skill_type: string;
}

const ALLOWED_TYPES = [
  'language',
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'other',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const conn = await getConnection();
      try {
        const [rows] = await conn.execute(
          'SELECT id, name, skill_type FROM skills ORDER BY skill_type, name',
        );
        const list = rows as SkillRow[];
        const skills = list.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.skill_type,
        }));
        const names = skills.map((s) => s.name);
        return res.status(200).json({
          success: true,
          data: { skills, names },
        });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const type = typeof body.type === 'string' ? body.type.toLowerCase() : 'other';
      if (!name) {
        return res
          .status(400)
          .json({ success: false, error: 'Name is required' });
      }
      const skillType = ALLOWED_TYPES.includes(type) ? type : 'other';
      const conn = await getConnection();
      try {
        await conn.execute(
          `INSERT INTO skills (name, skill_type)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE skill_type = VALUES(skill_type)`,
          [name, skillType],
        );
        const [rows] = await conn.execute(
          'SELECT id, name, skill_type FROM skills WHERE name = ?',
          [name],
        );
        const list = rows as SkillRow[];
        if (list.length === 0) {
          return res
            .status(500)
            .json({ success: false, error: 'Failed to load created skill' });
        }
        return res.status(201).json({
          success: true,
          data: { id: list[0].id, name: list[0].name, type: list[0].skill_type },
        });
      } finally {
        await conn.end();
      }
    }

    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const formatted = formatDbError(error);
    console.error('Database error in /api/skills:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
