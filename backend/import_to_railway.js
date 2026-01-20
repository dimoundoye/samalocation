const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function importSql() {
    const sqlFile = path.join(__dirname, '../samal2728987.sql');
    let sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('Connecting to Railway MySQL...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('Connected! Clearing existing tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        const [tables] = await connection.query('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Importing data...');
        // Split by ';' but be careful with data containing ';'
        // However, for this dump, multipleStatements should handle it if file is not TOO big
        await connection.query(sqlContent);
        console.log('✅ Success: Data imported successfully to Railway!');

    } catch (err) {
        console.error('❌ Error during import:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

importSql();
