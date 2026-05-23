import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';
import {
  createProject,
  deleteProject,
  listProjects,
  loadProjectById,
  loadProjectBySlug,
  updateProject,
  type ProjectInput,
  type ProjectType,
} from '../_lib/projects';

function parseId(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getSlugSegments(req: VercelRequest): string[] {
  const raw = req.query.slug;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

function normalizeBody(body: Record<string, unknown>): Partial<ProjectInput> {
  const out: Partial<ProjectInput> = {};
  if (typeof body.title === 'string') out.title = body.title;
  if ('summary' in body) {
    out.summary = typeof body.summary === 'string' ? body.summary : null;
  }
  if (typeof body.description === 'string') out.description = body.description;
  if (typeof body.category === 'string') out.category = body.category;
  if (body.projectType === 'project' || body.projectType === 'tool') {
    out.projectType = body.projectType;
  }
  if (typeof body.imageUrl === 'string') out.imageUrl = body.imageUrl;
  if ('link' in body) {
    out.link = typeof body.link === 'string' ? body.link : null;
  }
  if ('featured' in body) out.featured = Boolean(body.featured);
  if ('slug' in body && typeof body.slug === 'string') out.slug = body.slug;
  if (Array.isArray(body.technologies)) {
    out.technologies = (body.technologies as unknown[]).map((s) => String(s));
  }
  if (Array.isArray(body.phases)) {
    out.phases = (body.phases as unknown[]).map((s) => String(s));
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getSlugSegments(req);
  const id = segments.length === 1 ? parseId(segments[0]) : null;

  try {
    // ─── Collection routes: /api/projects ───────────────────────────
    if (segments.length === 0) {
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
        if (
          !body.title ||
          !body.description ||
          !body.category ||
          !body.imageUrl
        ) {
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
            projectType: body.projectType === 'tool' ? 'tool' : 'project',
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
    }

    // ─── Item routes: /api/projects/:id ─────────────────────────────
    if (!id) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }

    if (req.method === 'GET') {
      const conn = await getConnection();
      try {
        const project = await loadProjectById(conn, id);
        if (!project) {
          return res
            .status(404)
            .json({ success: false, error: 'Project not found' });
        }
        return res.status(200).json({ success: true, data: project });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;
      const body = (req.body || {}) as Record<string, unknown>;
      const conn = await getConnection();
      try {
        const updated = await updateProject(conn, id, normalizeBody(body));
        if (!updated) {
          return res
            .status(404)
            .json({ success: false, error: 'Project not found' });
        }
        return res.status(200).json({ success: true, data: updated });
      } finally {
        await conn.end();
      }
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const conn = await getConnection();
      try {
        const removed = await deleteProject(conn, id);
        if (!removed) {
          return res
            .status(404)
            .json({ success: false, error: 'Project not found' });
        }
        return res.status(200).json({ success: true });
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
