const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkTables() {
    console.log('--- Database Table Check ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'samalocation',
            port: process.env.DB_PORT || 3306
        });


        const [rows] = await connection.query('SHOW TABLES');
        console.log(`Found ${rows.length} tables:`);
        rows.forEach(row => {
            console.log(` - ${Object.values(row)[0]}`);
        });

        if (rows.length === 0) {
            console.log('\n⚠️ Warning: The database is EMPTY. You need to import "samalocation.sql" into phpMyAdmin.');
        } else {
            // Check if properties table has data
            const [propRows] = await connection.query('SELECT COUNT(*) as count FROM properties');
            console.log(`\nProperties count: ${propRows[0].count}`);
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkTables();
