import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SessionPayload {
  sid: string;
  iat: number;
  exp: number;
  version: number;
}

export const PRODUCTION_ADMIN_SESSION_COOKIE = '__Host-portfolio_admin';
export const DEVELOPMENT_ADMIN_SESSION_COOKIE = 'portfolio_admin';

export function getAdminSessionCookieName(): string {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
    ? PRODUCTION_ADMIN_SESSION_COOKIE
    : DEVELOPMENT_ADMIN_SESSION_COOKIE;
}

function hmac(value: string, secret: string): Buffer {
  return crypto.createHmac('sha256', secret).update(value).digest();
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSignedSessionCookie(payload: SessionPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${hmac(encoded, secret).toString('base64url')}`;
}

export function parseSignedSessionCookie(
  token: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  if (!token || !secret) return null;
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length > 0) return null;
  let provided: Buffer;
  try { provided = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (!safeEqual(hmac(encoded, secret), provided)) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!value.sid || !Number.isInteger(value.iat) || !Number.isInteger(value.exp) || !Number.isInteger(value.version)) return null;
    if (value.exp <= nowSeconds || value.iat > nowSeconds + 60) return null;
    return value;
  } catch {
    return null;
  }
}

export function deriveCsrfToken(sid: string, version: number, secret: string): string {
  return hmac(`csrf:${sid}:${version}`, secret).toString('base64url');
}

export function verifyCsrfToken(token: string | undefined, sid: string, version: number, secret: string): boolean {
  if (!token) return false;
  let provided: Buffer;
  try { provided = Buffer.from(token, 'base64url'); } catch { return false; }
  return safeEqual(hmac(`csrf:${sid}:${version}`, secret), provided);
}

export function hashIdentifier(value: string, secret: string, version: string): string {
  return crypto.createHmac('sha256', secret).update(`${version}:${value}`).digest('hex');
}

export function parseCookies(req: VercelRequest): Record<string, string> {
  const raw = req.headers.cookie;
  if (typeof raw !== 'string') return {};
  return Object.fromEntries(raw.split(';').map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return [part.trim(), ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

export function setSessionCookie(res: VercelResponse, token: string, maxAgeSeconds: number): void {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.setHeader('Set-Cookie', `${getAdminSessionCookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`);
}

export function clearSessionCookie(res: VercelResponse): void {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.setHeader('Set-Cookie', `${getAdminSessionCookieName()}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`);
}

export function getTrustedClientIp(req: VercelRequest): string {
  if (process.env.VERCEL) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  }
  const socket = (req as VercelRequest & { socket?: { remoteAddress?: string } }).socket;
  return socket?.remoteAddress || 'unknown';
}

export function getIdentifierHash(req: VercelRequest): string {
  const key = process.env.RATE_LIMIT_HMAC_KEY || process.env.ADMIN_SESSION_SECRET || 'development-only-rate-limit-key';
  return hashIdentifier(getTrustedClientIp(req), key, process.env.RATE_LIMIT_KEY_VERSION || 'v1');
}
