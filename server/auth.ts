import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAttachedSession, hasValidCsrf } from './session-auth.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const session = getAttachedSession(req);
  if (!session) {
    res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return false;
  }
  if (!SAFE_METHODS.has(req.method || 'GET') && !hasValidCsrf(req, session)) {
    res.status(403).json({ success: false, error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
    return false;
  }
  return true;
}

function getAllowedOrigins(req: VercelRequest): Set<string> {
  const allowed = new Set(
    (process.env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
  );
  for (const candidate of [
    process.env.PUBLIC_ORIGIN,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]) {
    if (candidate) allowed.add(candidate.replace(/\/$/, ''));
  }
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
  }
  return allowed;
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (typeof origin === 'string') {
    if (!getAllowedOrigins(req).has(origin)) {
      res.status(403).json({ success: false, error: 'Origin is not allowed', code: 'CORS_ORIGIN_DENIED' });
      return false;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, X-CSRF-Token');
  return true;
}

export function applySecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://grainy-gradients.vercel.app https://nguyendai05.github.io",
    "media-src 'self' https://res.cloudinary.com",
    "frame-src https://www.youtube.com https://drive.google.com https://www.facebook.com",
    "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  const reportOnly = process.env.CSP_REPORT_ONLY === 'true' || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');
  res.setHeader(reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', csp);
}
