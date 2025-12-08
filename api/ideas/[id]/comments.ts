import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

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

// GET /api/ideas/:id/comments
async function getComments(id: string, res: VercelResponse) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(
            'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE idea_id = ? ORDER BY created_at ASC',
            [id]
        );
        const comments = (rows as any[]).map(row => ({
            id: row.id,
            ideaId: row.idea_id,
            author: row.author,
            content: row.content,
            createdAt: row.created_at,
        }));
        return res.status(200).json({ success: true, data: comments });
    } finally {
        await conn.end();
    }
}

// POST /api/ideas/:id/comments
async function createComment(id: string, req: VercelRequest, res: VercelResponse) {
    const { content, author } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const conn = await getConnection();
    try {
        const [result] = await conn.execute(
            'INSERT INTO idea_comments (idea_id, author, content) VALUES (?, ?, ?)',
            [id, author || 'Anonymous', content.trim()]
        );

        const insertId = (result as any).insertId;
        const [rows] = await conn.execute(
            'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE id = ?',
            [insertId]
        );

        const row = (rows as any[])[0];
        return res.status(201).json({
            success: true,
            data: {
                id: row.id,
                ideaId: row.idea_id,
                author: row.author,
                content: row.content,
                createdAt: row.created_at,
            }
        });
    } finally {
        await conn.end();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            return await getComments(id as string, res);
        }
        if (req.method === 'POST') {
            return await createComment(id as string, req, res);
        }
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
