const db = require('../config/db');

async function migrate() {
    console.log('Starting owner profile v2 migration...');
    try {
        // Add new columns to owner_profiles table
        await db.query(`
            ALTER TABLE owner_profiles 
            ADD COLUMN IF NOT EXISTS prestations JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS horaires JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS banner_url TEXT,
            ADD COLUMN IF NOT EXISTS external_email TEXT,
            ADD COLUMN IF NOT EXISTS website TEXT;
        `);

        console.log('Migration successful: new fields added to owner_profiles table.');
    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        process.exit(0);
    }
}

migrate();
