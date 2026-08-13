import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withConnection } from './db.js';
import { consumeRateLimit } from './rate-limit.js';
import { getIdentifierHash } from './security.js';
import {
  createAdminSession,
  getAttachedSession,
  loadAdminSession,
  revokeAdminSession,
  revokeAllAdminSessions,
  verifyAdminPassword,
} from './session-auth.js';
import { hasValidCsrf } from './session-auth.js';

export async function handleAdminLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !(await verifyAdminPassword(password))) {
    const rate = await withConnection((conn) =>
      consumeRateLimit(conn, 'admin-login:ip', getIdentifierHash(req), 5, 900),
    );
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      return res.status(429).json({ success: false, error: 'Too many login attempts', code: 'LOGIN_RATE_LIMITED' });
    }
    return res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }
  const session = await withConnection((conn) => createAdminSession(conn, res));
  return res.status(200).json({
    success: true,
    data: {
      authenticated: true,
      expiresAt: new Date(session.exp * 1000).toISOString(),
      csrfToken: session.csrfToken,
    },
  });
}

export async function handleAdminSession(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  const session = getAttachedSession(req);
  if (!session) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  return res.status(200).json({
    success: true,
    data: {
      authenticated: true,
      expiresAt: new Date(session.exp * 1000).toISOString(),
      csrfToken: session.csrfToken,
    },
  });
}

export async function handleAdminLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  const session = getAttachedSession(req);
  if (!session) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  if (!hasValidCsrf(req, session)) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }
  await withConnection((conn) => revokeAdminSession(conn, res, session));
  return res.status(200).json({ success: true, data: { authenticated: false } });
}

export async function handleAdminRevokeAll(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  const session = getAttachedSession(req);
  if (!session || !hasValidCsrf(req, session)) {
    return res.status(403).json({ success: false, error: 'Invalid session or CSRF token', code: 'CSRF_INVALID' });
  }
  await withConnection(revokeAllAdminSessions);
  return res.status(200).json({ success: true, data: { revoked: true } });
}

export async function attachRequestSession(req: VercelRequest): Promise<void> {
  if (typeof req.headers.cookie !== 'string' || !req.headers.cookie.includes('portfolio_admin')) return;
  const session = await withConnection((conn) => loadAdminSession(conn, req));
  (req as VercelRequest & { adminSession?: typeof session }).adminSession = session;
}
