/**
 * Database Connection Test Script
 * Run: node db/test-connection.mjs
 * 
 * Make sure to have mysql2 installed: npm install mysql2
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
function loadEnv() {
    try {
        const envPath = resolve(__dirname, '..', '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');

        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        });
        console.log('✅ Loaded .env.local\n');
    } catch (error) {
        console.log('⚠️ Could not load .env.local, using existing environment variables\n');
    }
}

async function testConnection() {
    loadEnv();

    console.log('🔍 Database Configuration:');
    console.log('─'.repeat(50));
    console.log(`  Host:     ${process.env.MYSQL_HOST || '❌ NOT SET'}`);
    console.log(`  Port:     ${process.env.MYSQL_PORT || '3306 (default)'}`);
    console.log(`  User:     ${process.env.MYSQL_USER || '❌ NOT SET'}`);
    console.log(`  Password: ${process.env.MYSQL_PASSWORD ? '***hidden***' : '❌ NOT SET'}`);
    console.log(`  Database: ${process.env.MYSQL_DATABASE || '❌ NOT SET'}`);
    console.log('─'.repeat(50));
    console.log('');

    let connection;
    const startTime = Date.now();

    try {
        console.log('🔄 Connecting to database...');

        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            connectTimeout: 10000,
        });

        const connectionTime = Date.now() - startTime;
        console.log(`✅ Connected! (${connectionTime}ms)\n`);

        // Test query
        console.log('🔍 Running test query...');
        const [testRows] = await connection.execute('SELECT 1 as test, NOW() as server_time');
        console.log(`✅ Query successful!`);
        console.log(`   Server time: ${testRows[0].server_time}\n`);

        // Get tables
        console.log('📋 Tables in database:');
        console.log('─'.repeat(50));

        const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count,
        ROUND(DATA_LENGTH / 1024, 2) as data_size_kb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE]);

        if (tables.length === 0) {
            console.log('   ⚠️ No tables found! Run schema.sql to create tables.');
        } else {
            tables.forEach(table => {
                console.log(`   📄 ${table.table_name.padEnd(25)} | ${String(table.row_count || 0).padStart(5)} rows | ${table.data_size_kb} KB`);
            });
        }
        console.log('─'.repeat(50));

        // Test ideas table specifically
        console.log('\n🧪 Testing ideas table (from Collaboration Board):');
        try {
            const [ideas] = await connection.execute('SELECT COUNT(*) as count FROM ideas');
            console.log(`   ✅ ideas table exists with ${ideas[0].count} records`);
        } catch (e) {
            console.log(`   ❌ ideas table error: ${e.message}`);
        }

        console.log('\n🎉 All tests passed! Database is ready.\n');

    } catch (error) {
        const connectionTime = Date.now() - startTime;
        console.log(`\n❌ Connection failed after ${connectionTime}ms\n`);
        console.log('Error details:');
        console.log('─'.repeat(50));
        console.log(`  Code:     ${error.code || 'N/A'}`);
        console.log(`  Errno:    ${error.errno || 'N/A'}`);
        console.log(`  Message:  ${error.message}`);
        console.log(`  SQLState: ${error.sqlState || 'N/A'}`);
        console.log('─'.repeat(50));
        console.log('\n💡 Troubleshooting hints:');
        console.log('   1. Check if MySQL server is running');
        console.log('   2. Verify credentials in .env.local');
        console.log('   3. Make sure database exists: CREATE DATABASE portfolio_db');
        console.log('   4. Check firewall if using remote database');
        console.log('   5. For XAMPP: Make sure MySQL service is started\n');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed.');
        }
    }
}

testConnection();
