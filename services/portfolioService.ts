// Portfolio API Service - Fetch & mutate data via the /api endpoints.
//
// All admin (POST/PATCH/DELETE) requests automatically attach the admin
// bearer token stored in localStorage. See `setAdminToken` /
// `getAdminToken` below.
import { Project } from '../types';

const API_BASE = '/api';
const ADMIN_TOKEN_STORAGE_KEY = 'xuni_admin_token';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Award {
  id?: number;
  year: string;
  org: string;
  project: string;
  award: string;
  projectId?: number | null;
}

export interface Experiment {
  id: string;
  dbId?: number;
  code?: string;
  name: string;
  desc: string;
  projectId?: number | null;
}

export interface Skill {
  id?: number;
  name: string;
  type: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  topic: 'collaboration' | 'mentorship' | 'freelance' | 'other';
  message: string;
  status: 'new' | 'replied' | 'archived';
  userAgent: string | null;
  createdAt: string;
}

export interface AdminStats {
  projects: number;
  tools: number;
  skills: number;
  milestones: number;
  experiments: number;
  messages: number;
  newMessages: number;
  ideas: number;
}

export interface ProjectFormPayload {
  slug?: string;
  title: string;
  summary?: string | null;
  description: string;
  category: string;
  projectType: 'project' | 'tool';
  imageUrl: string;
  link?: string | null;
  featured?: boolean;
  technologies?: string[];
  phases?: string[];
}

// ---------------------------------------------------------------------------
// Admin token storage
// ---------------------------------------------------------------------------

export function getAdminToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function hasAdminToken(): boolean {
  return Boolean(getAdminToken());
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  hint?: string;
  constructor(message: string, status: number, extra?: { code?: string; hint?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = extra?.code;
    this.hint = extra?.hint;
  }
}

async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    const token = getAdminToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const text = await res.text();
  const json = text ? safeParse(text) : null;
  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'error' in json
        ? String((json as { error: unknown }).error)
        : '') || `Request failed with status ${res.status}`;
    const extra =
      json && typeof json === 'object'
        ? {
            code: 'code' in json ? String((json as { code: unknown }).code) : undefined,
            hint: 'hint' in json ? String((json as { hint: unknown }).hint) : undefined,
          }
        : undefined;
    throw new ApiError(message, res.status, extra);
  }
  if (!json || typeof json !== 'object') {
    throw new ApiError('Malformed response from server', res.status);
  }
  const payload = json as { success?: boolean; data?: T; error?: string };
  if (payload.success === false) {
    throw new ApiError(payload.error || 'Request failed', res.status);
  }
  return payload.data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Projects (public)
// ---------------------------------------------------------------------------

export async function fetchProjects(): Promise<Project[]> {
  return api<Project[]>(`/projects?type=project`);
}

export async function fetchTools(): Promise<Project[]> {
  return api<Project[]>(`/projects?type=tool`);
}

export async function fetchAllProjects(): Promise<Project[]> {
  return api<Project[]>(`/projects`);
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  return api<Project>(`/projects?slug=${encodeURIComponent(slug)}`);
}

// ---------------------------------------------------------------------------
// Projects (admin)
// ---------------------------------------------------------------------------

export async function fetchProjectById(id: number): Promise<Project> {
  return api<Project>(`/projects/${id}`);
}

export async function createProject(payload: ProjectFormPayload): Promise<Project> {
  return api<Project>(`/projects`, { method: 'POST', body: payload, auth: true });
}

export async function updateProject(
  id: number,
  payload: Partial<ProjectFormPayload>,
): Promise<Project> {
  return api<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  });
}

export async function deleteProject(id: number): Promise<void> {
  await api(`/projects/${id}`, { method: 'DELETE', auth: true });
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

interface SkillResponse {
  skills: Skill[];
  names: string[];
}

export async function fetchSkills(): Promise<Skill[]> {
  const data = await api<SkillResponse>(`/skills`);
  return data.skills;
}

export async function fetchSkillNames(): Promise<string[]> {
  const data = await api<SkillResponse>(`/skills`);
  return data.names;
}

export async function createSkill(payload: { name: string; type: string }): Promise<Skill> {
  return api<Skill>(`/skills`, { method: 'POST', body: payload, auth: true });
}

export async function updateSkill(
  id: number,
  payload: { name?: string; type?: string },
): Promise<Skill> {
  return api<Skill>(`/skills/${id}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  });
}

export async function deleteSkill(id: number): Promise<void> {
  await api(`/skills/${id}`, { method: 'DELETE', auth: true });
}

// ---------------------------------------------------------------------------
// Awards / milestones
// ---------------------------------------------------------------------------

export async function fetchAwards(): Promise<Award[]> {
  return api<Award[]>(`/awards`);
}

export async function createAward(payload: Award): Promise<Award> {
  return api<Award>(`/awards`, {
    method: 'POST',
    body: { ...payload, year: Number(payload.year) },
    auth: true,
  });
}

export async function updateAward(id: number, payload: Partial<Award>): Promise<Award> {
  return api<Award>(`/awards/${id}`, {
    method: 'PATCH',
    body: {
      ...payload,
      year: payload.year !== undefined ? Number(payload.year) : undefined,
    },
    auth: true,
  });
}

export async function deleteAward(id: number): Promise<void> {
  await api(`/awards/${id}`, { method: 'DELETE', auth: true });
}

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------

export async function fetchExperiments(): Promise<Experiment[]> {
  return api<Experiment[]>(`/experiments`);
}

export async function createExperiment(payload: {
  code: string;
  name: string;
  desc: string;
  projectId?: number | null;
}): Promise<Experiment> {
  return api<Experiment>(`/experiments`, {
    method: 'POST',
    body: { ...payload, description: payload.desc },
    auth: true,
  });
}

export async function updateExperiment(
  id: number,
  payload: { code?: string; name?: string; desc?: string; projectId?: number | null },
): Promise<Experiment> {
  return api<Experiment>(`/experiments/${id}`, {
    method: 'PATCH',
    body: {
      ...payload,
      description: payload.desc,
    },
    auth: true,
  });
}

export async function deleteExperiment(id: number): Promise<void> {
  await api(`/experiments/${id}`, { method: 'DELETE', auth: true });
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  return api<ContactMessage[]>(`/contact-messages`, { auth: true });
}

export async function updateContactStatus(
  id: number,
  status: 'new' | 'replied' | 'archived',
): Promise<ContactMessage> {
  return api<ContactMessage>(`/contact-messages/${id}`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
}

export async function deleteContactMessage(id: number): Promise<void> {
  await api(`/contact-messages/${id}`, { method: 'DELETE', auth: true });
}

// ---------------------------------------------------------------------------
// Admin auth + stats
// ---------------------------------------------------------------------------

export async function adminLogin(password: string): Promise<string> {
  const data = await api<{ token: string }>(`/admin/login`, {
    method: 'POST',
    body: { password },
  });
  setAdminToken(data.token);
  return data.token;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return api<AdminStats>(`/admin/stats`, { auth: true });
}

export async function verifyAdminToken(): Promise<boolean> {
  try {
    await fetchAdminStats();
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return false;
    // Other errors (network/db) shouldn't log the user out.
    return Boolean(getAdminToken());
  }
}
