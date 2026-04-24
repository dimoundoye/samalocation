const pool = require('../backend/src/config/db');

async function findAdmin() {
  try {
    const res = await pool.query(`
      SELECT id, full_name, email, role 
      FROM user_profiles 
      WHERE role = 'admin';
    `);
    console.log('ADMIN_START');
    console.log(JSON.stringify(res.rows));
    console.log('ADMIN_END');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findAdmin();
