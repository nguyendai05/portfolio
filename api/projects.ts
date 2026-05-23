import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from './_lib/db';
import { applyCors, requireAdmin } from './_lib/auth';
import {
  createProject,
  listProjects,
  loadProjectBySlug,
  type ProjectType,
} from './_lib/projects';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const conn = await getConnection();
      try {
        const { type, slug } = req.query;

        if (slug && typeof slug === 'string') {
          const project = await loadProjectBySlug(conn, slug);
          if (!project) {
            return res
              .status(404)
              .json({ success: false, error: 'Project not found' });
          }
          return res.status(200).json({ success: true, data: project });
        }

        const projectType =
          typeof type === 'string' && (type === 'project' || type === 'tool')
            ? (type as ProjectType)
            : undefined;
        const projects = await listProjects(conn, projectType);
        return res.status(200).json({ success: true, data: projects });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      if (!body.title || !body.description || !body.category || !body.imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'title, description, category, and imageUrl are required',
        });
      }
      const conn = await getConnection();
      try {
        const created = await createProject(conn, {
          slug: typeof body.slug === 'string' ? body.slug : undefined,
          title: String(body.title),
          summary:
            typeof body.summary === 'string' ? body.summary : null,
          description: String(body.description),
          category: String(body.category),
          projectType:
            body.projectType === 'tool' ? 'tool' : 'project',
          imageUrl: String(body.imageUrl),
          link: typeof body.link === 'string' ? body.link : null,
          featured: Boolean(body.featured),
          technologies: Array.isArray(body.technologies)
            ? (body.technologies as unknown[]).map((s) => String(s))
            : [],
          phases: Array.isArray(body.phases)
            ? (body.phases as unknown[]).map((s) => String(s))
            : [],
        });
        return res.status(201).json({ success: true, data: created });
      } finally {
        await conn.end();
      }
    }

    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const formatted = formatDbError(error);
    console.error('Database error in /api/projects:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
