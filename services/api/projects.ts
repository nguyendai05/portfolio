import { Project } from '../../types';
import { api } from './client';

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

export async function fetchProjects(signal?: AbortSignal): Promise<Project[]> {
  return api<Project[]>(`/projects?type=project`, { signal });
}

export async function fetchTools(signal?: AbortSignal): Promise<Project[]> {
  return api<Project[]>(`/projects?type=tool`, { signal });
}

export async function fetchAllProjects(signal?: AbortSignal): Promise<Project[]> {
  return api<Project[]>(`/projects`, { signal });
}

export interface ProjectPage {
  items: Project[];
  pageInfo: { nextCursor: string | null };
}

export async function fetchAdminProjectsPage(
  type: 'project' | 'tool',
  cursor?: string,
  signal?: AbortSignal,
): Promise<ProjectPage> {
  const params = new URLSearchParams({ admin: 'true', type, limit: '20' });
  if (cursor) params.set('cursor', cursor);
  return api<ProjectPage>(`/projects?${params}`, { auth: true, signal });
}

export async function fetchProjectBySlug(slug: string, signal?: AbortSignal): Promise<Project> {
  return api<Project>(`/projects?slug=${encodeURIComponent(slug)}`, { signal });
}

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
