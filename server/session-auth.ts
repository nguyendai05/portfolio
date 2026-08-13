import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PoolConnection } from 'mysql2/promise';
import {
  clearSessionCookie,
  createSignedSessionCookie,
  deriveCsrfToken,
  getAdminSessionCookieName,
  parseCookies,
  parseSignedSessionCookie,
  setSessionCookie,
  verifyCsrfToken,
  type SessionPayload,
} from './security.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AuthenticatedSession extends SessionPayload {
  sidHash: string;
  csrfToken: string;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  if (secret.length < 32) throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters');
  return secret;
}

function sidHash(sid: string): string {
  return crypto.createHash('sha256').update(sid).digest('hex');
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) return false;
    const local = process.env.ADMIN_PASSWORD;
    if (!local) return false;
    return crypto.timingSafeEqual(
      crypto.createHash('sha256').update(password).digest(),
      crypto.createHash('sha256').update(local).digest(),
    );
  }
  const [algorithm, salt, expected] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = await scrypt(password, salt, Buffer.from(expected, 'base64url').length) as Buffer;
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'base64url'));
}

export async function createAdminSession(
  conn: Pick<PoolConnection, 'execute'>,
  res: VercelResponse,
): Promise<AuthenticatedSession> {
  const [[state]] = await conn.execute('SELECT session_version FROM admin_auth_state WHERE id = 1') as unknown as [[{ session_version: number }], unknown];
  const now = Math.floor(Date.now() / 1000);
  const sid = crypto.randomBytes(32).toString('base64url');
  const payload: SessionPayload = {
    sid,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    version: Number(state?.session_version || 1),
  };
  await conn.execute(
    'INSERT INTO admin_sessions (sid_hash, token_version, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))',
    [sidHash(sid), payload.version, payload.exp],
  );
  setSessionCookie(res, createSignedSessionCookie(payload, getSecret()), SESSION_TTL_SECONDS);
  return { ...payload, sidHash: sidHash(sid), csrfToken: deriveCsrfToken(sid, payload.version, getSecret()) };
}

export async function loadAdminSession(
  conn: Pick<PoolConnection, 'execute'>,
  req: VercelRequest,
): Promise<AuthenticatedSession | null> {
  const token = parseCookies(req)[getAdminSessionCookieName()];
  const payload = parseSignedSessionCookie(token, getSecret());
  if (!payload) return null;
  const [rows] = await conn.execute(
    `SELECT s.sid_hash, s.token_version, s.expires_at, s.revoked_at, a.session_version
       FROM admin_sessions s JOIN admin_auth_state a ON a.id = 1
      WHERE s.sid_hash = ? LIMIT 1`,
    [sidHash(payload.sid)],
  );
  const row = (rows as Array<{ sid_hash: string; token_version: number; expires_at: Date; revoked_at: Date | null; session_version: number }>)[0];
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
  if (Number(row.token_version) !== payload.version || Number(row.session_version) !== payload.version) return null;
  return {
    ...payload,
    sidHash: row.sid_hash,
    csrfToken: deriveCsrfToken(payload.sid, payload.version, getSecret()),
  };
}

export function hasValidCsrf(req: VercelRequest, session: AuthenticatedSession): boolean {
  const header = req.headers['x-csrf-token'];
  return verifyCsrfToken(typeof header === 'string' ? header : undefined, session.sid, session.version, getSecret());
}

export async function revokeAdminSession(
  conn: Pick<PoolConnection, 'execute'>,
  res: VercelResponse,
  session: AuthenticatedSession,
): Promise<void> {
  await conn.execute('UPDATE admin_sessions SET revoked_at = NOW() WHERE sid_hash = ?', [session.sidHash]);
  clearSessionCookie(res);
}

export async function revokeAllAdminSessions(conn: Pick<PoolConnection, 'execute'>): Promise<void> {
  await conn.execute('UPDATE admin_auth_state SET session_version = session_version + 1 WHERE id = 1');
  await conn.execute('UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE revoked_at IS NULL');
}

export function attachSession(req: VercelRequest, session: AuthenticatedSession | null): void {
  (req as VercelRequest & { adminSession?: AuthenticatedSession | null }).adminSession = session;
}

export function getAttachedSession(req: VercelRequest): AuthenticatedSession | null {
  return (req as VercelRequest & { adminSession?: AuthenticatedSession | null }).adminSession || null;
}
