import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// --- Database Connection ---
async function getConnection() {
    return mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });
}

// --- Handler ---
async function getExperiments(res: VercelResponse) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(
            `SELECT 
        id,
        code,
        name,
        description,
        project_id
       FROM experiments 
       ORDER BY code`
        );

        // Map to match mockData format: { id, name, desc }
        const experiments = (rows as any[]).map(row => ({
            id: row.code, // Use code as id for compatibility
            name: row.name,
            desc: row.description,
            projectId: row.project_id,
        }));

        return res.status(200).json({ success: true, data: experiments });
    } finally {
        await conn.end();
    }
}

// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        return await getExperiments(res);
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
