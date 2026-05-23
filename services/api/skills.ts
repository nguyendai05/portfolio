import { api } from './client';
import type { Skill } from './types';

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

export type { Skill };
