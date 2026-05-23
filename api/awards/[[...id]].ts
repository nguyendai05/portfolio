import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';

interface AwardRow {
  id: number;
  year: number;
  organization: string;
  project_title: string;
  award_title: string;
  project_id: number | null;
}

function mapAward(row: AwardRow) {
  return {
    id: row.id,
    year: String(row.year),
    org: row.organization,
    project: row.project_title,
    award: row.award_title,
    projectId: row.project_id,
  };
}

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
    // ─── /api/awards (collection) ─────────────────────────────────
    if (segments.length === 0) {
      if (req.method === 'GET') {
        const conn = await getConnection();
        try {
          const [rows] = await conn.execute(
            `SELECT id, year, organization, project_title, award_title, project_id
               FROM awards
              ORDER BY year DESC, id DESC`,
          );
          const list = (rows as AwardRow[]).map(mapAward);
          return res.status(200).json({ success: true, data: list });
        } finally {
          await conn.end();
        }
      }

      if (req.method === 'POST') {
        if (!requireAdmin(req, res)) return;
        const body = (req.body || {}) as Record<string, unknown>;
        const year = Number(body.year);
        const organization =
          typeof body.org === 'string'
            ? body.org.trim()
            : typeof body.organization === 'string'
              ? body.organization.trim()
              : '';
        const projectTitle =
          typeof body.project === 'string'
            ? body.project.trim()
            : typeof body.projectTitle === 'string'
              ? body.projectTitle.trim()
              : '';
        const awardTitle =
          typeof body.award === 'string'
            ? body.award.trim()
            : typeof body.awardTitle === 'string'
              ? body.awardTitle.trim()
              : '';
        const projectId =
          typeof body.projectId === 'number' && Number.isFinite(body.projectId)
            ? body.projectId
            : null;

        if (
          !Number.isFinite(year) ||
          !organization ||
          !projectTitle ||
          !awardTitle
        ) {
          return res.status(400).json({
            success: false,
            error:
              'year, organization, project_title, and award_title are required',
          });
        }
        const conn = await getConnection();
        try {
          const [result] = await conn.execute(
            `INSERT INTO awards (year, organization, project_title, award_title, project_id)
              VALUES (?, ?, ?, ?, ?)`,
            [year, organization, projectTitle, awardTitle, projectId],
          );
          const insertId = (result as { insertId: number }).insertId;
          const [rows] = await conn.execute(
            `SELECT id, year, organization, project_title, award_title, project_id
               FROM awards WHERE id = ?`,
            [insertId],
          );
          const list = rows as AwardRow[];
          return res.status(201).json({
            success: true,
            data: list[0] ? mapAward(list[0]) : { id: insertId },
          });
        } finally {
          await conn.end();
        }
      }

      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    // ─── /api/awards/:id (item) ───────────────────────────────────
    if (!id) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      const conn = await getConnection();
      try {
        const [existingRows] = await conn.execute(
          'SELECT * FROM awards WHERE id = ?',
          [id],
        );
        const list = existingRows as AwardRow[];
        if (list.length === 0) {
          return res
            .status(404)
            .json({ success: false, error: 'Award not found' });
        }
        const current = list[0];
        const year =
          body.year !== undefined && Number.isFinite(Number(body.year))
            ? Number(body.year)
            : current.year;
        const organization =
          typeof body.org === 'string'
            ? body.org.trim()
            : typeof body.organization === 'string'
              ? body.organization.trim()
              : current.organization;
        const projectTitle =
          typeof body.project === 'string'
            ? body.project.trim()
            : typeof body.projectTitle === 'string'
              ? body.projectTitle.trim()
              : current.project_title;
        const awardTitle =
          typeof body.award === 'string'
            ? body.award.trim()
            : typeof body.awardTitle === 'string'
              ? body.awardTitle.trim()
              : current.award_title;
        const projectId =
          body.projectId === null
            ? null
            : typeof body.projectId === 'number' &&
                Number.isFinite(body.projectId)
              ? body.projectId
              : current.project_id;

        await conn.execute(
          `UPDATE awards
              SET year = ?, organization = ?, project_title = ?, award_title = ?, project_id = ?
            WHERE id = ?`,
          [year, organization, projectTitle, awardTitle, projectId, id],
        );
        const [rows] = await conn.execute(
          'SELECT * FROM awards WHERE id = ?',
          [id],
        );
        const updated = (rows as AwardRow[])[0];
        return res
          .status(200)
          .json({ success: true, data: updated ? mapAward(updated) : { id } });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const conn = await getConnection();
      try {
        const [result] = await conn.execute(
          'DELETE FROM awards WHERE id = ?',
          [id],
        );
        const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
        if (!affected) {
          return res
            .status(404)
            .json({ success: false, error: 'Award not found' });
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
    console.error('Database error in /api/awards:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
