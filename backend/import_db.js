const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function importDatabase() {
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        multipleStatements: true
    };

    let connection;

    try {
        console.log('1. Connexion au serveur MySQL...');
        connection = await mysql.createConnection(connectionConfig);

        console.log(`2. Création de la base de données "${process.env.DB_NAME}" si elle n'existe pas...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        await connection.query(`USE \`${process.env.DB_NAME}\``);

        const mainDumpPath = path.join(__dirname, '../samal2728987.sql');
        if (fs.existsSync(mainDumpPath)) {
            console.log('3. Importation de la sauvegarde principale (samal2728987.sql)...');
            const sql = fs.readFileSync(mainDumpPath, 'utf8');

            // Some dumps contain "CREATE DATABASE" or "USE", we might need to be careful
            // but usually standard PHPMyAdmin dumps are fine.
            await connection.query(sql);
            console.log('✅ Sauvegarde principale importée.');
        } else {
            console.error('❌ Erreur: Fichier samal2728987.sql introuvable à la racine.');
            return;
        }

        const updateScriptPath = path.join(__dirname, 'update_local_db.sql');
        if (fs.existsSync(updateScriptPath)) {
            console.log('4. Application des mises à jour de structure (update_local_db.sql)...');
            const updateSql = fs.readFileSync(updateScriptPath, 'utf8');
            await connection.query(updateSql);
            console.log('✅ Mises à jour de structure appliquées.');
        }

        console.log('\n✨ IMPORTATION RÉUSSIE ! ✨');
        console.log('Votre application est maintenant configurée pour utiliser la base de données locale.');

    } catch (error) {
        console.error('\n❌ ERREUR lors de l\'importation :');
        console.error(error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n👉 ASSUREZ-VOUS QUE MYSQL EST BIEN DÉMARRÉ DANS XAMPP !');
        }
    } finally {
        if (connection) await connection.end();
    }
}

importDatabase();
