import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formatDbError, getConnection, isDuplicateKeyError } from './db.js';
import {
  applyCors,
  applySecurityHeaders,
  requireAdmin,
} from './auth.js';
import {
  attachRequestSession,
  handleAdminLogin as handleSessionLogin,
  handleAdminLogout,
  handleAdminRevokeAll,
  handleAdminSession,
} from './admin.js';
import { handleAiChat } from './ai.js';
import { handleContact, handleContactResend } from './contact.js';
import { getRequestId, getResponseCode, initializeRequestContext, logRequest } from './observability.js';
import { decodeCursor, encodeCursor, parsePageLimit } from './pagination.js';
import { writeAdminAudit } from './audit.js';
import { handleMaintenance } from './maintenance.js';
import { getAttachedSession } from './session-auth.js';
import { fieldErrors, projectCreateSchema, projectUpdateSchema } from './validation.js';
import {
  ContactRow,
  isAllowedStatus,
  mapContactRow,
} from './contact-messages.js';
import {
  createProject,
  deleteProject,
  listProjects,
  listProjectsPage,
  loadProjectById,
  loadProjectBySlug,
  updateProject,
  type ProjectInput,
  type ProjectType,
} from './projects.js';

type Conn = import('mysql2/promise').PoolConnection;

const SKILL_TYPES = [
  'language',
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'other',
];

// ─── Helpers ────────────────────────────────────────────────────
function parseNumericId(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getApiPath(req: VercelRequest): string {
  const rewrittenPath = getQueryParam(req, '__path');
  if (rewrittenPath) {
    return `/${rewrittenPath.replace(/^\/+/, '')}`;
  }
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '');
  return path || '/';
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const query = req.query ?? {};
  const v = query[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

function methodNotAllowed(res: VercelResponse) {
  return res
    .status(405)
    .json({ success: false, error: 'Method not allowed' });
}

function notFound(res: VercelResponse) {
  return res.status(404).json({ success: false, error: 'Not found' });
}

function setPublicPortfolioCacheHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader(
    'Vercel-CDN-Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=86400',
  );
}

// ─── Skill row ──────────────────────────────────────────────────
interface SkillRow {
  id: number;
  name: string;
  skill_type: string;
}

interface AwardRow {
  id: number;
  year: number;
  organization: string;
  project_title: string;
  award_title: string;
  project_id: number | null;
}

function mapAward(row: AwardRow) {
  return {
    id: row.id,
    year: String(row.year),
    org: row.organization,
    project: row.project_title,
    award: row.award_title,
    projectId: row.project_id,
  };
}

interface ExperimentRow {
  id: number;
  code: string;
  name: string;
  description: string;
  project_id: number | null;
}

function mapExperiment(row: ExperimentRow) {
  return {
    id: row.code,
    dbId: row.id,
    code: row.code,
    name: row.name,
    desc: row.description,
    projectId: row.project_id,
  };
}

interface IdeaRow {
  id: number;
  title: string;
  description: string;
  tags: string | unknown[] | null;
  difficulty: string;
  upvotes: number;
  looking_for_team: number | boolean;
  author: string;
  created_at: string;
}

function mapIdea(row: IdeaRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags:
      typeof row.tags === 'string'
        ? JSON.parse(row.tags || '[]')
        : row.tags || [],
    difficulty: row.difficulty,
    upvotes: row.upvotes,
    lookingForTeam: Boolean(row.looking_for_team),
    author: row.author,
    createdAt: row.created_at,
  };
}

interface CommentRow {
  id: number;
  idea_id: number;
  author: string;
  content: string;
  created_at: string;
}

function mapComment(row: CommentRow) {
  return {
    id: row.id,
    ideaId: row.idea_id,
    author: row.author,
    content: row.content,
    createdAt: row.created_at,
  };
}

function normalizeProjectBody(
  body: Record<string, unknown>,
): Partial<ProjectInput> {
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

async function withConn<T>(fn: (conn: Conn) => Promise<T>): Promise<T> {
  const conn = await getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

async function count(conn: Conn, query: string): Promise<number> {
  const [rows] = await conn.execute(query);
  const list = rows as Array<{ c: number | string | bigint }>;
  if (list.length === 0) return 0;
  const value = list[0].c;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return Number(value || 0);
}

// ─── Admin ──────────────────────────────────────────────────────
async function handleAdminVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  if (!requireAdmin(req, res)) return;
  return res.status(200).json({ success: true, data: { valid: true } });
}

async function handleAdminStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  if (!requireAdmin(req, res)) return;
  return withConn(async (conn) => {
    const [
      projects,
      tools,
      skills,
      milestones,
      experiments,
      messages,
      newMessages,
    ] = await Promise.all([
      count(
        conn,
        "SELECT COUNT(*) AS c FROM projects WHERE project_type = 'project'",
      ),
      count(
        conn,
        "SELECT COUNT(*) AS c FROM projects WHERE project_type = 'tool'",
      ),
      count(conn, 'SELECT COUNT(*) AS c FROM skills'),
      count(conn, 'SELECT COUNT(*) AS c FROM awards'),
      count(conn, 'SELECT COUNT(*) AS c FROM experiments'),
      count(conn, 'SELECT COUNT(*) AS c FROM contact_messages'),
      count(
        conn,
        "SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'",
      ),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        projects,
        tools,
        skills,
        milestones,
        experiments,
        messages,
        newMessages,
      },
    });
  });
}

// ─── Projects ───────────────────────────────────────────────────
async function handleProjectsCollection(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const slug = getQueryParam(req, 'slug');
      const type = getQueryParam(req, 'type');
      if (slug) {
        setPublicPortfolioCacheHeaders(res);
        const project = await loadProjectBySlug(conn, slug);
        if (!project) {
          return res
            .status(404)
            .json({ success: false, error: 'Project not found' });
        }
        return res.status(200).json({ success: true, data: project });
      }
      const projectType =
        type === 'project' || type === 'tool'
          ? (type as ProjectType)
          : undefined;
      if (getQueryParam(req, 'admin') === 'true') {
        if (!requireAdmin(req, res)) return;
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('Vercel-CDN-Cache-Control', 'private, no-store');
        const limit = parsePageLimit(getQueryParam(req, 'limit'), 20, 100);
        const rawCursor = getQueryParam(req, 'cursor');
        const cursor = decodeCursor(rawCursor);
        if (rawCursor && !cursor) {
          return res.status(400).json({ success: false, error: 'Invalid cursor', code: 'INVALID_CURSOR' });
        }
        const page = await listProjectsPage(conn, { projectType, limit, cursor });
        return res.status(200).json({
          success: true,
          data: {
            items: page.items,
            pageInfo: { nextCursor: page.nextCursorValue ? encodeCursor(page.nextCursorValue) : null },
          },
        });
      }
      setPublicPortfolioCacheHeaders(res);
      const projects = await listProjects(conn, projectType);
      return res.status(200).json({ success: true, data: projects });
    });
  }
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const parsed = projectCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Project is invalid',
        code: 'VALIDATION_ERROR',
        fieldErrors: fieldErrors(parsed.error),
      });
    }
    try {
      return await withConn(async (conn) => {
        const created = await createProject(conn, parsed.data);
        return res.status(201).json({ success: true, data: created });
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return res.status(409).json({ success: false, error: 'Project slug already exists', code: 'CONFLICT' });
      }
      throw error;
    }
  }
  return methodNotAllowed(res);
}

async function handleProjectItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (req.method === 'GET') {
    setPublicPortfolioCacheHeaders(res);
    return withConn(async (conn) => {
      const project = await loadProjectById(conn, id);
      if (!project) {
        return res
          .status(404)
          .json({ success: false, error: 'Project not found' });
      }
      return res.status(200).json({ success: true, data: project });
    });
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const parsed = projectUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({
      success: false,
      error: 'Project is invalid',
      code: 'VALIDATION_ERROR',
      fieldErrors: fieldErrors(parsed.error),
    });
    try {
      return await withConn(async (conn) => {
        const updated = await updateProject(conn, id, parsed.data);
        if (!updated) return res.status(404).json({ success: false, error: 'Project not found' });
        return res.status(200).json({ success: true, data: updated });
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return res.status(409).json({ success: false, error: 'Project slug already exists', code: 'CONFLICT' });
      }
      throw error;
    }
  }
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    return withConn(async (conn) => {
      const removed = await deleteProject(conn, id);
      if (!removed) {
        return res
          .status(404)
          .json({ success: false, error: 'Project not found' });
      }
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Skills ─────────────────────────────────────────────────────
async function handleSkillsCollection(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT id, name, skill_type FROM skills ORDER BY skill_type, name',
      );
      const list = rows as SkillRow[];
      const skills = list.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.skill_type,
      }));
      return res
        .status(200)
        .json({ success: true, data: { skills, names: skills.map((s) => s.name) } });
    });
  }
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type =
      typeof body.type === 'string' ? body.type.toLowerCase() : 'other';
    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: 'Name is required' });
    }
    const skillType = SKILL_TYPES.includes(type) ? type : 'other';
    return withConn(async (conn) => {
      await conn.execute(
        `INSERT INTO skills (name, skill_type)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE skill_type = VALUES(skill_type)`,
        [name, skillType],
      );
      const [rows] = await conn.execute(
        'SELECT id, name, skill_type FROM skills WHERE name = ?',
        [name],
      );
      const row = (rows as SkillRow[])[0];
      if (!row) {
        return res
          .status(500)
          .json({ success: false, error: 'Failed to load created skill' });
      }
      return res.status(201).json({
        success: true,
        data: { id: row.id, name: row.name, type: row.skill_type },
      });
    });
  }
  return methodNotAllowed(res);
}

async function handleSkillItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    return withConn(async (conn) => {
      const [existing] = await conn.execute(
        'SELECT id, name, skill_type FROM skills WHERE id = ?',
        [id],
      );
      const list = existing as SkillRow[];
      if (list.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: 'Skill not found' });
      }
      const current = list[0];
      const name =
        typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : current.name;
      const type =
        typeof body.type === 'string'
          ? body.type.toLowerCase()
          : current.skill_type;
      const skillType = SKILL_TYPES.includes(type) ? type : current.skill_type;
      await conn.execute(
        'UPDATE skills SET name = ?, skill_type = ? WHERE id = ?',
        [name, skillType, id],
      );
      return res
        .status(200)
        .json({ success: true, data: { id, name, type: skillType } });
    });
  }
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'DELETE FROM skills WHERE id = ?',
        [id],
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (!affected) {
        return res
          .status(404)
          .json({ success: false, error: 'Skill not found' });
      }
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Awards ─────────────────────────────────────────────────────
async function handleAwardsCollection(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT id, year, organization, project_title, award_title, project_id
           FROM awards
          ORDER BY year DESC, id DESC`,
      );
      return res
        .status(200)
        .json({ success: true, data: (rows as AwardRow[]).map(mapAward) });
    });
  }
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    const year = Number(body.year);
    const organization =
      typeof body.org === 'string'
        ? body.org.trim()
        : typeof body.organization === 'string'
          ? body.organization.trim()
          : '';
    const projectTitle =
      typeof body.project === 'string'
        ? body.project.trim()
        : typeof body.projectTitle === 'string'
          ? body.projectTitle.trim()
          : '';
    const awardTitle =
      typeof body.award === 'string'
        ? body.award.trim()
        : typeof body.awardTitle === 'string'
          ? body.awardTitle.trim()
          : '';
    const projectId =
      typeof body.projectId === 'number' && Number.isFinite(body.projectId)
        ? body.projectId
        : null;
    if (
      !Number.isFinite(year) ||
      !organization ||
      !projectTitle ||
      !awardTitle
    ) {
      return res.status(400).json({
        success: false,
        error: 'year, organization, project_title, and award_title are required',
      });
    }
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO awards (year, organization, project_title, award_title, project_id)
           VALUES (?, ?, ?, ?, ?)`,
        [year, organization, projectTitle, awardTitle, projectId],
      );
      const insertId = (result as { insertId: number }).insertId;
      const [rows] = await conn.execute(
        `SELECT id, year, organization, project_title, award_title, project_id
           FROM awards WHERE id = ?`,
        [insertId],
      );
      const created = (rows as AwardRow[])[0];
      return res.status(201).json({
        success: true,
        data: created ? mapAward(created) : { id: insertId },
      });
    });
  }
  return methodNotAllowed(res);
}

async function handleAwardItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    return withConn(async (conn) => {
      const [existingRows] = await conn.execute(
        'SELECT id, year, organization, project_title, award_title, project_id FROM awards WHERE id = ?',
        [id],
      );
      const list = existingRows as AwardRow[];
      if (list.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: 'Award not found' });
      }
      const current = list[0];
      const year =
        body.year !== undefined && Number.isFinite(Number(body.year))
          ? Number(body.year)
          : current.year;
      const organization =
        typeof body.org === 'string'
          ? body.org.trim()
          : typeof body.organization === 'string'
            ? body.organization.trim()
            : current.organization;
      const projectTitle =
        typeof body.project === 'string'
          ? body.project.trim()
          : typeof body.projectTitle === 'string'
            ? body.projectTitle.trim()
            : current.project_title;
      const awardTitle =
        typeof body.award === 'string'
          ? body.award.trim()
          : typeof body.awardTitle === 'string'
            ? body.awardTitle.trim()
            : current.award_title;
      const projectId =
        body.projectId === null
          ? null
          : typeof body.projectId === 'number' &&
              Number.isFinite(body.projectId)
            ? body.projectId
            : current.project_id;
      await conn.execute(
        `UPDATE awards SET year = ?, organization = ?, project_title = ?, award_title = ?, project_id = ? WHERE id = ?`,
        [year, organization, projectTitle, awardTitle, projectId, id],
      );
      const [rows] = await conn.execute(
        'SELECT id, year, organization, project_title, award_title, project_id FROM awards WHERE id = ?',
        [id],
      );
      const updated = (rows as AwardRow[])[0];
      return res
        .status(200)
        .json({ success: true, data: updated ? mapAward(updated) : { id } });
    });
  }
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'DELETE FROM awards WHERE id = ?',
        [id],
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (!affected) {
        return res
          .status(404)
          .json({ success: false, error: 'Award not found' });
      }
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Experiments ────────────────────────────────────────────────
async function handleExperimentsCollection(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT id, code, name, description, project_id
           FROM experiments
          ORDER BY code`,
      );
      return res.status(200).json({
        success: true,
        data: (rows as ExperimentRow[]).map(mapExperiment),
      });
    });
  }
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : typeof body.desc === 'string'
          ? body.desc.trim()
          : '';
    const projectId =
      typeof body.projectId === 'number' && Number.isFinite(body.projectId)
        ? body.projectId
        : null;
    if (!code || !name || !description) {
      return res.status(400).json({
        success: false,
        error: 'code, name, and description are required',
      });
    }
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO experiments (code, name, description, project_id)
           VALUES (?, ?, ?, ?)`,
        [code, name, description, projectId],
      );
      const insertId = (result as { insertId: number }).insertId;
      const [rows] = await conn.execute(
        `SELECT id, code, name, description, project_id FROM experiments WHERE id = ?`,
        [insertId],
      );
      const created = (rows as ExperimentRow[])[0];
      return res.status(201).json({
        success: true,
        data: created ? mapExperiment(created) : { id: insertId },
      });
    });
  }
  return methodNotAllowed(res);
}

async function handleExperimentItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = (req.body || {}) as Record<string, unknown>;
    return withConn(async (conn) => {
      const [existingRows] = await conn.execute(
        'SELECT id, code, name, description, project_id FROM experiments WHERE id = ?',
        [id],
      );
      const list = existingRows as ExperimentRow[];
      if (list.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: 'Experiment not found' });
      }
      const current = list[0];
      const code =
        typeof body.code === 'string' && body.code.trim()
          ? body.code.trim()
          : current.code;
      const name =
        typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : current.name;
      const description =
        typeof body.description === 'string'
          ? body.description.trim()
          : typeof body.desc === 'string'
            ? body.desc.trim()
            : current.description;
      const projectId =
        body.projectId === null
          ? null
          : typeof body.projectId === 'number' &&
              Number.isFinite(body.projectId)
            ? body.projectId
            : current.project_id;
      await conn.execute(
        `UPDATE experiments SET code = ?, name = ?, description = ?, project_id = ? WHERE id = ?`,
        [code, name, description, projectId, id],
      );
      const [rows] = await conn.execute(
        'SELECT id, code, name, description, project_id FROM experiments WHERE id = ?',
        [id],
      );
      const updated = (rows as ExperimentRow[])[0];
      return res.status(200).json({
        success: true,
        data: updated ? mapExperiment(updated) : { id },
      });
    });
  }
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'DELETE FROM experiments WHERE id = ?',
        [id],
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (!affected) {
        return res
          .status(404)
          .json({ success: false, error: 'Experiment not found' });
      }
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Contact Messages ───────────────────────────────────────────
async function handleContactMessagesCollection(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const limit = parsePageLimit(getQueryParam(req, 'limit'), 20, 100);
    const rawCursor = getQueryParam(req, 'cursor');
    const cursor = decodeCursor(rawCursor);
    if (rawCursor && !cursor) {
      return res.status(400).json({ success: false, error: 'Invalid cursor', code: 'INVALID_CURSOR' });
    }
    return withConn(async (conn) => {
      const params: unknown[] = [];
      const cursorClause = cursor
        ? 'WHERE (created_at < ? OR (created_at = ? AND id < ?))'
        : '';
      if (cursor) params.push(cursor.createdAt, cursor.createdAt, cursor.id);
      params.push(limit + 1);
      const [rows] = await conn.execute(
        `SELECT id, name, email, topic, message, status, delivery_status, user_agent, created_at
           FROM contact_messages
           ${cursorClause}
          ORDER BY created_at DESC, id DESC
          LIMIT ?`,
        params,
      );
      const page = rows as ContactRow[];
      const hasMore = page.length > limit;
      const visibleRows = page.slice(0, limit);
      const list = visibleRows.map(mapContactRow);
      const newCount = list.filter((m) => m.status === 'new').length;
      const tail = visibleRows.at(-1);
      return res.status(200).json({
        success: true,
        data: {
          items: list,
          pageInfo: {
            nextCursor: hasMore && tail
              ? encodeCursor({ createdAt: new Date(tail.created_at).toISOString(), id: tail.id })
              : null,
          },
        },
        meta: { pageSize: list.length, newCount },
      });
    });
  }
  if (req.method === 'POST') {
    return res.status(405).json({ success: false, error: 'Use /api/contact to submit a message', code: 'METHOD_NOT_ALLOWED' });
    /* legacy implementation kept below for migration diff context only
    const body = (req.body || {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message =
      typeof body.message === 'string' ? body.message.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic : 'other';
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required',
      });
    }
    return withConn(async (conn) => {
      const newId = await insertContactMessage(conn, {
        name,
        email,
        topic,
        message,
        userAgent:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : null,
      });
      return res.status(201).json({ success: true, data: { id: newId } });
    });
    */
  }
  return methodNotAllowed(res);
}

async function handleContactMessageItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (!requireAdmin(req, res)) return;
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = (req.body || {}) as Record<string, unknown>;
    const status =
      typeof body.status === 'string' ? body.status.toLowerCase() : '';
    if (!isAllowedStatus(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be new | replied | archived',
      });
    }
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'UPDATE contact_messages SET status = ? WHERE id = ?',
        [status, id],
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (!affected) {
        return res
          .status(404)
          .json({ success: false, error: 'Message not found' });
      }
      const [rows] = await conn.execute(
        `SELECT id, name, email, topic, message, status, delivery_status, user_agent, created_at
           FROM contact_messages WHERE id = ?`,
        [id],
      );
      const updated = (rows as ContactRow[])[0];
      return res
        .status(200)
        .json({ success: true, data: updated ? mapContactRow(updated) : { id } });
    });
  }
  if (req.method === 'DELETE') {
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'DELETE FROM contact_messages WHERE id = ?',
        [id],
      );
      const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
      if (!affected) {
        return res
          .status(404)
          .json({ success: false, error: 'Message not found' });
      }
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Ideas ──────────────────────────────────────────────────────
async function handleIdeasCollection(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const limit = parsePageLimit(getQueryParam(req, 'limit'), 20, 100);
    const rawCursor = getQueryParam(req, 'cursor');
    const cursor = decodeCursor(rawCursor);
    if (rawCursor && !cursor) {
      return res.status(400).json({ success: false, error: 'Invalid cursor', code: 'INVALID_CURSOR' });
    }
    return withConn(async (conn) => {
      const params: unknown[] = [];
      const cursorClause = cursor
        ? 'WHERE (created_at < ? OR (created_at = ? AND id < ?))'
        : '';
      if (cursor) params.push(cursor.createdAt, cursor.createdAt, cursor.id);
      params.push(limit + 1);
      const [rows] = await conn.execute(
        `SELECT id, title, description, tags, difficulty, upvotes, looking_for_team, author, created_at
           FROM ideas ${cursorClause}
          ORDER BY created_at DESC, id DESC LIMIT ?`,
        params,
      );
      const page = rows as IdeaRow[];
      const hasMore = page.length > limit;
      const visibleRows = page.slice(0, limit);
      const tail = visibleRows.at(-1);
      return res.status(200).json({
        success: true,
        data: {
          items: visibleRows.map(mapIdea),
          pageInfo: {
            nextCursor: hasMore && tail
              ? encodeCursor({ createdAt: new Date(tail.created_at).toISOString(), id: tail.id })
              : null,
          },
        },
      });
    });
  }
  if (req.method === 'POST') {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title : '';
    const description =
      typeof body.description === 'string' ? body.description : '';
    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, error: 'Title and description required' });
    }
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO ideas (title, description, tags, difficulty, author, looking_for_team, upvotes)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [
          title,
          description,
          JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
          typeof body.difficulty === 'string' ? body.difficulty : 'Medium',
          typeof body.author === 'string' && body.author
            ? body.author
            : 'Anonymous',
          body.lookingForTeam ? 1 : 0,
        ],
      );
      const insertId = (result as { insertId: number }).insertId;
      return res.status(201).json({ success: true, data: { id: insertId } });
    });
  }
  return methodNotAllowed(res);
}

async function handleIdeaItem(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT id, title, description, tags, difficulty, upvotes,
                looking_for_team, author, created_at
           FROM ideas WHERE id = ?`,
        [id],
      );
      const row = (rows as IdeaRow[])[0];
      if (!row) {
        return res
          .status(404)
          .json({ success: false, error: 'Idea not found' });
      }
      return res.status(200).json({ success: true, data: mapIdea(row) });
    });
  }
  if (req.method === 'PATCH') {
    return withConn(async (conn) => {
      await conn.execute(
        'UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?',
        [id],
      );
      const [rows] = await conn.execute(
        'SELECT upvotes FROM ideas WHERE id = ?',
        [id],
      );
      const upvotes = (rows as Array<{ upvotes: number }>)[0]?.upvotes ?? 0;
      return res.status(200).json({ success: true, data: { upvotes } });
    });
  }
  if (req.method === 'DELETE') {
    return withConn(async (conn) => {
      await conn.execute('DELETE FROM ideas WHERE id = ?', [id]);
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

async function handleIdeaComments(
  req: VercelRequest,
  res: VercelResponse,
  ideaId: string,
) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT id, idea_id, author, content, created_at
           FROM idea_comments WHERE idea_id = ?
          ORDER BY created_at ASC, id ASC LIMIT 100`,
        [ideaId],
      );
      return res
        .status(200)
        .json({ success: true, data: (rows as CommentRow[]).map(mapComment) });
    });
  }
  if (req.method === 'POST') {
    const body = (req.body || {}) as Record<string, unknown>;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const author =
      typeof body.author === 'string' && body.author.trim()
        ? body.author.trim()
        : 'Anonymous';
    if (!content) {
      return res
        .status(400)
        .json({ success: false, error: 'Content is required' });
    }
    return withConn(async (conn) => {
      const [result] = await conn.execute(
        'INSERT INTO idea_comments (idea_id, author, content) VALUES (?, ?, ?)',
        [ideaId, author, content],
      );
      const insertId = (result as { insertId: number }).insertId;
      const [rows] = await conn.execute(
        'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE id = ?',
        [insertId],
      );
      const row = (rows as CommentRow[])[0];
      return res.status(201).json({
        success: true,
        data: row ? mapComment(row) : { id: insertId },
      });
    });
  }
  return methodNotAllowed(res);
}

async function handleIdeaCommentsCount(
  req: VercelRequest,
  res: VercelResponse,
  ideaId: string,
) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  return withConn(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT COUNT(*) AS count FROM idea_comments WHERE idea_id = ?',
      [ideaId],
    );
    const value = (rows as Array<{ count: number | bigint | string }>)[0].count;
    return res.status(200).json({
      success: true,
      data: { count: typeof value === 'number' ? value : Number(value) },
    });
  });
}

async function handleIdeaCommentItem(
  req: VercelRequest,
  res: VercelResponse,
  ideaId: string,
  commentId: string,
) {
  if (req.method === 'DELETE') {
    return withConn(async (conn) => {
      await conn.execute(
        'DELETE FROM idea_comments WHERE id = ? AND idea_id = ?',
        [commentId, ideaId],
      );
      return res.status(200).json({ success: true });
    });
  }
  return methodNotAllowed(res);
}

// ─── Router ─────────────────────────────────────────────────────
export async function routeRequest(req: VercelRequest, res: VercelResponse) {
  const startedAt = Date.now();
  const requestId = initializeRequestContext(req, res);
  applySecurityHeaders(res);
  if (!applyCors(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  let path = '(unknown)';
  try {
    path = getApiPath(req);
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > 64 * 1024) {
      return res.status(413).json({ success: false, error: 'Request body is too large', code: 'BODY_TOO_LARGE' });
    }
    await attachRequestSession(req);
    // Health
    if (path === '/' || path === '' || path === '/health') {
      return res
        .status(200)
        .json({ success: true, data: { status: 'ok' } });
    }

    // Admin
    if (path === '/admin/login') return handleSessionLogin(req, res);
    if (path === '/admin/session') return handleAdminSession(req, res);
    if (path === '/admin/logout') return handleAdminLogout(req, res);
    if (path === '/admin/revoke-all') return handleAdminRevokeAll(req, res);
    if (path === '/admin/maintenance') return handleMaintenance(req, res);
    if (path === '/admin/verify') {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', process.env.ADMIN_VERIFY_SUNSET || 'Wed, 30 Sep 2026 00:00:00 GMT');
      return handleAdminVerify(req, res);
    }
    if (path === '/admin/stats') return handleAdminStats(req, res);

    if (path === '/ai/chat') return handleAiChat(req, res);

    if (path === '/contact') return handleContact(req, res);
    if (path === '/send-email') {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', process.env.LEGACY_CONTACT_SUNSET || 'Wed, 30 Sep 2026 00:00:00 GMT');
      return handleContact(req, res);
    }

    if (path === '/db-test') return notFound(res);

    // Projects
    if (path === '/projects') return handleProjectsCollection(req, res);
    const projectItemMatch = path.match(/^\/projects\/([^/]+)$/);
    if (projectItemMatch) {
      const id = parseNumericId(projectItemMatch[1]);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid project id' });
      }
      return handleProjectItem(req, res, id);
    }

    // Skills
    if (path === '/skills') return handleSkillsCollection(req, res);
    const skillItemMatch = path.match(/^\/skills\/([^/]+)$/);
    if (skillItemMatch) {
      const id = parseNumericId(skillItemMatch[1]);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid skill id' });
      }
      return handleSkillItem(req, res, id);
    }

    // Awards
    if (path === '/awards') return handleAwardsCollection(req, res);
    const awardItemMatch = path.match(/^\/awards\/([^/]+)$/);
    if (awardItemMatch) {
      const id = parseNumericId(awardItemMatch[1]);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid award id' });
      }
      return handleAwardItem(req, res, id);
    }

    // Experiments
    if (path === '/experiments') return handleExperimentsCollection(req, res);
    const experimentItemMatch = path.match(/^\/experiments\/([^/]+)$/);
    if (experimentItemMatch) {
      const id = parseNumericId(experimentItemMatch[1]);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid experiment id' });
      }
      return handleExperimentItem(req, res, id);
    }

    // Contact messages
    if (path === '/contact-messages') {
      return handleContactMessagesCollection(req, res);
    }
    const contactResendMatch = path.match(/^\/contact-messages\/([^/]+)\/resend$/);
    if (contactResendMatch) {
      const id = parseNumericId(contactResendMatch[1]);
      if (!id) return res.status(400).json({ success: false, error: 'Invalid message id', code: 'VALIDATION_ERROR' });
      return handleContactResend(req, res, id);
    }
    const contactItemMatch = path.match(/^\/contact-messages\/([^/]+)$/);
    if (contactItemMatch) {
      const id = parseNumericId(contactItemMatch[1]);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid message id' });
      }
      return handleContactMessageItem(req, res, id);
    }

    if (path.startsWith('/ideas') && req.method !== 'GET') {
      return res.status(410).json({ success: false, error: 'This feature has been retired', code: 'FEATURE_RETIRED' });
    }
    if (path.startsWith('/ideas')) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', process.env.IDEAS_SUNSET || 'Wed, 30 Sep 2026 00:00:00 GMT');
    }
    if (path === '/ideas') return handleIdeasCollection(req, res);
    const ideaCommentCountMatch = path.match(
      /^\/ideas\/([^/]+)\/comments\/count$/,
    );
    if (ideaCommentCountMatch) {
      return handleIdeaCommentsCount(req, res, ideaCommentCountMatch[1]);
    }
    const ideaCommentItemMatch = path.match(
      /^\/ideas\/([^/]+)\/comments\/([^/]+)$/,
    );
    if (ideaCommentItemMatch) {
      return handleIdeaCommentItem(
        req,
        res,
        ideaCommentItemMatch[1],
        ideaCommentItemMatch[2],
      );
    }
    const ideaCommentsMatch = path.match(/^\/ideas\/([^/]+)\/comments$/);
    if (ideaCommentsMatch) {
      return handleIdeaComments(req, res, ideaCommentsMatch[1]);
    }
    const ideaItemMatch = path.match(/^\/ideas\/([^/]+)$/);
    if (ideaItemMatch) {
      return handleIdeaItem(req, res, ideaItemMatch[1]);
    }

    return notFound(res);
  } catch (error) {
    const formatted = formatDbError(error);
    console.error(JSON.stringify({ type: 'api-error', requestId: getRequestId(req), path, code: formatted.code }));
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: formatted.code,
      hint: formatted.hint,
    });
  } finally {
    logRequest({ requestId, method: req.method, path, status: res.statusCode, durationMs: Date.now() - startedAt, code: getResponseCode(req) });
    const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET');
    if (unsafe && getAttachedSession(req)) {
      try {
        await withConn((conn) => writeAdminAudit(conn, {
          requestId,
          action: `${req.method || 'UNKNOWN'} ${path}`,
          resourceType: path.split('/').filter(Boolean)[0] || null,
          resourceId: path.split('/').filter(Boolean)[1] || null,
          outcome: res.statusCode < 400 ? 'success' : 'failure',
        }));
      } catch {
        console.error(JSON.stringify({ type: 'audit-log-failure', requestId }));
      }
    }
  }
}
