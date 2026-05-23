import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection, formatDbError } from '../_lib/db';
import { applyCors, requireAdmin } from '../_lib/auth';
import {
  deleteProject,
  loadProjectById,
  updateProject,
  type ProjectInput,
} from '../_lib/projects';

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeBody(body: Record<string, unknown>): Partial<ProjectInput> {
  const out: Partial<ProjectInput> = {};
  if (typeof body.title === 'string') out.title = body.title;
  if ('summary' in body)
    out.summary = typeof body.summary === 'string' ? body.summary : null;
  if (typeof body.description === 'string') out.description = body.description;
  if (typeof body.category === 'string') out.category = body.category;
  if (body.projectType === 'project' || body.projectType === 'tool') {
    out.projectType = body.projectType;
  }
  if (typeof body.imageUrl === 'string') out.imageUrl = body.imageUrl;
  if ('link' in body)
    out.link = typeof body.link === 'string' ? body.link : null;
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

  const id = parseId(req.query.id);
  if (!id) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
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
    console.error('Database error in /api/projects/[id]:', formatted);
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
