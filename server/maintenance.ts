import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from './auth.js';
import { withTransaction } from './db.js';

export async function handleMaintenance(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }
  if (!requireAdmin(req, res)) return;
  const deleted = await withTransaction(async (conn) => {
    const results = await Promise.all([
      conn.execute(`UPDATE contact_messages
        SET delivery_status = 'unknown', delivery_error_code = 'DELIVERY_INTERRUPTED'
        WHERE delivery_status = 'processing'
          AND delivery_attempted_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`),
      conn.execute('DELETE FROM rate_limit_buckets WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      conn.execute(`DELETE FROM admin_sessions
        WHERE (expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
           OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL 7 DAY))`),
      conn.execute('DELETE FROM admin_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)'),
      conn.execute('DELETE FROM contact_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY)'),
    ]);
    return results.map(([result]) => Number((result as { affectedRows?: number }).affectedRows || 0));
  });
  return res.status(200).json({
    success: true,
    data: {
      interruptedDeliveries: deleted[0],
      rateLimitBuckets: deleted[1],
      adminSessions: deleted[2],
      auditLogs: deleted[3],
      contactMessages: deleted[4],
    },
  });
}
