const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixSchema() {
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'samalocation',
        multipleStatements: true
    };

    let connection;

    try {
        console.log('Connexion à la base de données locale pour correction du schéma...');
        connection = await mysql.createConnection(connectionConfig);

        const queries = [
            // Correction pour owner_profiles
            "ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS signature_url TEXT AFTER bio",
            "ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS id_card_url TEXT AFTER signature_url",
            "ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS verification_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none' AFTER id_card_url",
            "ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE AFTER verification_status",
            "ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS verified_at DATETIME AFTER is_verified",

            // Correction pour properties (déjà fait normalement, mais par précaution)
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL AFTER address",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL AFTER latitude",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS equipments JSON NULL AFTER photos",

            // Correction pour users
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10) UNIQUE AFTER id",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_setup_complete BOOLEAN DEFAULT TRUE AFTER password_hash",

            // Correction pour user_profiles
            "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10) AFTER id",

            // Correction pour receipts
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS unit_id VARCHAR(36) AFTER property_id",

            // Ajout de la table maintenance_requests
            `CREATE TABLE IF NOT EXISTS maintenance_requests (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                property_id VARCHAR(36) NOT NULL,
                unit_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('pending', 'in_progress', 'resolved', 'cancelled') DEFAULT 'pending',
                photos JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];

        for (let sql of queries) {
            try {
                // MySQL <= 8.0 doesn't support IF NOT EXISTS for ADD COLUMN
                // We'll run the simple ALTER and catch "Duplicate column name"
                const cleanSql = sql.replace(' IF NOT EXISTS', '');
                await connection.query(cleanSql);
                console.log(`✅ Exécuté : ${cleanSql.substring(0, 50)}...`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name')) {
                    console.log(`ℹ️ Déjà présent : ${sql.split('ADD COLUMN')[1]?.split(' ')[1] || sql}`);
                } else {
                    console.warn(`⚠️ Erreur sur : ${sql} -> ${err.message}`);
                }
            }
        }

        console.log('\n✨ Schéma mis à jour avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la correction du schéma :', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixSchema();
