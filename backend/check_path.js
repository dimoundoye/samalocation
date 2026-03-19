const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSearchPath() {
    try {
        const res = await pool.query('SHOW search_path');
        console.log('Current search_path:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSearchPath();
