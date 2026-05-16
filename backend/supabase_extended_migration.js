const { Pool } = require('pg');

const pool = new Pool({
  host: "aws-1-eu-west-1.pooler.supabase.com",
  user: "postgres.oleotkybcuvndaoevvrj",
  password: "n9Zh6cSHscySTlDG",
  database: "postgres",
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
    try {
        console.log("🚀 Starting extended migration on Supabase...");
        
        console.log("1/1: Updating receipts table with frozen contacts and currency...");
        await pool.query(`
            ALTER TABLE receipts 
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
            ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50);
        `);
        
        console.log("✅ Extended migration on Supabase successful!");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Extended migration on Supabase failed:", error);
        await pool.end();
        process.exit(1);
    }
}

migrate();
