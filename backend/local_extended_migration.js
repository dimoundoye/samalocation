const db = require('./src/config/db');

async function migrate() {
    try {
        console.log("Starting extended migration on local database...");
        await db.query(`
            ALTER TABLE receipts 
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
            ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50);
        `);
        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
