const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding owner_logo to receipts...');
        await db.query(`
      ALTER TABLE receipts 
      ADD COLUMN IF NOT EXISTS owner_logo TEXT;
    `);
        console.log('Migration successful: owner_logo added to receipts');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
