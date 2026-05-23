import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formatDbError, getConnection } from './db';
import {
  applyCors,
  getConfiguredAdminToken,
  requireAdmin,
} from './auth';
import {
  ContactRow,
  insertContactMessage,
  isAllowedStatus,
  mapContactRow,
} from './contact-messages';
import {
  createProject,
  deleteProject,
  listProjects,
  loadProjectById,
  loadProjectBySlug,
  updateProject,
  type ProjectInput,
  type ProjectType,
} from './projects';
import {
  ContactFormData,
  DEFAULT_MESSAGE,
  EmailPayload,
  FINAL_WARNING_MESSAGE,
  MAX_AUTO_REPLY_COUNT,
  getCurrentEmailConfig,
  getEmailCount,
  incrementEmailCount,
  isEmailBlocked,
  sendEmailJS,
} from './email';

type Conn = import('mysql2/promise').Connection;

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
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '');
  return path || '/';
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key];
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
    await conn.end();
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
async function handleAdminLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const token = getConfiguredAdminToken();
  if (!token) {
    return res.status(503).json({
      success: false,
      error:
        'Admin login is not configured (set ADMIN_TOKEN — and optionally ADMIN_PASSWORD — in the server env).',
    });
  }
  const body = (req.body || {}) as Record<string, unknown>;
  const submitted =
    typeof body.password === 'string'
      ? body.password
      : typeof body.token === 'string'
        ? body.token
        : '';
  const expected = process.env.ADMIN_PASSWORD || token;
  if (!submitted || submitted !== expected) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid credentials' });
  }
  return res.status(200).json({ success: true, data: { token } });
}

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
      ideas,
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
      count(conn, 'SELECT COUNT(*) AS c FROM ideas').catch(() => 0),
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
        ideas,
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
      const projects = await listProjects(conn, projectType);
      return res.status(200).json({ success: true, data: projects });
    });
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
    return withConn(async (conn) => {
      const created = await createProject(conn, {
        slug: typeof body.slug === 'string' ? body.slug : undefined,
        title: String(body.title),
        summary: typeof body.summary === 'string' ? body.summary : null,
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
    });
  }
  return methodNotAllowed(res);
}

async function handleProjectItem(
  req: VercelRequest,
  res: VercelResponse,
  id: number,
) {
  if (req.method === 'GET') {
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
    const body = (req.body || {}) as Record<string, unknown>;
    return withConn(async (conn) => {
      const updated = await updateProject(conn, id, normalizeProjectBody(body));
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: 'Project not found' });
      }
      return res.status(200).json({ success: true, data: updated });
    });
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
        'SELECT * FROM awards WHERE id = ?',
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
        'SELECT * FROM awards WHERE id = ?',
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
        'SELECT * FROM experiments WHERE id = ?',
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
        'SELECT * FROM experiments WHERE id = ?',
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
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        `SELECT id, name, email, topic, message, status, user_agent, created_at
           FROM contact_messages
          ORDER BY created_at DESC, id DESC`,
      );
      const list = (rows as ContactRow[]).map(mapContactRow);
      const newCount = list.filter((m) => m.status === 'new').length;
      return res.status(200).json({
        success: true,
        data: list,
        meta: { total: list.length, newCount },
      });
    });
  }
  if (req.method === 'POST') {
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
        `SELECT id, name, email, topic, message, status, user_agent, created_at
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

// ─── Send Email ─────────────────────────────────────────────────
async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const config = getCurrentEmailConfig();
  if (!config) {
    return res
      .status(500)
      .json({ success: false, error: 'Email service not configured' });
  }
  const data = (req.body || {}) as Partial<ContactFormData>;
  if (!data.name || !data.email || !data.message) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing required fields' });
  }
  if (isEmailBlocked(data.email)) {
    return res.status(429).json({
      success: false,
      blocked: true,
      error: 'This email has reached the maximum submission limit.',
    });
  }
  const currentCount = getEmailCount(data.email);
  const isFinalWarning = currentCount === MAX_AUTO_REPLY_COUNT - 1;
  const timestamp = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const topic = data.topic || 'other';
  const topicCapitalized = topic.charAt(0).toUpperCase() + topic.slice(1);
  try {
    const contactPayload: EmailPayload = {
      service_id: config.serviceId,
      template_id: config.contactTemplateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        from_name: data.name,
        from_email: data.email,
        topic: topicCapitalized,
        message: data.message,
        timestamp,
      },
    };
    const contactResult = await sendEmailJS(contactPayload);
    if (!contactResult.ok) {
      console.error('Contact email failed:', contactResult.error);
      return res.status(500).json({
        success: false,
        error: `Contact email failed: ${contactResult.error}`,
      });
    }

    const autoReplyPayload: EmailPayload = {
      service_id: config.serviceId,
      template_id: config.autoReplyTemplateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        name: data.name,
        email: data.email,
        title: topicCapitalized,
        extra_message: isFinalWarning ? FINAL_WARNING_MESSAGE : DEFAULT_MESSAGE,
      },
    };
    const replyResult = await sendEmailJS(autoReplyPayload);
    const autoReplySent = replyResult.ok;
    if (!replyResult.ok) {
      console.warn('Auto-reply failed:', replyResult.error);
    }
    incrementEmailCount(data.email);

    try {
      await withConn(async (conn) => {
        await insertContactMessage(conn, {
          name: data.name!,
          email: data.email!,
          topic,
          message: data.message!,
          userAgent:
            typeof req.headers['user-agent'] === 'string'
              ? req.headers['user-agent']
              : null,
        });
      });
    } catch (dbError) {
      console.warn('contact_messages insert failed:', dbError);
    }
    return res.status(200).json({ success: true, autoReplySent });
  } catch (error) {
    console.error('Email send error:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Failed to send email' });
  }
}

// ─── Ideas ──────────────────────────────────────────────────────
async function handleIdeasCollection(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return withConn(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT * FROM ideas ORDER BY created_at DESC',
      );
      return res
        .status(200)
        .json({ success: true, data: (rows as IdeaRow[]).map(mapIdea) });
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
        'SELECT * FROM ideas WHERE id = ?',
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
        'SELECT id, idea_id, author, content, created_at FROM idea_comments WHERE idea_id = ? ORDER BY created_at ASC',
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

// ─── DB Test ────────────────────────────────────────────────────
async function handleDbTest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  const startTime = Date.now();
  try {
    return await withConn(async (conn) => {
      const [test] = await conn.execute(
        'SELECT 1 as test, NOW() as server_time',
      );
      const [tables] = await conn.execute(
        `SELECT TABLE_NAME as table_name, TABLE_ROWS as row_count
           FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
        [process.env.MYSQL_DATABASE],
      );
      const testRow = (test as Array<{ test: number; server_time: string }>)[0];
      return res.status(200).json({
        success: true,
        message: 'Database connection successful.',
        data: {
          connection: {
            host: process.env.MYSQL_HOST,
            port: Number(process.env.MYSQL_PORT || 3306),
            user: process.env.MYSQL_USER,
            database: process.env.MYSQL_DATABASE,
            password: process.env.MYSQL_PASSWORD ? '***hidden***' : 'NOT SET',
          },
          test: {
            query: 'SELECT 1',
            result: testRow?.test,
            serverTime: testRow?.server_time,
          },
          tables,
          performance: { connectionTimeMs: Date.now() - startTime },
        },
      });
    });
  } catch (error) {
    const e = error as { code?: string; errno?: number; message?: string; sqlState?: string };
    return res.status(500).json({
      success: false,
      message: 'Database connection failed.',
      error: {
        code: e.code,
        errno: e.errno,
        message: e.message,
        sqlState: e.sqlState,
      },
      performance: { connectionTimeMs: Date.now() - startTime },
    });
  }
}

// ─── Router ─────────────────────────────────────────────────────
export async function routeRequest(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = getApiPath(req);
  try {
    // Health
    if (path === '/' || path === '') {
      return res
        .status(200)
        .json({ success: true, message: 'Portfolio API is running' });
    }

    // Admin
    if (path === '/admin/login') return handleAdminLogin(req, res);
    if (path === '/admin/verify') return handleAdminVerify(req, res);
    if (path === '/admin/stats') return handleAdminStats(req, res);

    // Send email
    if (path === '/send-email') return handleSendEmail(req, res);

    // DB test
    if (path === '/db-test') return handleDbTest(req, res);

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

    // Ideas
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
    console.error(`API error at ${path}:`, formatted);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: formatted.code,
      hint: formatted.hint,
    });
  }
}
