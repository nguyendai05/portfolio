import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';

interface ExperimentRow {
  id: number;
  code: string;
  name: string;
  description: string;
  project_id: number | null;
}

function mapExperiment(row: ExperimentRow) {
  return {
    id: row.code,
    dbId: row.id,
    code: row.code,
    name: row.name,
    desc: row.description,
    projectId: row.project_id,
  };
}

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
        const [existingRows] = await conn.execute(
          'SELECT * FROM experiments WHERE id = ?',
          [id],
        );
        const list = existingRows as ExperimentRow[];
        if (list.length === 0) {
          return res
            .status(404)
            .json({ success: false, error: 'Experiment not found' });
        }
        const current = list[0];
        const code =
          typeof body.code === 'string' && body.code.trim()
            ? body.code.trim()
            : current.code;
        const name =
          typeof body.name === 'string' && body.name.trim()
            ? body.name.trim()
            : current.name;
        const description =
          typeof body.description === 'string'
            ? body.description.trim()
            : typeof body.desc === 'string'
              ? body.desc.trim()
              : current.description;
        const projectId =
          body.projectId === null
            ? null
            : typeof body.projectId === 'number' && Number.isFinite(body.projectId)
              ? body.projectId
              : current.project_id;

        await conn.execute(
          `UPDATE experiments
              SET code = ?, name = ?, description = ?, project_id = ?
            WHERE id = ?`,
          [code, name, description, projectId, id],
        );
        const [rows] = await conn.execute(
          'SELECT * FROM experiments WHERE id = ?',
          [id],
        );
        const updated = (rows as ExperimentRow[])[0];
        return res
          .status(200)
          .json({ success: true, data: updated ? mapExperiment(updated) : { id } });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const conn = await getConnection();
      try {
        const [result] = await conn.execute(
          'DELETE FROM experiments WHERE id = ?',
          [id],
        );
        const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
        if (!affected) {
          return res
            .status(404)
            .json({ success: false, error: 'Experiment not found' });
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
    console.error('Database error in /api/experiments/[id]:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
