import mysql, { type ConnectionOptions } from 'mysql2/promise';

/**
 * Shared MySQL connection helper for all `/api/*` serverless functions.
 *
 * - Reads MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE.
 * - Auto-enables SSL when the host looks like a managed cloud provider (TiDB
 *   Cloud, Aiven, PlanetScale, AWS RDS) or when `MYSQL_SSL=true` is set
 *   explicitly. This avoids "SSL required" errors on TiDB serverless.
 * - Applies a 10s connection timeout so cold starts fail fast instead of
 *   hanging the request.
 */
export async function getConnection() {
  const host = process.env.MYSQL_HOST || '';
  const requireSsl =
    process.env.MYSQL_SSL === 'true' ||
    /tidbcloud\.com|aivencloud\.com|rds\.amazonaws\.com|psdb\.cloud/i.test(host);

  const config: ConnectionOptions = {
    host,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectTimeout: 10_000,
    ...(requireSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  };

  return mysql.createConnection(config);
}

/**
 * Converts a mysql2 error into a JSON-safe payload that the frontend can
 * surface to the user without exposing passwords / stack traces.
 *
 * `ER_ACCESS_DENIED_ERROR` (1045), `ER_BAD_DB_ERROR` (1049),
 * `ECONNREFUSED`, `ETIMEDOUT` all get specific Vietnamese hints so the
 * Collaboration Board can display an actionable message.
 */
export function formatDbError(err: unknown): {
  code: string;
  message: string;
  hint: string;
} {
  const e = err as { code?: string; errno?: number; message?: string };
  const code = e?.code || 'UNKNOWN';
  const rawMessage = e?.message || 'Database error';
  // Strip host/user from messages before returning to the client.
  const safeMessage = rawMessage.replace(/['"]?[^\s'"]+@[^\s'"]+['"]?/g, '***');

  let hint = 'Kiểm tra lại biến môi trường MYSQL_* trên Vercel.';
  switch (code) {
    case 'ER_ACCESS_DENIED_ERROR':
      hint = 'Sai user hoặc password database. Cập nhật MYSQL_USER / MYSQL_PASSWORD trên Vercel → Settings → Environment Variables.';
      break;
    case 'ER_BAD_DB_ERROR':
      hint = 'Database không tồn tại. Kiểm tra MYSQL_DATABASE hoặc tạo database bằng CREATE DATABASE.';
      break;
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
      hint = 'Không kết nối được host database. Kiểm tra MYSQL_HOST và firewall/IP allowlist.';
      break;
    case 'ETIMEDOUT':
    case 'PROTOCOL_CONNECTION_LOST':
      hint = 'Kết nối database bị timeout. Kiểm tra network và cho phép Vercel IP trên TiDB.';
      break;
    case 'ER_NO_SUCH_TABLE':
      hint = 'Bảng chưa được khởi tạo. Chạy db/schema.sql trên TiDB để tạo bảng cần thiết.';
      break;
  }

  return { code, message: safeMessage, hint };
}
