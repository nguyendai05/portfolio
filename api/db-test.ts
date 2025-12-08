import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// --- Database Connection Test API ---
// Endpoint: GET /api/db-test
// This API checks if the database connection is working properly

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const startTime = Date.now();
    let connection;

    try {
        // Check environment variables
        const config = {
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD ? '***hidden***' : 'NOT SET',
            database: process.env.MYSQL_DATABASE,
        };

        // Try to connect
        const connectionConfig: any = {
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            connectTimeout: 10000, // 10 seconds timeout
        };

        if (process.env.MYSQL_SSL === 'true') {
            connectionConfig.ssl = { rejectUnauthorized: true };
        }

        connection = await mysql.createConnection(connectionConfig);

        // Test query
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time');
        const testResult = (rows as any[])[0];

        // Get table counts
        const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE]);

        const connectionTime = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            message: '✅ Database connection successful!',
            data: {
                connection: {
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    database: config.database,
                    password: config.password,
                },
                test: {
                    query: 'SELECT 1',
                    result: testResult.test,
                    serverTime: testResult.server_time,
                },
                tables: tables,
                performance: {
                    connectionTimeMs: connectionTime,
                },
            },
        });
    } catch (error: any) {
        const connectionTime = Date.now() - startTime;

        return res.status(500).json({
            success: false,
            message: '❌ Database connection failed!',
            error: {
                code: error.code,
                errno: error.errno,
                message: error.message,
                sqlState: error.sqlState,
            },
            config: {
                host: process.env.MYSQL_HOST || 'NOT SET',
                port: process.env.MYSQL_PORT || '3306',
                user: process.env.MYSQL_USER || 'NOT SET',
                database: process.env.MYSQL_DATABASE || 'NOT SET',
                password: process.env.MYSQL_PASSWORD ? '***set***' : 'NOT SET',
            },
            performance: {
                connectionTimeMs: connectionTime,
            },
            hints: [
                'Check if MySQL server is running',
                'Verify MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in .env.local',
                'Make sure the database exists: CREATE DATABASE portfolio_db',
                'Check firewall/network settings if using remote database',
            ],
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
