const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkProfiles() {
    try {
        await pool.query('SET search_path TO public, auth, extensions');

        console.log('--- User Profiles ---');
        const res = await pool.query('SELECT id, full_name, role FROM user_profiles');
        console.table(res.rows);

        console.log('--- Users ---');
        const resUsers = await pool.query('SELECT id, email, parent_id FROM users');
        console.table(resUsers.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkProfiles();
