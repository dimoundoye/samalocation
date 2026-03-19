const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding logo_url to owner_profiles...');
        await db.query(`
      ALTER TABLE owner_profiles 
      ADD COLUMN IF NOT EXISTS logo_url TEXT;
    `);
        console.log('Migration successful: logo_url added to owner_profiles');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
