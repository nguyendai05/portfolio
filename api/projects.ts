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

// --- Types ---
interface ProjectRow {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    description: string;
    category: string;
    project_type: 'project' | 'tool';
    image_url: string;
    link: string | null;
    featured: number;
    created_at: string;
}

// --- Handlers ---
async function getProjects(res: VercelResponse, projectType?: string) {
    const conn = await getConnection();
    try {
        // Build query based on type filter
        let query = `
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.summary,
        p.description,
        p.category,
        p.project_type,
        p.image_url,
        p.link,
        p.featured,
        p.created_at
      FROM projects p
    `;

        const params: string[] = [];
        if (projectType && ['project', 'tool'].includes(projectType)) {
            query += ' WHERE p.project_type = ?';
            params.push(projectType);
        }

        query += ' ORDER BY p.featured DESC, p.created_at DESC';

        const [rows] = await conn.execute(query, params);
        const projects = rows as ProjectRow[];

        // Get technologies and phases for each project
        const result = await Promise.all(
            projects.map(async (project) => {
                // Get technologies
                const [techRows] = await conn.execute(
                    `SELECT t.name 
           FROM technologies t 
           JOIN project_technologies pt ON pt.technology_id = t.id 
           WHERE pt.project_id = ?`,
                    [project.id]
                );
                const technologies = (techRows as any[]).map(r => r.name);

                // Get phases
                const [phaseRows] = await conn.execute(
                    `SELECT ph.name 
           FROM phases ph 
           JOIN project_phases pp ON pp.phase_id = ph.id 
           WHERE pp.project_id = ? 
           ORDER BY pp.phase_order`,
                    [project.id]
                );
                const phases = (phaseRows as any[]).map(r => r.name);

                return {
                    id: project.id,
                    slug: project.slug,
                    title: project.title,
                    category: project.category,
                    image: project.image_url,
                    description: project.description,
                    technologies,
                    link: project.link || undefined,
                    featured: Boolean(project.featured),
                    phases: phases.length > 0 ? phases : undefined,
                    projectType: project.project_type,
                };
            })
        );

        return res.status(200).json({ success: true, data: result });
    } finally {
        await conn.end();
    }
}

async function getProjectBySlug(slug: string, res: VercelResponse) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(
            `SELECT * FROM projects WHERE slug = ?`,
            [slug]
        );

        const projects = rows as ProjectRow[];
        if (projects.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const project = projects[0];

        // Get technologies
        const [techRows] = await conn.execute(
            `SELECT t.name 
       FROM technologies t 
       JOIN project_technologies pt ON pt.technology_id = t.id 
       WHERE pt.project_id = ?`,
            [project.id]
        );
        const technologies = (techRows as any[]).map(r => r.name);

        // Get phases
        const [phaseRows] = await conn.execute(
            `SELECT ph.name 
       FROM phases ph 
       JOIN project_phases pp ON pp.phase_id = ph.id 
       WHERE pp.project_id = ? 
       ORDER BY pp.phase_order`,
            [project.id]
        );
        const phases = (phaseRows as any[]).map(r => r.name);

        const result = {
            id: project.id,
            slug: project.slug,
            title: project.title,
            category: project.category,
            image: project.image_url,
            description: project.description,
            technologies,
            link: project.link || undefined,
            featured: Boolean(project.featured),
            phases: phases.length > 0 ? phases : undefined,
            projectType: project.project_type,
        };

        return res.status(200).json({ success: true, data: result });
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
        const { type, slug } = req.query;

        // If slug is provided, get single project
        if (slug && typeof slug === 'string') {
            return await getProjectBySlug(slug, res);
        }

        // Get all projects (optionally filtered by type)
        const projectType = typeof type === 'string' ? type : undefined;
        return await getProjects(res, projectType);

    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
}
