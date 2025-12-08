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
async function getSkills(res: VercelResponse) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(
            'SELECT name, skill_type FROM skills ORDER BY name'
        );

        const skills = (rows as any[]).map(row => ({
            name: row.name,
            type: row.skill_type,
        }));

        // Also return just names array for marquee compatibility
        const names = skills.map(s => s.name);

        return res.status(200).json({
            success: true,
            data: {
                skills,
                names, // For CLIENTS marquee compatibility
            }
        });
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
        return await getSkills(res);
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
