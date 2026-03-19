const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCollaborators() {
    try {
        // Set search path first as we do in the app
        await pool.query('SET search_path TO public, auth, extensions');

        console.log('--- Users with parent_id ---');
        const res = await pool.query('SELECT id, email, parent_id FROM users WHERE parent_id IS NOT NULL');
        console.table(res.rows);

        if (res.rows.length > 0) {
            const parentIds = [...new Set(res.rows.map(r => r.parent_id))];
            console.log('--- Checking findCollaboratorsByParentId for:', parentIds[0]);
            const { rows } = await pool.query(`
            SELECT u.id, u.email, up.full_name, up.role, u.created_at
            FROM users u
            JOIN user_profiles up ON u.id = up.id
            WHERE u.parent_id = $1
        `, [parentIds[0]]);
            console.table(rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCollaborators();
