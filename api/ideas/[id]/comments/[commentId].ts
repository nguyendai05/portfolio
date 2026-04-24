import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, commentId } = req.query; // 'id' from parent [id], 'commentId' from [commentId].ts

    if (!id || Array.isArray(id) || !commentId || Array.isArray(commentId)) {
        return res.status(400).json({ success: false, error: 'Invalid ID parameters' });
    }

    try {
        if (req.method === 'DELETE') {
            const conn = await getConnection();
            try {
                await conn.execute(
                    'DELETE FROM idea_comments WHERE id = ? AND idea_id = ?',
                    [commentId, id]
                );
                return res.status(200).json({ success: true });
            } finally {
                await conn.end();
            }
        }
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        const formatted = formatDbError(error);
        console.error('Database error in /api/ideas/[id]/comments/[commentId]:', formatted);
        return res.status(500).json({ success: false, error: 'Database error', code: formatted.code, hint: formatted.hint });
    }
}
