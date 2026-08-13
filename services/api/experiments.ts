import { api } from './client';
import type { Experiment } from './types';

export async function fetchExperiments(signal?: AbortSignal): Promise<Experiment[]> {
  return api<Experiment[]>(`/experiments`, { signal });
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

export type { Experiment };
