import type { Connection } from 'mysql2/promise';

export type ProjectType = 'project' | 'tool';

export interface ProjectRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  category: string;
  project_type: ProjectType;
  image_url: string;
  link: string | null;
  featured: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectDTO {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
  link?: string;
  featured?: boolean;
  phases?: string[];
  projectType: ProjectType;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectInput {
  slug?: string;
  title: string;
  summary?: string | null;
  description: string;
  category: string;
  projectType?: ProjectType;
  imageUrl: string;
  link?: string | null;
  featured?: boolean;
  technologies?: string[];
  phases?: string[];
}

/**
 * Normalises arbitrary text into a URL-friendly slug. Falls back to
 * `project-<timestamp>` when the input is empty so the DB still gets a
 * unique value.
 */
export function slugify(input: string): string {
  const base = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || `project-${Date.now()}`;
}

async function loadProjectExtras(conn: Connection, projectId: number) {
  const [techRows] = await conn.execute(
    `SELECT t.name
       FROM technologies t
       JOIN project_technologies pt ON pt.technology_id = t.id
      WHERE pt.project_id = ?`,
    [projectId],
  );
  const technologies = (techRows as Array<{ name: string }>).map((r) => r.name);

  const [phaseRows] = await conn.execute(
    `SELECT ph.name
       FROM phases ph
       JOIN project_phases pp ON pp.phase_id = ph.id
      WHERE pp.project_id = ?
      ORDER BY pp.phase_order`,
    [projectId],
  );
  const phases = (phaseRows as Array<{ name: string }>).map((r) => r.name);
  return { technologies, phases };
}

async function loadProjectsExtras(conn: Connection, projectIds: number[]) {
  const technologiesByProject = new Map<number, string[]>();
  const phasesByProject = new Map<number, string[]>();
  if (projectIds.length === 0) return { technologiesByProject, phasesByProject };

  const placeholders = projectIds.map(() => '?').join(', ');

  const [techRows] = await conn.execute(
    `SELECT pt.project_id, t.name
       FROM project_technologies pt
       JOIN technologies t ON t.id = pt.technology_id
      WHERE pt.project_id IN (${placeholders})
      ORDER BY pt.project_id, t.name`,
    projectIds,
  );
  for (const row of techRows as Array<{ project_id: number; name: string }>) {
    const list = technologiesByProject.get(row.project_id) ?? [];
    list.push(row.name);
    technologiesByProject.set(row.project_id, list);
  }

  const [phaseRows] = await conn.execute(
    `SELECT pp.project_id, ph.name
       FROM project_phases pp
       JOIN phases ph ON ph.id = pp.phase_id
      WHERE pp.project_id IN (${placeholders})
      ORDER BY pp.project_id, pp.phase_order`,
    projectIds,
  );
  for (const row of phaseRows as Array<{ project_id: number; name: string }>) {
    const list = phasesByProject.get(row.project_id) ?? [];
    list.push(row.name);
    phasesByProject.set(row.project_id, list);
  }

  return { technologiesByProject, phasesByProject };
}

export function mapProjectRow(
  row: ProjectRow,
  technologies: string[],
  phases: string[],
): ProjectDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary || undefined,
    category: row.category,
    image: row.image_url,
    description: row.description,
    technologies,
    link: row.link || undefined,
    featured: Boolean(row.featured),
    phases: phases.length > 0 ? phases : undefined,
    projectType: row.project_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadProjectById(
  conn: Connection,
  id: number,
): Promise<ProjectDTO | null> {
  const [rows] = await conn.execute(
    'SELECT * FROM projects WHERE id = ?',
    [id],
  );
  const list = rows as ProjectRow[];
  if (list.length === 0) return null;
  const { technologies, phases } = await loadProjectExtras(conn, list[0].id);
  return mapProjectRow(list[0], technologies, phases);
}

export async function loadProjectBySlug(
  conn: Connection,
  slug: string,
): Promise<ProjectDTO | null> {
  const [rows] = await conn.execute(
    'SELECT * FROM projects WHERE slug = ?',
    [slug],
  );
  const list = rows as ProjectRow[];
  if (list.length === 0) return null;
  const { technologies, phases } = await loadProjectExtras(conn, list[0].id);
  return mapProjectRow(list[0], technologies, phases);
}

export async function listProjects(
  conn: Connection,
  projectType?: ProjectType,
): Promise<ProjectDTO[]> {
  let query = 'SELECT * FROM projects';
  const params: string[] = [];
  if (projectType === 'project' || projectType === 'tool') {
    query += ' WHERE project_type = ?';
    params.push(projectType);
  }
  query += ' ORDER BY featured DESC, created_at DESC, id DESC';
  const [rows] = await conn.execute(query, params);
  const list = rows as ProjectRow[];
  const { technologiesByProject, phasesByProject } = await loadProjectsExtras(
    conn,
    list.map((row) => row.id),
  );
  return list.map((row) =>
    mapProjectRow(
      row,
      technologiesByProject.get(row.id) ?? [],
      phasesByProject.get(row.id) ?? [],
    ),
  );
}

async function ensureUniqueSlug(
  conn: Connection,
  desired: string,
  ignoreId?: number,
): Promise<string> {
  let candidate = desired || slugify('project');
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await conn.execute(
      'SELECT id FROM projects WHERE slug = ? LIMIT 1',
      [candidate],
    );
    const list = rows as Array<{ id: number }>;
    if (list.length === 0 || list[0].id === ignoreId) return candidate;
    suffix += 1;
    candidate = `${desired}-${suffix}`;
  }
}

async function upsertTechnologies(
  conn: Connection,
  technologies: string[],
): Promise<number[]> {
  const ids: number[] = [];
  for (const raw of technologies) {
    const name = raw.trim();
    if (!name) continue;
    await conn.execute(
      `INSERT INTO technologies (name) VALUES (?)
        ON DUPLICATE KEY UPDATE name = name`,
      [name],
    );
    const [rows] = await conn.execute(
      'SELECT id FROM technologies WHERE name = ?',
      [name],
    );
    const list = rows as Array<{ id: number }>;
    if (list.length > 0) ids.push(list[0].id);
  }
  return ids;
}

async function upsertPhases(
  conn: Connection,
  phases: string[],
): Promise<Array<{ id: number; order: number }>> {
  const result: Array<{ id: number; order: number }> = [];
  let order = 1;
  for (const raw of phases) {
    const name = raw.trim();
    if (!name) continue;
    await conn.execute(
      `INSERT INTO phases (name) VALUES (?)
        ON DUPLICATE KEY UPDATE name = name`,
      [name],
    );
    const [rows] = await conn.execute(
      'SELECT id FROM phases WHERE name = ?',
      [name],
    );
    const list = rows as Array<{ id: number }>;
    if (list.length > 0) {
      result.push({ id: list[0].id, order: order++ });
    }
  }
  return result;
}

async function syncProjectTechnologies(
  conn: Connection,
  projectId: number,
  techIds: number[],
) {
  await conn.execute(
    'DELETE FROM project_technologies WHERE project_id = ?',
    [projectId],
  );
  for (const techId of techIds) {
    await conn.execute(
      `INSERT IGNORE INTO project_technologies (project_id, technology_id)
        VALUES (?, ?)`,
      [projectId, techId],
    );
  }
}

async function syncProjectPhases(
  conn: Connection,
  projectId: number,
  phaseEntries: Array<{ id: number; order: number }>,
) {
  await conn.execute('DELETE FROM project_phases WHERE project_id = ?', [
    projectId,
  ]);
  for (const phase of phaseEntries) {
    await conn.execute(
      `INSERT INTO project_phases (project_id, phase_id, phase_order)
        VALUES (?, ?, ?)`,
      [projectId, phase.id, phase.order],
    );
  }
}

export async function createProject(
  conn: Connection,
  input: ProjectInput,
): Promise<ProjectDTO> {
  const slugBase = slugify(input.slug && input.slug.trim() ? input.slug : input.title);
  const slug = await ensureUniqueSlug(conn, slugBase);
  const projectType: ProjectType = input.projectType === 'tool' ? 'tool' : 'project';

  const [result] = await conn.execute(
    `INSERT INTO projects
      (slug, title, summary, description, category, project_type, image_url, link, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug,
      input.title,
      input.summary ?? null,
      input.description,
      input.category,
      projectType,
      input.imageUrl,
      input.link || null,
      input.featured ? 1 : 0,
    ],
  );

  const insertId = (result as { insertId: number }).insertId;

  if (input.technologies && input.technologies.length > 0) {
    const ids = await upsertTechnologies(conn, input.technologies);
    await syncProjectTechnologies(conn, insertId, ids);
  }
  if (input.phases && input.phases.length > 0) {
    const phaseEntries = await upsertPhases(conn, input.phases);
    await syncProjectPhases(conn, insertId, phaseEntries);
  }

  const created = await loadProjectById(conn, insertId);
  if (!created) throw new Error('Created project not found');
  return created;
}

export async function updateProject(
  conn: Connection,
  id: number,
  input: Partial<ProjectInput>,
): Promise<ProjectDTO | null> {
  const [existing] = await conn.execute(
    'SELECT * FROM projects WHERE id = ?',
    [id],
  );
  const existingRows = existing as ProjectRow[];
  if (existingRows.length === 0) return null;
  const current = existingRows[0];

  let slug = current.slug;
  if (input.slug !== undefined && input.slug !== null) {
    const desired = slugify(input.slug || current.title);
    if (desired !== current.slug) {
      slug = await ensureUniqueSlug(conn, desired, id);
    }
  }

  const projectType: ProjectType = input.projectType
    ? input.projectType === 'tool'
      ? 'tool'
      : 'project'
    : current.project_type;

  await conn.execute(
    `UPDATE projects SET
        slug = ?,
        title = ?,
        summary = ?,
        description = ?,
        category = ?,
        project_type = ?,
        image_url = ?,
        link = ?,
        featured = ?
      WHERE id = ?`,
    [
      slug,
      input.title ?? current.title,
      input.summary !== undefined ? input.summary : current.summary,
      input.description ?? current.description,
      input.category ?? current.category,
      projectType,
      input.imageUrl ?? current.image_url,
      input.link !== undefined ? input.link || null : current.link,
      input.featured !== undefined ? (input.featured ? 1 : 0) : current.featured,
      id,
    ],
  );

  if (input.technologies !== undefined) {
    const ids = await upsertTechnologies(conn, input.technologies || []);
    await syncProjectTechnologies(conn, id, ids);
  }
  if (input.phases !== undefined) {
    const phaseEntries = await upsertPhases(conn, input.phases || []);
    await syncProjectPhases(conn, id, phaseEntries);
  }

  return loadProjectById(conn, id);
}

export async function deleteProject(
  conn: Connection,
  id: number,
): Promise<boolean> {
  const [result] = await conn.execute('DELETE FROM projects WHERE id = ?', [id]);
  const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
  return affected > 0;
}
