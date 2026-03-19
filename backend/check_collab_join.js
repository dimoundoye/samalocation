const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCollabJoin() {
    try {
        await pool.query('SET search_path TO public, auth, extensions');

        // Jean Paul's ID
        const paulId = '709ef75e-9690-4cb9-9697-09bdd97275ea';

        console.log('--- Checking Collaborators for Paul ---');
        const { rows } = await pool.query(`
        SELECT u.id, u.email, up.full_name, up.role, u.parent_id
        FROM users u
        INNER JOIN user_profiles up ON u.id = up.id
        WHERE u.parent_id = $1
    `, [paulId]);

        console.log('Found:', rows.length);
        console.table(rows);

        // Also check if Paul exists in both
        console.log('--- Checking Paul in both ---');
        const { rows: paulUs } = await pool.query('SELECT id FROM users WHERE id = $1', [paulId]);
        const { rows: paulUp } = await pool.query('SELECT id FROM user_profiles WHERE id = $1', [paulId]);
        console.log('Paul in users:', paulUs.length);
        console.log('Paul in profiles:', paulUp.length);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCollabJoin();
