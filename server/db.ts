import mysql, {
  type ConnectionOptions,
  type Pool,
  type PoolConnection,
} from 'mysql2/promise';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const host = process.env.MYSQL_HOST || '';
  const requireSsl =
    process.env.MYSQL_SSL === 'true' ||
    /tidbcloud\.com|aivencloud\.com|rds\.amazonaws\.com|psdb\.cloud/i.test(host);
  const limit = Math.max(1, Math.min(Number(process.env.MYSQL_POOL_LIMIT || 2), 10));
  const config: ConnectionOptions = {
    host,
    port: Number.parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 10_000),
    ...(requireSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  };
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: limit,
    queueLimit: Number(process.env.MYSQL_POOL_QUEUE_LIMIT || 20),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  return pool;
}

export async function getConnection(): Promise<PoolConnection> {
  const startedAt = performance.now();
  const timeoutMs = Math.max(250, Number(process.env.MYSQL_ACQUIRE_TIMEOUT_MS || 5_000));
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const acquisition = getPool().getConnection().then((connection) => {
    if (timedOut) {
      connection.release();
      throw Object.assign(new Error('Database pool acquisition timed out'), { code: 'DB_POOL_TIMEOUT' });
    }
    return connection;
  });
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(Object.assign(new Error('Database pool acquisition timed out'), { code: 'DB_POOL_TIMEOUT' }));
    }, timeoutMs);
  });
  try {
    const connection = await Promise.race([acquisition, timeout]);
    console.info(JSON.stringify({ type: 'db-acquire', durationMs: Math.round(performance.now() - startedAt), outcome: 'success' }));
    return connection;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'db-acquire',
      durationMs: Math.round(performance.now() - startedAt),
      outcome: 'failure',
      code: error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : 'UNKNOWN',
    }));
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withConnection<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getConnection();
  try {
    return await work(conn);
  } finally {
    conn.release();
  }
}

export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      const value = await work(conn);
      await conn.commit();
      return value;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

export function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'ER_DUP_ENTRY');
}

export function formatDbError(err: unknown): { code: string; message: string; hint: string } {
  const e = err as { code?: string; errno?: number; message?: string };
  const code = e?.code || 'UNKNOWN';
  const safeMessage = (e?.message || 'Database error')
    .replace(/['"]?[^\s'"]+@[^\s'"]+['"]?/g, '***')
    .replace(/(?:password|token|secret)=?[^\s,;]*/gi, '[REDACTED]');
  const hints: Record<string, string> = {
    ER_ACCESS_DENIED_ERROR: 'Database credentials are invalid.',
    ER_BAD_DB_ERROR: 'The configured database does not exist.',
    ECONNREFUSED: 'The database host refused the connection.',
    ENOTFOUND: 'The database host could not be resolved.',
    ETIMEDOUT: 'The database connection timed out.',
    PROTOCOL_CONNECTION_LOST: 'The database connection was lost.',
    ER_NO_SUCH_TABLE: 'A required database migration has not been applied.',
    ER_CON_COUNT_ERROR: 'The database connection budget is exhausted.',
    DB_POOL_TIMEOUT: 'The database pool acquisition deadline was exceeded.',
  };
  return { code, message: safeMessage, hint: hints[code] || 'Check server logs and database health.' };
}
