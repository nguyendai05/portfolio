import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// --- Types ---
export interface Idea {
  id: number;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  upvotes: number;
  lookingForTeam: boolean;
  author: string;
  createdAt?: string;
}

// --- Database Connection ---
async function getConnection() {
  const config: any = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  // Enable SSL for TiDB Cloud and other cloud providers
  if (process.env.MYSQL_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: true,
    };
  }

  return mysql.createConnection(config);
}

// --- Handlers ---
async function getIdeas(res: VercelResponse) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM ideas ORDER BY created_at DESC'
    );
    const ideas = (rows as any[]).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags || '[]'),
      difficulty: row.difficulty,
      upvotes: row.upvotes,
      lookingForTeam: Boolean(row.looking_for_team),
      author: row.author,
      createdAt: row.created_at,
    }));
    return res.status(200).json({ success: true, data: ideas });
  } finally {
    await conn.end();
  }
}

async function createIdea(req: VercelRequest, res: VercelResponse) {
  const { title, description, tags, difficulty, author, lookingForTeam } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description required' });
  }

  const conn = await getConnection();
  try {
    const [result] = await conn.execute(
      `INSERT INTO ideas (title, description, tags, difficulty, author, looking_for_team, upvotes)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        title,
        description,
        JSON.stringify(tags || []),
        difficulty || 'Medium',
        author || 'Anonymous',
        lookingForTeam ? 1 : 0,
      ]
    );
    const insertId = (result as any).insertId;
    return res.status(201).json({ success: true, data: { id: insertId } });
  } finally {
    await conn.end();
  }
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await getIdeas(res);
    }
    if (req.method === 'POST') {
      return await createIdea(req, res);
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
}
