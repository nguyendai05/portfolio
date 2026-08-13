import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { loadLocalEnv } from './env.mjs';

loadLocalEnv();

const migrationsDir = path.resolve('db/migrations');
const baselineOnly = process.argv.includes('--baseline');
const lockName = 'portfolio_schema_migrations';
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 1,
  multipleStatements: true,
  ...(process.env.MYSQL_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
});

function checksum(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

const files = fs.readdirSync(migrationsDir).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
const conn = await pool.getConnection();

try {
  const [lockRows] = await conn.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
  if (Number(lockRows[0]?.acquired) !== 1) throw new Error('Could not acquire migration lock');

  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    checksum CHAR(64) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  for (const file of files) {
    const [version, ...nameParts] = file.replace(/\.sql$/, '').split('_');
    const name = nameParts.join('_');
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const hash = checksum(sql);
    const [rows] = await conn.query('SELECT checksum FROM schema_migrations WHERE version = ?', [version]);
    if (rows.length > 0) {
      if (rows[0].checksum !== hash) throw new Error(`Checksum mismatch for migration ${file}`);
      continue;
    }
    if (!baselineOnly) await conn.query(sql);
    await conn.query(
      'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
      [version, name, hash],
    );
    console.log(`${baselineOnly ? 'Baselined' : 'Applied'} ${file}`);
  }
} finally {
  try { await conn.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch {}
  conn.release();
  await pool.end();
}
