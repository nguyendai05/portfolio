import { api, ApiError, setAdminToken, getAdminToken } from './client';
import type { AdminStats } from './types';

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
    return Boolean(getAdminToken());
  }
}

export type { AdminStats };
