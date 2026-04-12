const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1]);
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    const end = Date.now();
    console.log('✅ Success! Server time:', res.rows[0].now);
    console.log('Connection time:', end - start, 'ms');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
