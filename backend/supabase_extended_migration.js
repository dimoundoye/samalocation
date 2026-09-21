const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST || "aws-1-eu-west-1.pooler.supabase.com",
  user: process.env.SUPABASE_DB_USER || process.env.DB_USER || "postgres.oleotkybcuvndaoevvrj",
  password: process.env.SUPABASE_DB_PASS || process.env.DB_PASS,
  database: process.env.SUPABASE_DB_NAME || process.env.DB_NAME || "postgres",
  port: parseInt(process.env.SUPABASE_DB_PORT || process.env.DB_PORT) || 6543,
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
