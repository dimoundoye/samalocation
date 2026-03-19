const db = require('./src/config/db');

async function fixPermissions() {
    try {
        // Les propriétaires (ceux qui n'ont pas de parent_id) doivent toujours avoir accès aux revenus
        await db.query(`
      UPDATE users 
      SET permissions = '{"can_view_revenue": true}'::jsonb 
      WHERE parent_id IS NULL
    `);
        console.log('--- Database fixed: Owners always have revenue visibility ---');
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
}

fixPermissions();
