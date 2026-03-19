const db = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    const migrationFile = process.argv[2] || 'migrations/add_reset_token_to_users.sql';
    const migrationPath = path.isAbsolute(migrationFile) ? migrationFile : path.join(__dirname, migrationFile);

    if (!fs.existsSync(migrationPath)) {
        console.log(`❌ Fichier de migration non trouvé : ${migrationPath}`);
        process.exit(1);
    }

    console.log(`🚀 Exécution de la migration : ${path.basename(migrationPath)}`);
    console.log(`Connexion à ${process.env.DB_HOST}...`);

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await db.query(sql);
        console.log('✅ Migration terminée avec succès !');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️ Colonnes déjà présentes, skipping.');
        } else {
            console.error('❌ Erreur lors de la migration:', error);
        }
    } finally {
        process.exit(0);
    }
}

runMigration();
