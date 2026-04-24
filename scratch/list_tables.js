const pool = require('../backend/src/config/db');

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    console.log('TABLES_START');
    console.log(JSON.stringify(res.rows.map(r => r.table_name)));
    console.log('TABLES_END');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTables();
