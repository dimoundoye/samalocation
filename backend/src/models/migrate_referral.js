const db = require('../config/db');

async function migrate() {
    try {
        console.log('🚀 Démarrage de la migration pour le parrainage...');
        
        // Ajouter la colonne referred_by pour savoir qui a parrainé qui
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50),
            ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
        `);

        console.log('✅ Colonnes referred_by et referral_count ajoutées avec succès.');
        
        // On pourrait aussi vouloir indexer referred_by pour les performances
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
        `);

        console.log('✅ Index créé sur referred_by.');
    } catch (error) {
        console.error('❌ Erreur lors de la migration :', error);
    } finally {
        process.exit();
    }
}

migrate();
