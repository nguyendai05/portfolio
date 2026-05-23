import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from './_lib/db';
import { applyCors, requireAdmin } from './_lib/auth';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
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
      const yearRaw = body.year;
      const year = Number(yearRaw);
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

      if (!Number.isFinite(year) || !organization || !projectTitle || !awardTitle) {
        return res.status(400).json({
          success: false,
          error: 'year, organization, project_title, and award_title are required',
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
        return res
          .status(201)
          .json({ success: true, data: list[0] ? mapAward(list[0]) : { id: insertId } });
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
