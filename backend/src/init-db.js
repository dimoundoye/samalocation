const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'Passer@2026#',
        multipleStatements: true // Essential for running multiple SQL commands
    });

    try {
        console.log('Creating database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE ${process.env.DB_NAME};`);

        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, '..', '..', 'mysql_migration', 'schema_mysql.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema import (this may take a moment)...');
        // Remove database creation from the file content to avoid conflicts
        const cleanedSql = sql.replace(/CREATE DATABASE IF NOT EXISTS.*;\nUSE.*;/i, '');

        await connection.query(cleanedSql);
        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initDB();
