const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'samalocation',
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    console.log('Testing connection to:', process.env.DB_NAME);
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'receipts'");
    console.log('Columns of receipts:');
    res.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`));
    await pool.end();
  } catch (error) {
    console.error('DB test failed:', error);
  }
}

main();
