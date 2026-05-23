/**
 * Local API Development Server
 * Run: node api-server.mjs
 * 
 * This server mimics the Vercel serverless functions locally for development.
 * It provides the same API endpoints as Vercel functions.
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load .env.local
function loadEnv() {
    try {
        const envPath = resolve(__dirname, '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');

        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        });
        console.log('✅ Loaded .env.local');
    } catch (error) {
        console.log('⚠️ Could not load .env.local:', error.message);
    }
}

loadEnv();

// ============================================
// ADMIN AUTH MIDDLEWARE
// ============================================
function getConfiguredAdminToken() {
    const token = process.env.ADMIN_TOKEN || process.env.ADMIN_API_TOKEN;
    return token && token.trim() ? token.trim() : null;
}

function requireAdmin(req, res, next) {
    const configured = getConfiguredAdminToken();
    if (!configured) {
        return res.status(503).json({
            success: false,
            error: 'Admin API is not configured on the server (missing ADMIN_TOKEN env).',
        });
    }
    const auth = req.headers['authorization'];
    let provided = null;
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
        provided = auth.slice(7).trim();
    } else if (typeof req.headers['x-admin-token'] === 'string') {
        provided = req.headers['x-admin-token'].trim();
    }
    if (!provided || provided !== configured) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

function slugify(input) {
    const base = (input || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return base || `project-${Date.now()}`;
}

async function ensureUniqueSlug(conn, desired, ignoreId) {
    let candidate = desired || slugify('project');
    let suffix = 1;
    while (true) {
        const [rows] = await conn.execute(
            'SELECT id FROM projects WHERE slug = ? LIMIT 1',
            [candidate]
        );
        if (rows.length === 0 || rows[0].id === ignoreId) return candidate;
        suffix += 1;
        candidate = `${desired}-${suffix}`;
    }
}

async function upsertTechnologies(conn, technologies) {
    const ids = [];
    for (const raw of technologies || []) {
        const name = String(raw || '').trim();
        if (!name) continue;
        await conn.execute(
            `INSERT INTO technologies (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name`,
            [name]
        );
        const [rows] = await conn.execute('SELECT id FROM technologies WHERE name = ?', [name]);
        if (rows[0]) ids.push(rows[0].id);
    }
    return ids;
}

async function upsertPhases(conn, phases) {
    const result = [];
    let order = 1;
    for (const raw of phases || []) {
        const name = String(raw || '').trim();
        if (!name) continue;
        await conn.execute(
            `INSERT INTO phases (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name`,
            [name]
        );
        const [rows] = await conn.execute('SELECT id FROM phases WHERE name = ?', [name]);
        if (rows[0]) result.push({ id: rows[0].id, order: order++ });
    }
    return result;
}

async function syncProjectTechnologies(conn, projectId, techIds) {
    await conn.execute('DELETE FROM project_technologies WHERE project_id = ?', [projectId]);
    for (const techId of techIds) {
        await conn.execute(
            'INSERT IGNORE INTO project_technologies (project_id, technology_id) VALUES (?, ?)',
            [projectId, techId]
        );
    }
}

async function syncProjectPhases(conn, projectId, phaseEntries) {
    await conn.execute('DELETE FROM project_phases WHERE project_id = ?', [projectId]);
    for (const phase of phaseEntries) {
        await conn.execute(
            'INSERT INTO project_phases (project_id, phase_id, phase_order) VALUES (?, ?, ?)',
            [projectId, phase.id, phase.order]
        );
    }
}

async function loadProject(conn, id) {
    const [rows] = await conn.execute('SELECT * FROM projects WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const project = rows[0];
    const [techRows] = await conn.execute(
        `SELECT t.name FROM technologies t JOIN project_technologies pt ON pt.technology_id = t.id WHERE pt.project_id = ?`,
        [project.id]
    );
    const [phaseRows] = await conn.execute(
        `SELECT ph.name FROM phases ph JOIN project_phases pp ON pp.phase_id = ph.id WHERE pp.project_id = ? ORDER BY pp.phase_order`,
        [project.id]
    );
    return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        summary: project.summary || undefined,
        category: project.category,
        image: project.image_url,
        description: project.description,
        technologies: techRows.map(r => r.name),
        link: project.link || undefined,
        featured: Boolean(project.featured),
        phases: phaseRows.length > 0 ? phaseRows.map(r => r.name) : undefined,
        projectType: project.project_type,
    };
}

// Database connection
async function getConnection() {
    const config = {
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

// ============================================
// IDEAS API
// ============================================

// GET /api/ideas - Get all ideas
app.get('/api/ideas', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [rows] = await conn.execute('SELECT * FROM ideas ORDER BY created_at DESC');
        const ideas = rows.map(row => {
            // Safe JSON parse for tags
            let tags = [];
            try {
                tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
            } catch {
                // If tags is not valid JSON, try to split by comma or use empty array
                tags = row.tags ? String(row.tags).split(',').map(t => t.trim()).filter(Boolean) : [];
            }

            return {
                id: row.id,
                title: row.title,
                description: row.description,
                tags,
                difficulty: row.difficulty,
                upvotes: row.upvotes,
                lookingForTeam: Boolean(row.looking_for_team),
                author: row.author,
                createdAt: row.created_at,
            };
        });
        res.json({ success: true, data: ideas });
    } catch (error) {
        console.error('Error fetching ideas:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// POST /api/ideas - Create new idea
app.post('/api/ideas', async (req, res) => {
    const { title, description, tags, difficulty, author, lookingForTeam } = req.body;

    if (!title || !description) {
        return res.status(400).json({ success: false, error: 'Title and description required' });
    }

    let conn;
    try {
        conn = await getConnection();
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
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Error creating idea:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// PATCH /api/ideas/:id - Upvote idea
app.patch('/api/ideas/:id', async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await getConnection();
        await conn.execute('UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?', [id]);
        const [rows] = await conn.execute('SELECT upvotes FROM ideas WHERE id = ?', [id]);
        res.json({ success: true, data: { upvotes: rows[0]?.upvotes || 0 } });
    } catch (error) {
        console.error('Error upvoting idea:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// DELETE /api/ideas/:id - Delete idea
app.delete('/api/ideas/:id', async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
        conn = await getConnection();
        await conn.execute('DELETE FROM ideas WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting idea:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// IDEA COMMENTS API
// ============================================

// GET /api/ideas/:id/comments - Get comments for an idea
app.get('/api/ideas/:id/comments', async (req, res) => {
    const { id } = req.params;
    let conn;

    try {
        conn = await getConnection();
        const [rows] = await conn.execute(
            'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE idea_id = ? ORDER BY created_at ASC',
            [id]
        );
        const comments = rows.map(row => ({
            id: row.id,
            ideaId: row.idea_id,
            author: row.author,
            content: row.content,
            createdAt: row.created_at,
        }));
        res.json({ success: true, data: comments });
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// POST /api/ideas/:id/comments - Create a new comment
app.post('/api/ideas/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { content, author } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, error: 'Content is required' });
    }

    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute(
            'INSERT INTO idea_comments (idea_id, author, content) VALUES (?, ?, ?)',
            [id, author || 'Anonymous', content.trim()]
        );

        const [rows] = await conn.execute(
            'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE id = ?',
            [result.insertId]
        );

        const comment = rows[0];
        res.status(201).json({
            success: true,
            data: {
                id: comment.id,
                ideaId: comment.idea_id,
                author: comment.author,
                content: comment.content,
                createdAt: comment.created_at,
            }
        });
    } catch (error) {
        console.error('Error creating comment:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// DELETE /api/ideas/:ideaId/comments/:commentId - Delete a comment
app.delete('/api/ideas/:ideaId/comments/:commentId', async (req, res) => {
    const { ideaId, commentId } = req.params;

    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            'DELETE FROM idea_comments WHERE id = ? AND idea_id = ?',
            [commentId, ideaId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// GET /api/ideas/:id/comments/count - Get comment count for an idea
app.get('/api/ideas/:id/comments/count', async (req, res) => {
    const { id } = req.params;
    let conn;

    try {
        conn = await getConnection();
        const [rows] = await conn.execute(
            'SELECT COUNT(*) as count FROM idea_comments WHERE idea_id = ?',
            [id]
        );
        res.json({ success: true, data: { count: rows[0].count } });
    } catch (error) {
        console.error('Error counting comments:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// PROJECTS API
// ============================================

app.get('/api/projects', async (req, res) => {
    const { type, slug } = req.query;
    let conn;

    try {
        conn = await getConnection();

        // If slug provided, get single project
        if (slug) {
            const [rows] = await conn.execute('SELECT * FROM projects WHERE slug = ?', [slug]);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }
            const project = rows[0];

            // Get technologies
            const [techRows] = await conn.execute(
                `SELECT t.name FROM technologies t JOIN project_technologies pt ON pt.technology_id = t.id WHERE pt.project_id = ?`,
                [project.id]
            );
            const technologies = techRows.map(r => r.name);

            // Get phases
            const [phaseRows] = await conn.execute(
                `SELECT ph.name FROM phases ph JOIN project_phases pp ON pp.phase_id = ph.id WHERE pp.project_id = ? ORDER BY pp.phase_order`,
                [project.id]
            );
            const phases = phaseRows.map(r => r.name);

            return res.json({
                success: true,
                data: {
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
                }
            });
        }

        // Get all projects
        let query = 'SELECT * FROM projects';
        const params = [];
        if (type && ['project', 'tool'].includes(type)) {
            query += ' WHERE project_type = ?';
            params.push(type);
        }
        query += ' ORDER BY featured DESC, created_at DESC';

        const [rows] = await conn.execute(query, params);

        const result = await Promise.all(
            rows.map(async (project) => {
                const [techRows] = await conn.execute(
                    `SELECT t.name FROM technologies t JOIN project_technologies pt ON pt.technology_id = t.id WHERE pt.project_id = ?`,
                    [project.id]
                );
                const technologies = techRows.map(r => r.name);

                const [phaseRows] = await conn.execute(
                    `SELECT ph.name FROM phases ph JOIN project_phases pp ON pp.phase_id = ph.id WHERE pp.project_id = ? ORDER BY pp.phase_order`,
                    [project.id]
                );
                const phases = phaseRows.map(r => r.name);

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

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching projects:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// SKILLS API
// ============================================

app.get('/api/skills', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [rows] = await conn.execute('SELECT id, name, skill_type FROM skills ORDER BY skill_type, name');
        const skills = rows.map(row => ({ id: row.id, name: row.name, type: row.skill_type }));
        const names = skills.map(s => s.name);
        res.json({ success: true, data: { skills, names } });
    } catch (error) {
        console.error('Error fetching skills:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// AWARDS API
// ============================================

app.get('/api/awards', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [rows] = await conn.execute(
            'SELECT id, year, organization, project_title, award_title, project_id FROM awards ORDER BY year DESC, id DESC'
        );
        const awards = rows.map(row => ({
            id: row.id,
            year: String(row.year),
            org: row.organization,
            project: row.project_title,
            award: row.award_title,
            projectId: row.project_id,
        }));
        res.json({ success: true, data: awards });
    } catch (error) {
        console.error('Error fetching awards:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// EXPERIMENTS API
// ============================================

app.get('/api/experiments', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [rows] = await conn.execute('SELECT id, code, name, description, project_id FROM experiments ORDER BY code');
        const experiments = rows.map(row => ({
            id: row.code,
            dbId: row.id,
            code: row.code,
            name: row.name,
            desc: row.description,
            projectId: row.project_id,
        }));
        res.json({ success: true, data: experiments });
    } catch (error) {
        console.error('Error fetching experiments:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// DB TEST API
// ============================================

app.get('/api/db-test', async (req, res) => {
    const startTime = Date.now();
    let conn;

    try {
        conn = await getConnection();
        const [testRows] = await conn.execute('SELECT 1 as test, NOW() as server_time');
        const [tables] = await conn.execute(
            `SELECT TABLE_NAME as table_name, TABLE_ROWS as row_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
            [process.env.MYSQL_DATABASE]
        );

        res.json({
            success: true,
            message: '✅ Database connection successful!',
            data: {
                test: testRows[0],
                tables,
                connectionTimeMs: Date.now() - startTime,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '❌ Database connection failed!',
            error: error.message,
            connectionTimeMs: Date.now() - startTime,
        });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// ADMIN: LOGIN + STATS
// ============================================
app.post('/api/admin/login', (req, res) => {
    const token = getConfiguredAdminToken();
    if (!token) {
        return res.status(503).json({
            success: false,
            error: 'Admin login not configured (set ADMIN_TOKEN in .env.local).',
        });
    }
    const submitted = req.body?.password || req.body?.token || '';
    const expected = process.env.ADMIN_PASSWORD || token;
    if (!submitted || submitted !== expected) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    return res.json({ success: true, data: { token } });
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const c = async (sql) => {
            const [rows] = await conn.execute(sql);
            return Number(rows[0]?.c || 0);
        };
        const data = {
            projects: await c("SELECT COUNT(*) AS c FROM projects WHERE project_type = 'project'"),
            tools: await c("SELECT COUNT(*) AS c FROM projects WHERE project_type = 'tool'"),
            skills: await c('SELECT COUNT(*) AS c FROM skills'),
            milestones: await c('SELECT COUNT(*) AS c FROM awards'),
            experiments: await c('SELECT COUNT(*) AS c FROM experiments'),
            messages: await c('SELECT COUNT(*) AS c FROM contact_messages'),
            newMessages: await c("SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'"),
            ideas: await c('SELECT COUNT(*) AS c FROM ideas').catch(() => 0),
        };
        res.json({ success: true, data });
    } catch (error) {
        console.error('admin/stats error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// PROJECTS: CREATE / READ ONE / UPDATE / DELETE
// ============================================
app.get('/api/projects/:id', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const project = await loadProject(conn, Number(req.params.id));
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('GET /api/projects/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

app.post('/api/projects', requireAdmin, async (req, res) => {
    const body = req.body || {};
    if (!body.title || !body.description || !body.category || !body.imageUrl) {
        return res.status(400).json({
            success: false,
            error: 'title, description, category, and imageUrl are required',
        });
    }
    let conn;
    try {
        conn = await getConnection();
        const slugBase = slugify(body.slug && body.slug.trim() ? body.slug : body.title);
        const slug = await ensureUniqueSlug(conn, slugBase);
        const projectType = body.projectType === 'tool' ? 'tool' : 'project';

        const [result] = await conn.execute(
            `INSERT INTO projects (slug, title, summary, description, category, project_type, image_url, link, featured)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug,
                body.title,
                body.summary ?? null,
                body.description,
                body.category,
                projectType,
                body.imageUrl,
                body.link || null,
                body.featured ? 1 : 0,
            ]
        );
        const insertId = result.insertId;
        if (Array.isArray(body.technologies) && body.technologies.length) {
            const ids = await upsertTechnologies(conn, body.technologies);
            await syncProjectTechnologies(conn, insertId, ids);
        }
        if (Array.isArray(body.phases) && body.phases.length) {
            const phaseEntries = await upsertPhases(conn, body.phases);
            await syncProjectPhases(conn, insertId, phaseEntries);
        }
        const created = await loadProject(conn, insertId);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error('POST /api/projects error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

const updateProjectHandler = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    let conn;
    try {
        conn = await getConnection();
        const [existing] = await conn.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, error: 'Project not found' });
        const current = existing[0];
        const body = req.body || {};
        let slug = current.slug;
        if (body.slug !== undefined && body.slug !== null) {
            const desired = slugify(body.slug || current.title);
            if (desired !== current.slug) slug = await ensureUniqueSlug(conn, desired, id);
        }
        const projectType = body.projectType ? (body.projectType === 'tool' ? 'tool' : 'project') : current.project_type;
        await conn.execute(
            `UPDATE projects SET slug = ?, title = ?, summary = ?, description = ?, category = ?, project_type = ?, image_url = ?, link = ?, featured = ? WHERE id = ?`,
            [
                slug,
                body.title ?? current.title,
                body.summary !== undefined ? body.summary : current.summary,
                body.description ?? current.description,
                body.category ?? current.category,
                projectType,
                body.imageUrl ?? current.image_url,
                body.link !== undefined ? (body.link || null) : current.link,
                body.featured !== undefined ? (body.featured ? 1 : 0) : current.featured,
                id,
            ]
        );
        if (Array.isArray(body.technologies)) {
            const ids = await upsertTechnologies(conn, body.technologies);
            await syncProjectTechnologies(conn, id, ids);
        }
        if (Array.isArray(body.phases)) {
            const phaseEntries = await upsertPhases(conn, body.phases);
            await syncProjectPhases(conn, id, phaseEntries);
        }
        const updated = await loadProject(conn, id);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('PATCH /api/projects/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
};
app.patch('/api/projects/:id', requireAdmin, updateProjectHandler);
app.put('/api/projects/:id', requireAdmin, updateProjectHandler);

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('DELETE FROM projects WHERE id = ?', [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Project not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/projects/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// SKILLS: CREATE / UPDATE / DELETE
// ============================================
const SKILL_TYPES = ['language', 'frontend', 'backend', 'database', 'tool', 'design', 'other'];

app.post('/api/skills', requireAdmin, async (req, res) => {
    const name = (req.body?.name || '').trim();
    const rawType = (req.body?.type || 'other').toLowerCase();
    const type = SKILL_TYPES.includes(rawType) ? rawType : 'other';
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    let conn;
    try {
        conn = await getConnection();
        await conn.execute(
            'INSERT INTO skills (name, skill_type) VALUES (?, ?) ON DUPLICATE KEY UPDATE skill_type = VALUES(skill_type)',
            [name, type]
        );
        const [rows] = await conn.execute('SELECT id, name, skill_type FROM skills WHERE name = ?', [name]);
        res.status(201).json({
            success: true,
            data: { id: rows[0].id, name: rows[0].name, type: rows[0].skill_type },
        });
    } catch (error) {
        console.error('POST /api/skills error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

const updateSkillHandler = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    let conn;
    try {
        conn = await getConnection();
        const [existing] = await conn.execute('SELECT id, name, skill_type FROM skills WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, error: 'Skill not found' });
        const current = existing[0];
        const name = (req.body?.name || current.name).trim();
        const rawType = (req.body?.type || current.skill_type).toLowerCase();
        const type = SKILL_TYPES.includes(rawType) ? rawType : current.skill_type;
        await conn.execute('UPDATE skills SET name = ?, skill_type = ? WHERE id = ?', [name, type, id]);
        res.json({ success: true, data: { id, name, type } });
    } catch (error) {
        console.error('PATCH /api/skills/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
};
app.patch('/api/skills/:id', requireAdmin, updateSkillHandler);
app.put('/api/skills/:id', requireAdmin, updateSkillHandler);

app.delete('/api/skills/:id', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('DELETE FROM skills WHERE id = ?', [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Skill not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/skills/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// AWARDS: CREATE / UPDATE / DELETE
// ============================================
app.post('/api/awards', requireAdmin, async (req, res) => {
    const b = req.body || {};
    const year = Number(b.year);
    const organization = (b.org || b.organization || '').trim();
    const projectTitle = (b.project || b.projectTitle || '').trim();
    const awardTitle = (b.award || b.awardTitle || '').trim();
    const projectId = typeof b.projectId === 'number' ? b.projectId : null;
    if (!Number.isFinite(year) || !organization || !projectTitle || !awardTitle) {
        return res.status(400).json({ success: false, error: 'year, organization, project_title, and award_title are required' });
    }
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute(
            'INSERT INTO awards (year, organization, project_title, award_title, project_id) VALUES (?, ?, ?, ?, ?)',
            [year, organization, projectTitle, awardTitle, projectId]
        );
        const [rows] = await conn.execute(
            'SELECT id, year, organization, project_title, award_title, project_id FROM awards WHERE id = ?',
            [result.insertId]
        );
        const r = rows[0];
        res.status(201).json({
            success: true,
            data: { id: r.id, year: String(r.year), org: r.organization, project: r.project_title, award: r.award_title, projectId: r.project_id },
        });
    } catch (error) {
        console.error('POST /api/awards error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

const updateAwardHandler = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    let conn;
    try {
        conn = await getConnection();
        const [existing] = await conn.execute('SELECT * FROM awards WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, error: 'Award not found' });
        const current = existing[0];
        const b = req.body || {};
        const year = b.year !== undefined && Number.isFinite(Number(b.year)) ? Number(b.year) : current.year;
        const organization = (b.org || b.organization || current.organization).trim();
        const projectTitle = (b.project || b.projectTitle || current.project_title).trim();
        const awardTitle = (b.award || b.awardTitle || current.award_title).trim();
        const projectId = b.projectId === null ? null : typeof b.projectId === 'number' ? b.projectId : current.project_id;
        await conn.execute(
            'UPDATE awards SET year = ?, organization = ?, project_title = ?, award_title = ?, project_id = ? WHERE id = ?',
            [year, organization, projectTitle, awardTitle, projectId, id]
        );
        res.json({
            success: true,
            data: { id, year: String(year), org: organization, project: projectTitle, award: awardTitle, projectId },
        });
    } catch (error) {
        console.error('PATCH /api/awards/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
};
app.patch('/api/awards/:id', requireAdmin, updateAwardHandler);
app.put('/api/awards/:id', requireAdmin, updateAwardHandler);

app.delete('/api/awards/:id', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('DELETE FROM awards WHERE id = ?', [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Award not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/awards/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// EXPERIMENTS: CREATE / UPDATE / DELETE
// ============================================
app.post('/api/experiments', requireAdmin, async (req, res) => {
    const b = req.body || {};
    const code = (b.code || '').trim();
    const name = (b.name || '').trim();
    const description = (b.description || b.desc || '').trim();
    const projectId = typeof b.projectId === 'number' ? b.projectId : null;
    if (!code || !name || !description) {
        return res.status(400).json({ success: false, error: 'code, name, and description are required' });
    }
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute(
            'INSERT INTO experiments (code, name, description, project_id) VALUES (?, ?, ?, ?)',
            [code, name, description, projectId]
        );
        const [rows] = await conn.execute(
            'SELECT id, code, name, description, project_id FROM experiments WHERE id = ?',
            [result.insertId]
        );
        const r = rows[0];
        res.status(201).json({
            success: true,
            data: { id: r.code, dbId: r.id, code: r.code, name: r.name, desc: r.description, projectId: r.project_id },
        });
    } catch (error) {
        console.error('POST /api/experiments error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

const updateExperimentHandler = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    let conn;
    try {
        conn = await getConnection();
        const [existing] = await conn.execute('SELECT * FROM experiments WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, error: 'Experiment not found' });
        const current = existing[0];
        const b = req.body || {};
        const code = (b.code || current.code).trim();
        const name = (b.name || current.name).trim();
        const description = (b.description || b.desc || current.description).trim();
        const projectId = b.projectId === null ? null : typeof b.projectId === 'number' ? b.projectId : current.project_id;
        await conn.execute(
            'UPDATE experiments SET code = ?, name = ?, description = ?, project_id = ? WHERE id = ?',
            [code, name, description, projectId, id]
        );
        res.json({
            success: true,
            data: { id: code, dbId: id, code, name, desc: description, projectId },
        });
    } catch (error) {
        console.error('PATCH /api/experiments/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
};
app.patch('/api/experiments/:id', requireAdmin, updateExperimentHandler);
app.put('/api/experiments/:id', requireAdmin, updateExperimentHandler);

app.delete('/api/experiments/:id', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('DELETE FROM experiments WHERE id = ?', [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Experiment not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/experiments/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// ============================================
// CONTACT MESSAGES
// ============================================
const ALLOWED_TOPICS = ['collaboration', 'mentorship', 'freelance', 'other'];
const ALLOWED_STATUSES = ['new', 'replied', 'archived'];

app.get('/api/contact-messages', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [rows] = await conn.execute(
            `SELECT id, name, email, topic, message, status, user_agent, created_at FROM contact_messages ORDER BY created_at DESC, id DESC`
        );
        const list = rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            topic: row.topic,
            message: row.message,
            status: row.status,
            userAgent: row.user_agent,
            createdAt: row.created_at,
        }));
        res.json({
            success: true,
            data: list,
            meta: {
                total: list.length,
                newCount: list.filter((m) => m.status === 'new').length,
            },
        });
    } catch (error) {
        console.error('GET /api/contact-messages error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

app.post('/api/contact-messages', async (req, res) => {
    const b = req.body || {};
    const name = (b.name || '').trim();
    const email = (b.email || '').trim();
    const message = (b.message || '').trim();
    const topic = ALLOWED_TOPICS.includes(b.topic) ? b.topic : 'other';
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Name, email, and message are required' });
    }
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute(
            `INSERT INTO contact_messages (name, email, topic, message, status, user_agent) VALUES (?, ?, ?, ?, 'new', ?)`,
            [name.slice(0, 100), email.slice(0, 255), topic, message, (req.headers['user-agent'] || '').slice(0, 255) || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('POST /api/contact-messages error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

const updateContactStatusHandler = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    const status = (req.body?.status || '').toLowerCase();
    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: 'status must be new | replied | archived' });
    }
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Message not found' });
        const [rows] = await conn.execute('SELECT id, name, email, topic, message, status, user_agent, created_at FROM contact_messages WHERE id = ?', [id]);
        const r = rows[0];
        res.json({
            success: true,
            data: {
                id: r.id,
                name: r.name,
                email: r.email,
                topic: r.topic,
                message: r.message,
                status: r.status,
                userAgent: r.user_agent,
                createdAt: r.created_at,
            },
        });
    } catch (error) {
        console.error('PATCH /api/contact-messages/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
};
app.patch('/api/contact-messages/:id', requireAdmin, updateContactStatusHandler);
app.put('/api/contact-messages/:id', requireAdmin, updateContactStatusHandler);

app.delete('/api/contact-messages/:id', requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const [result] = await conn.execute('DELETE FROM contact_messages WHERE id = ?', [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/contact-messages/:id error:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        if (conn) await conn.end();
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
    console.log(`\n📌 Available endpoints (public + admin):`);
    console.log(`   GET    /api/projects[?type=project|tool|?slug=...]`);
    console.log(`   POST   /api/projects  (admin)`);
    console.log(`   PATCH  /api/projects/:id  (admin)`);
    console.log(`   DELETE /api/projects/:id  (admin)`);
    console.log(`   GET    /api/skills`);
    console.log(`   POST   /api/skills  (admin)`);
    console.log(`   PATCH  /api/skills/:id  (admin)`);
    console.log(`   DELETE /api/skills/:id  (admin)`);
    console.log(`   GET    /api/awards`);
    console.log(`   POST   /api/awards  (admin)`);
    console.log(`   PATCH  /api/awards/:id  (admin)`);
    console.log(`   DELETE /api/awards/:id  (admin)`);
    console.log(`   GET    /api/experiments`);
    console.log(`   POST   /api/experiments  (admin)`);
    console.log(`   PATCH  /api/experiments/:id  (admin)`);
    console.log(`   DELETE /api/experiments/:id  (admin)`);
    console.log(`   GET    /api/contact-messages  (admin)`);
    console.log(`   POST   /api/contact-messages`);
    console.log(`   PATCH  /api/contact-messages/:id  (admin)`);
    console.log(`   DELETE /api/contact-messages/:id  (admin)`);
    console.log(`   POST   /api/admin/login`);
    console.log(`   GET    /api/admin/stats  (admin)`);
    console.log(`   GET    /api/ideas  +  /api/db-test`);
    console.log(`\n💡 Configure Vite proxy to forward /api to this server\n`);
});
