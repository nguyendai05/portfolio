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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
            const conn = await getConnection();
            try {
                const [rows] = await conn.execute(
                    'SELECT COUNT(*) as count FROM idea_comments WHERE idea_id = ?',
                    [id]
                );
                const count = (rows as any[])[0].count;
                return res.status(200).json({ success: true, data: { count } });
            } finally {
                await conn.end();
            }
        }
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
