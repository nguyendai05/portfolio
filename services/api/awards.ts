import { api } from './client';
import type { Award } from './types';

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

export type { Award };
