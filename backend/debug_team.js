const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugTeam() {
    try {
        await pool.query('SET search_path TO public, auth, extensions');

        // 1. All users
        const { rows: users } = await pool.query('SELECT id, email, parent_id FROM users');

        // 2. All profiles
        const { rows: profiles } = await pool.query('SELECT id, full_name, role FROM user_profiles');

        console.log('--- ALL USERS ---');
        users.forEach(u => {
            const p = profiles.find(pr => pr.id === u.id);
            console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${p?.role} | Name: ${p?.full_name} | Parent: ${u.parent_id || 'null'}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugTeam();
