const db = require('./src/config/db');

async function migrate() {
    try {
        await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permissions JSONB 
      DEFAULT '{"can_view_revenue": false}'::jsonb
    `);
        console.log('--- Migration Successful: permissions column added to users table ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
