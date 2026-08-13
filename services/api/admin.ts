import { api, ApiError, setAdminCsrfToken, setAdminToken } from './client';
import type { AdminStats } from './types';

export interface AdminSession {
  authenticated: true;
  expiresAt: string;
  csrfToken: string;
}

setAdminToken(null);

export async function adminLogin(password: string): Promise<AdminSession> {
  const data = await api<AdminSession>('/admin/login', { method: 'POST', body: { password } });
  setAdminCsrfToken(data.csrfToken);
  return data;
}

export async function fetchAdminSession(): Promise<AdminSession> {
  const data = await api<AdminSession>('/admin/session', { auth: true, retry: 0 });
  setAdminCsrfToken(data.csrfToken);
  return data;
}

export async function adminLogout(): Promise<void> {
  await api('/admin/logout', { auth: true, method: 'POST' });
  setAdminCsrfToken(null);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return api<AdminStats>('/admin/stats', { auth: true });
}

export async function verifyAdminToken(): Promise<boolean> {
  try {
    await fetchAdminSession();
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    return false;
  }
}

export type { AdminStats };
