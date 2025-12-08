import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// --- Database Connection ---
async function getConnection() {
  const config: any = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  if (process.env.MYSQL_SSL === 'true') {
    config.ssl = { rejectUnauthorized: true };
  }

  return mysql.createConnection(config);
}

// --- Handlers ---
async function upvoteIdea(id: string, res: VercelResponse) {
  const conn = await getConnection();
  try {
    await conn.execute('UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?', [id]);
    const [rows] = await conn.execute('SELECT upvotes FROM ideas WHERE id = ?', [id]);
    const upvotes = (rows as any[])[0]?.upvotes ?? 0;
    return res.status(200).json({ success: true, data: { upvotes } });
  } finally {
    await conn.end();
  }
}

async function deleteIdea(id: string, res: VercelResponse) {
  const conn = await getConnection();
  try {
    await conn.execute('DELETE FROM ideas WHERE id = ?', [id]);
    return res.status(200).json({ success: true });
  } finally {
    await conn.end();
  }
}

async function getIdea(id: string, res: VercelResponse) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute('SELECT * FROM ideas WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        description: row.description,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
        difficulty: row.difficulty,
        upvotes: row.upvotes,
        lookingForTeam: Boolean(row.looking_for_team),
        author: row.author,
        createdAt: row.created_at,
      },
    });
  } finally {
    await conn.end();
  }
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  try {
    if (req.method === 'GET') {
      return await getIdea(id, res);
    }
    if (req.method === 'PATCH') {
      return await upvoteIdea(id, res);
    }
    if (req.method === 'DELETE') {
      return await deleteIdea(id, res);
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
}
