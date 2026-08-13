import type { PoolConnection } from 'mysql2/promise';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

export async function consumeRateLimit(
  conn: Pick<PoolConnection, 'execute'>,
  scope: string,
  bucketKey: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const seconds = Math.max(1, Math.floor(windowSeconds));
  await conn.execute(
    `INSERT INTO rate_limit_buckets
       (scope, bucket_key, window_started_at, request_count, expires_at)
     VALUES (?, ?, NOW(3), 1, DATE_ADD(NOW(3), INTERVAL ${seconds} SECOND))
     ON DUPLICATE KEY UPDATE
       request_count = IF(expires_at <= NOW(3), 1, request_count + 1),
       window_started_at = IF(expires_at <= NOW(3), NOW(3), window_started_at),
       expires_at = IF(expires_at <= NOW(3), DATE_ADD(NOW(3), INTERVAL ${seconds} SECOND), expires_at)`,
    [scope, bucketKey],
  );
  const [rows] = await conn.execute(
    `SELECT request_count,
            GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(3), expires_at)) AS retry_after
       FROM rate_limit_buckets
      WHERE scope = ? AND bucket_key = ?`,
    [scope, bucketKey],
  );
  const row = (rows as Array<{ request_count: number; retry_after: number }>)[0];
  const count = Number(row?.request_count || 0);
  return {
    allowed: count <= limit,
    count,
    limit,
    retryAfterSeconds: Number(row?.retry_after || seconds),
  };
}

export async function cleanupSecurityState(conn: Pick<PoolConnection, 'execute'>): Promise<void> {
  await conn.execute('DELETE FROM rate_limit_buckets WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');
  await conn.execute('DELETE FROM admin_sessions WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY) OR revoked_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');
  await conn.execute('DELETE FROM admin_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)');
}
