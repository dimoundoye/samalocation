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

async function checkUsers() {
    try {
        const { rows } = await pool.query('SELECT id, email, custom_id, parent_id FROM public.users ORDER BY created_at DESC LIMIT 5');
        console.log('Recent users in public.users:', JSON.stringify(rows, null, 2));

        const { rows: profiles } = await pool.query('SELECT id, email, role FROM public.user_profiles ORDER BY created_at DESC LIMIT 5');
        console.log('Recent profiles in public.user_profiles:', JSON.stringify(profiles, null, 2));
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
