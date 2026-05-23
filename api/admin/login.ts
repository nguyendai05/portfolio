import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, getConfiguredAdminToken } from '../_lib/auth';

/**
 * Admin login endpoint.
 *
 * - Server holds `ADMIN_PASSWORD` and `ADMIN_TOKEN` in env.
 * - Client posts `{ password }`; if it matches `ADMIN_PASSWORD`, we return
 *   the `ADMIN_TOKEN` which the client stores in localStorage and sends
 *   as a Bearer token on every admin request.
 *
 * If `ADMIN_PASSWORD` is not configured, we fall back to allowing the
 * caller to authenticate by directly providing the `ADMIN_TOKEN` value
 * as the password. This keeps the bootstrap experience simple.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const token = getConfiguredAdminToken();
  if (!token) {
    return res.status(503).json({
      success: false,
      error:
        'Admin login is not configured (set ADMIN_TOKEN — and optionally ADMIN_PASSWORD — in the server env).',
    });
  }

  const body = (req.body || {}) as Record<string, unknown>;
  const submitted =
    typeof body.password === 'string'
      ? body.password
      : typeof body.token === 'string'
        ? body.token
        : '';

  const expected = process.env.ADMIN_PASSWORD || token;
  if (!submitted || submitted !== expected) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid credentials' });
  }

  return res.status(200).json({ success: true, data: { token } });
}
