const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'samalocation',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false
});

// Throttled connection logger: log a summary every 5 minutes instead of every connection
let newConnectionCount = 0;
setInterval(() => {
  if (newConnectionCount > 0) {
    console.log(`[DB Pool] ${newConnectionCount} nouvelle(s) connexion(s) établie(s) au cours des 5 dernières minutes.`);
    newConnectionCount = 0;
  }
}, 300000);

pool.on('connect', (client) => {
  client.query('SET search_path TO public, auth, extensions');
  newConnectionCount++;
});

pool.on('error', (err) => {
  console.error(`[DB Pool] ❌ Erreur inattendue sur un client inactif (${new Date().toISOString()}):`, err.message);
});

module.exports = pool;
