const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

console.log('Testing connection to:', process.env.DB_HOST);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', res.rows[0]);

        const resUsers = await pool.query('SELECT count(*) FROM users');
        console.log('✅ Query users (without prefix):', resUsers.rows[0]);

        const resPublicUsers = await pool.query('SELECT count(*) FROM public.users');
        console.log('✅ Query public.users (with prefix):', resPublicUsers.rows[0]);

    } catch (err) {
        console.error('❌ Connection or Query failed:');
        console.error(err);
    } finally {
        await pool.end();
    }
}

testConnection();
