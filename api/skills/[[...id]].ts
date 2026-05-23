import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';

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
    // ─── /api/skills (collection) ─────────────────────────────────
    if (segments.length === 0) {
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
        const type =
          typeof body.type === 'string' ? body.type.toLowerCase() : 'other';
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
            data: {
              id: list[0].id,
              name: list[0].name,
              type: list[0].skill_type,
            },
          });
        } finally {
          await conn.end();
        }
      }

      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    // ─── /api/skills/:id (item) ───────────────────────────────────
    if (!id) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      const conn = await getConnection();
      try {
        const [existing] = await conn.execute(
          'SELECT id, name, skill_type FROM skills WHERE id = ?',
          [id],
        );
        const list = existing as SkillRow[];
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
        const skillType = ALLOWED_TYPES.includes(type)
          ? type
          : current.skill_type;
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
    console.error('Database error in /api/skills:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
