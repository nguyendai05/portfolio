import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';

async function count(
  conn: import('mysql2/promise').Connection,
  query: string,
): Promise<number> {
  const [rows] = await conn.execute(query);
  const list = rows as Array<{ c: number | string | bigint }>;
  if (list.length === 0) return 0;
  const value = list[0].c;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return Number(value || 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const conn = await getConnection();
  try {
    const [
      projects,
      tools,
      skills,
      milestones,
      experiments,
      messages,
      newMessages,
      ideas,
    ] = await Promise.all([
      count(
        conn,
        "SELECT COUNT(*) AS c FROM projects WHERE project_type = 'project'",
      ),
      count(
        conn,
        "SELECT COUNT(*) AS c FROM projects WHERE project_type = 'tool'",
      ),
      count(conn, 'SELECT COUNT(*) AS c FROM skills'),
      count(conn, 'SELECT COUNT(*) AS c FROM awards'),
      count(conn, 'SELECT COUNT(*) AS c FROM experiments'),
      count(conn, 'SELECT COUNT(*) AS c FROM contact_messages'),
      count(
        conn,
        "SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'",
      ),
      count(conn, 'SELECT COUNT(*) AS c FROM ideas').catch(() => 0),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        tools,
        skills,
        milestones,
        experiments,
        messages,
        newMessages,
        ideas,
      },
    });
  } catch (error) {
    const formatted = formatDbError(error);
    console.error('Database error in /api/admin/stats:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  } finally {
    await conn.end();
  }
}
