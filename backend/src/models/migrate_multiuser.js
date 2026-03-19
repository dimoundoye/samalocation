const db = require('../config/db');

async function migrate() {
    console.log('Starting multi-user migration...');
    try {
        // Add parent_id to users table
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;
        `);

        // Add index for performance
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
        `);

        console.log('Migration successful: parent_id added to users table.');
    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    }
}

migrate();
