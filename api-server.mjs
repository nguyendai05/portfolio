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
        const [rows] = await conn.execute('SELECT name, skill_type FROM skills ORDER BY name');
        const skills = rows.map(row => ({ name: row.name, type: row.skill_type }));
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

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
    console.log(`\n📌 Available endpoints:`);
    console.log(`   GET  /api/ideas`);
    console.log(`   POST /api/ideas`);
    console.log(`   PATCH /api/ideas/:id`);
    console.log(`   DELETE /api/ideas/:id`);
    console.log(`   GET  /api/projects`);
    console.log(`   GET  /api/projects?type=project|tool`);
    console.log(`   GET  /api/skills`);
    console.log(`   GET  /api/awards`);
    console.log(`   GET  /api/experiments`);
    console.log(`   GET  /api/db-test`);
    console.log(`\n💡 Configure Vite proxy to forward /api to this server\n`);
});
