const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testConnection() {
    console.log('--- Database Diagnostic ---');
    console.log('Configured Host:', process.env.DB_HOST || '127.0.0.1');
    console.log('Configured User:', process.env.DB_USER || 'root');
    console.log('Configured Database:', process.env.DB_NAME || 'samalocation');
    console.log('Password set:', process.env.DB_PASS ? 'Yes' : 'No (Empty)');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'samalocation',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Success: Connected to the database!');
        await connection.end();
    } catch (err) {
        console.error('❌ Error: Could not connect to database.');
        console.error('Code:', err.code);
        console.error('Message:', err.message);

        if (err.code === 'ECONNREFUSED') {
            console.log('\nTip: Is MySQL/XAMPP running? Check the Apache/MySQL control panel.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.log('\nTip: The database "samalocation" does not exist in phpMyAdmin. Please create it.');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nTip: Check your username and password. Default XAMPP user is "root" with no password.');
        }
    }
}

testConnection();
