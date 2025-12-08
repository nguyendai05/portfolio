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

// --- Handler ---
async function getAwards(res: VercelResponse) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(
            `SELECT 
        id,
        year,
        organization,
        project_title,
        award_title,
        project_id
       FROM awards 
       ORDER BY year DESC, id DESC`
        );

        // Map to match mockData format: { year, org, project, award }
        const awards = (rows as any[]).map(row => ({
            id: row.id,
            year: String(row.year),
            org: row.organization,
            project: row.project_title,
            award: row.award_title,
            projectId: row.project_id,
        }));

        return res.status(200).json({ success: true, data: awards });
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
        return await getAwards(res);
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
