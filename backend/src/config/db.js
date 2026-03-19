const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Plus de capacité pour les pics de charge
  idleTimeoutMillis: 60000, // Garder les connexions "chaudes" pendant 1 minute
  connectionTimeoutMillis: 10000, // Laisser 10 sec à Supabase pour répondre (évite les erreurs immédiates)
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

pool.on('connect', (client) => {
  // Enforce public schema first to avoid ambiguity with auth.users
  client.query('SET search_path TO public, auth, extensions');
  console.log('✅ Nouvel utilisateur connecté à la base de données PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
