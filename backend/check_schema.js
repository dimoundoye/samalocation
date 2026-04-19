const pool = require('./src/config/db');

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'owner_profiles'
    `);
    console.log('Columns in owner_profiles:');
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
