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
