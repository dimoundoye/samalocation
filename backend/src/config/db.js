const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'samalocation',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
