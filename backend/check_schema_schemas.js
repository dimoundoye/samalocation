const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'samalocation',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function checkSchema() {
    try {
        const { rows } = await pool.query(`
      SELECT table_schema, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY table_schema
    `);
        console.log('Columns in users table across schemas:');
        rows.forEach(row => console.log(`- ${row.table_schema}.${row.column_name} (${row.data_type})`));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
