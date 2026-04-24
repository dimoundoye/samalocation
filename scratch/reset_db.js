const pool = require('../backend/src/config/db');

async function resetDatabase() {
  const adminId = 'admin-001';
  
  const tablesToTruncate = [
    'properties',
    'property_units',
    'tenants',
    'receipts',
    'messages',
    'notifications',
    'maintenance_requests',
    'ai_usage_logs',
    'site_visits',
    'reports',
    'contact_messages',
    'team_invitations',
    'favorites',
    'rental_contracts',
    'subscriptions'
  ];

  try {
    console.log('--- Démarrage de la réinitialisation ---');

    // 1. Vider les tables de données avec CASCADE pour gérer les FK
    for (const table of tablesToTruncate) {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`✅ Table ${table} vidée.`);
    }

    // 2. Supprimer les profils propriétaires (sauf admin s'il en a un)
    await pool.query(`DELETE FROM owner_profiles WHERE id != $1`, [adminId]);
    console.log(`✅ Table owner_profiles nettoyée.`);

    // 3. Supprimer les profils utilisateurs (sauf admin)
    // On doit faire attention aux dépendances. 
    // Normalement CASCADE sur users aurait tout supprimé, mais on veut GARDER l'admin.
    await pool.query(`DELETE FROM user_profiles WHERE id != $1`, [adminId]);
    console.log(`✅ Table user_profiles nettoyée.`);

    // 4. Supprimer les comptes utilisateurs (sauf admin)
    await pool.query(`DELETE FROM users WHERE id != $1`, [adminId]);
    console.log(`✅ Table users nettoyée.`);

    console.log('--- Réinitialisation terminée avec succès ! ---');
    console.log('Seul le compte admin (' + adminId + ') a été conservé.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation :', err);
    process.exit(1);
  }
}

resetDatabase();
