const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('Environment variables check:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);

    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'Passer@2026#', // Using DB_PASS as seen in db.js
        database: process.env.DB_NAME || 'samalocation',
        multipleStatements: true
    });

    try {
        console.log('Running migration: add_coordinates_to_properties.sql');
        const migrationPath = path.join(__dirname, 'migrations', 'add_coordinates_to_properties.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await connection.query(sql);
        console.log('Migration completed successfully!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Error running migration:', error);
        }
    } finally {
        await connection.end();
    }
}

runMigration();
