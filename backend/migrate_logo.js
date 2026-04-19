const pool = require('./src/config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS receipt_logo_url text;');
    console.log('Successfully added receipt_logo_url column to owner_profiles');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
