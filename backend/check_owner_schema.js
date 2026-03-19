const db = require('./src/config/db');

async function checkSchema() {
    try {
        const { rows } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'owner_profiles'
    `);
        console.log('Columns in owner_profiles:', rows.map(r => r.column_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
