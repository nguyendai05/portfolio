import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { routeRequest } = await import('../server/router');
    return routeRequest(req, res);
  } catch (error) {
    const e = error as { code?: string; message?: string; name?: string };
    console.error('API function boot failed:', e);
    return res.status(500).json({
      success: false,
      error: 'API function boot failed',
      code: e.code || e.name || 'BOOT_ERROR',
      hint: e.message || 'Check Vercel function logs for details.',
    });
  }
}
