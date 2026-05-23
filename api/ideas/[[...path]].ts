import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';

type Conn = import('mysql2/promise').Connection;

interface IdeaRow {
  id: number;
  title: string;
  description: string;
  tags: string | unknown[] | null;
  difficulty: string;
  upvotes: number;
  looking_for_team: number | boolean;
  author: string;
  created_at: string;
}

function mapIdea(row: IdeaRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags:
      typeof row.tags === 'string'
        ? JSON.parse(row.tags || '[]')
        : (row.tags || []),
    difficulty: row.difficulty,
    upvotes: row.upvotes,
    lookingForTeam: Boolean(row.looking_for_team),
    author: row.author,
    createdAt: row.created_at,
  };
}

interface CommentRow {
  id: number;
  idea_id: number;
  author: string;
  content: string;
  created_at: string;
}

function mapComment(row: CommentRow) {
  return {
    id: row.id,
    ideaId: row.idea_id,
    author: row.author,
    content: row.content,
    createdAt: row.created_at,
  };
}

function getSegments(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

// ─── /api/ideas ─────────────────────────────────────────────────
async function listIdeas(conn: Conn, res: VercelResponse) {
  const [rows] = await conn.execute(
    'SELECT * FROM ideas ORDER BY created_at DESC',
  );
  return res.status(200).json({
    success: true,
    data: (rows as IdeaRow[]).map(mapIdea),
  });
}

async function createIdea(
  conn: Conn,
  req: VercelRequest,
  res: VercelResponse,
) {
  const body = (req.body || {}) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title : '';
  const description =
    typeof body.description === 'string' ? body.description : '';
  if (!title || !description) {
    return res
      .status(400)
      .json({ success: false, error: 'Title and description required' });
  }
  const [result] = await conn.execute(
    `INSERT INTO ideas (title, description, tags, difficulty, author, looking_for_team, upvotes)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      title,
      description,
      JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      typeof body.difficulty === 'string' ? body.difficulty : 'Medium',
      typeof body.author === 'string' && body.author ? body.author : 'Anonymous',
      body.lookingForTeam ? 1 : 0,
    ],
  );
  const insertId = (result as { insertId: number }).insertId;
  return res.status(201).json({ success: true, data: { id: insertId } });
}

// ─── /api/ideas/:id ─────────────────────────────────────────────
async function getIdea(conn: Conn, id: string, res: VercelResponse) {
  const [rows] = await conn.execute('SELECT * FROM ideas WHERE id = ?', [id]);
  const row = (rows as IdeaRow[])[0];
  if (!row) {
    return res.status(404).json({ success: false, error: 'Idea not found' });
  }
  return res.status(200).json({ success: true, data: mapIdea(row) });
}

async function upvoteIdea(conn: Conn, id: string, res: VercelResponse) {
  await conn.execute('UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?', [
    id,
  ]);
  const [rows] = await conn.execute(
    'SELECT upvotes FROM ideas WHERE id = ?',
    [id],
  );
  const upvotes = (rows as Array<{ upvotes: number }>)[0]?.upvotes ?? 0;
  return res.status(200).json({ success: true, data: { upvotes } });
}

async function deleteIdea(conn: Conn, id: string, res: VercelResponse) {
  await conn.execute('DELETE FROM ideas WHERE id = ?', [id]);
  return res.status(200).json({ success: true });
}

// ─── /api/ideas/:id/comments ────────────────────────────────────
async function listComments(conn: Conn, id: string, res: VercelResponse) {
  const [rows] = await conn.execute(
    'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE idea_id = ? ORDER BY created_at ASC',
    [id],
  );
  return res.status(200).json({
    success: true,
    data: (rows as CommentRow[]).map(mapComment),
  });
}

async function createComment(
  conn: Conn,
  id: string,
  req: VercelRequest,
  res: VercelResponse,
) {
  const body = (req.body || {}) as Record<string, unknown>;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const author =
    typeof body.author === 'string' && body.author.trim()
      ? body.author.trim()
      : 'Anonymous';
  if (!content) {
    return res
      .status(400)
      .json({ success: false, error: 'Content is required' });
  }
  const [result] = await conn.execute(
    'INSERT INTO idea_comments (idea_id, author, content) VALUES (?, ?, ?)',
    [id, author, content],
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await conn.execute(
    'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE id = ?',
    [insertId],
  );
  const row = (rows as CommentRow[])[0];
  return res
    .status(201)
    .json({ success: true, data: row ? mapComment(row) : { id: insertId } });
}

async function countComments(conn: Conn, id: string, res: VercelResponse) {
  const [rows] = await conn.execute(
    'SELECT COUNT(*) AS count FROM idea_comments WHERE idea_id = ?',
    [id],
  );
  const count = (rows as Array<{ count: number | bigint | string }>)[0].count;
  return res.status(200).json({
    success: true,
    data: { count: typeof count === 'number' ? count : Number(count) },
  });
}

async function deleteComment(
  conn: Conn,
  id: string,
  commentId: string,
  res: VercelResponse,
) {
  await conn.execute(
    'DELETE FROM idea_comments WHERE id = ? AND idea_id = ?',
    [commentId, id],
  );
  return res.status(200).json({ success: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const segments = getSegments(req);
  const conn = await getConnection();
  try {
    // /api/ideas
    if (segments.length === 0) {
      if (req.method === 'GET') return await listIdeas(conn, res);
      if (req.method === 'POST') return await createIdea(conn, req, res);
      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    const id = segments[0];

    // /api/ideas/:id
    if (segments.length === 1) {
      if (req.method === 'GET') return await getIdea(conn, id, res);
      if (req.method === 'PATCH') return await upvoteIdea(conn, id, res);
      if (req.method === 'DELETE') return await deleteIdea(conn, id, res);
      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    // /api/ideas/:id/comments
    if (segments.length === 2 && segments[1] === 'comments') {
      if (req.method === 'GET') return await listComments(conn, id, res);
      if (req.method === 'POST') return await createComment(conn, id, req, res);
      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    // /api/ideas/:id/comments/count or /api/ideas/:id/comments/:commentId
    if (segments.length === 3 && segments[1] === 'comments') {
      const tail = segments[2];
      if (tail === 'count') {
        if (req.method !== 'GET') {
          return res
            .status(405)
            .json({ success: false, error: 'Method not allowed' });
        }
        return await countComments(conn, id, res);
      }
      if (req.method === 'DELETE') {
        return await deleteComment(conn, id, tail, res);
      }
      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    const formatted = formatDbError(error);
    console.error('Database error in /api/ideas:', formatted);
    return res
      .status(500)
      .json({
        success: false,
        error: 'Database error',
        code: formatted.code,
        hint: formatted.hint,
      });
  } finally {
    await conn.end();
  }
}
