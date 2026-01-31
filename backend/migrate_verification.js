const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        await pool.query(`
            ALTER TABLE owner_profiles 
            ADD COLUMN id_card_url TEXT,
            ADD COLUMN verification_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none',
            ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN verified_at DATETIME;
        `);

        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
