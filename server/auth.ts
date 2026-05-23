import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Pulls the bearer token from `Authorization: Bearer <token>` or from the
 * `x-admin-token` header. Returns `null` if no token is present.
 */
export function extractAdminToken(req: VercelRequest): string | null {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const headerToken = req.headers['x-admin-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  return null;
}

/**
 * Returns the configured admin token from environment variables.
 *
 * Prefer `ADMIN_TOKEN`. Falls back to `ADMIN_API_TOKEN` for compatibility.
 */
export function getConfiguredAdminToken(): string | null {
  const token = process.env.ADMIN_TOKEN || process.env.ADMIN_API_TOKEN;
  return token && token.trim() ? token.trim() : null;
}

/**
 * Returns true if the request carries a valid admin token. When unauthorized,
 * writes a JSON 401 response and returns false. Callers should `return` early
 * when this returns false.
 */
export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const configured = getConfiguredAdminToken();
  if (!configured) {
    res.status(503).json({
      success: false,
      error: 'Admin API is not configured on the server (missing ADMIN_TOKEN env).',
    });
    return false;
  }
  const provided = extractAdminToken(req);
  if (!provided || provided !== configured) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

/**
 * Convenience helper that sets the shared CORS headers used by every
 * `/api/*` function. Mutation methods are limited to JSON bodies, so
 * the only custom header we need to allow is `Authorization`.
 */
export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Admin-Token',
  );
}
