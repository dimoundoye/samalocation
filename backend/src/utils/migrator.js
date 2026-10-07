const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

/**
 * Migrations SQL appliquées automatiquement au démarrage du serveur, AVANT qu'il accepte des requêtes.
 *
 * - Liste explicite et ordonnée : seuls ces fichiers sont exécutés (le dossier migrations/ contient d'anciens
 *   scripts, dont certains pour MySQL, qui ne doivent pas être rejoués). Ajouter les nouvelles migrations À LA FIN.
 * - Chaque migration n'est appliquée qu'une fois (table schema_migrations), dans une transaction :
 *   en cas d'erreur, rien n'est modifié et le serveur refuse de démarrer.
 * - Verrou transactionnel (compatible avec le pooler Supabase) : deux serveurs ne migrent jamais en même temps.
 * - Les fichiers doivent rester idempotents (IF NOT EXISTS, ON CONFLICT…) : une base déjà migrée à la main
 *   les rejoue une fois sans effet, puis ils sont enregistrés comme appliqués.
 */
const MIGRATIONS = [
    'create_organizations.sql',
    'add_password_changed_at.sql',
    'add_tenant_signature_proof.sql',
    'freeze_owner_signatures.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const LOCK_KEY = 72619404; // identifiant arbitraire du verrou de migration

// Les fichiers gèrent parfois eux-mêmes leur transaction : on retire ces BEGIN/COMMIT isolés
// pour exécuter migration + enregistrement dans une seule transaction.
const stripTransactionStatements = (sql) =>
    sql.replace(/^\s*BEGIN\s*;\s*$/gim, '').replace(/^\s*COMMIT\s*;\s*$/gim, '');

async function runMigrations() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name        VARCHAR(255) PRIMARY KEY,
            checksum    VARCHAR(64) NOT NULL,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);

    let applied = 0;
    for (const name of MIGRATIONS) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
        const checksum = crypto.createHash('sha256').update(sql).digest('hex');

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);

            const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
            if (rows.length > 0) {
                await client.query('COMMIT');
                if (rows[0].checksum !== checksum) {
                    console.warn(`  [MIGRATION] ⚠️  ${name} a été modifiée après son application (non rejouée).`);
                }
                continue;
            }

            const started = Date.now();
            await client.query(stripTransactionStatements(sql));
            await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
            await client.query('COMMIT');
            applied++;
            console.log(`  [MIGRATION] ✅ ${name} appliquée (${Date.now() - started} ms)`);
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            error.message = `Migration ${name} échouée (aucune modification appliquée) : ${error.message}`;
            throw error;
        } finally {
            client.release();
        }
    }

    console.log(applied > 0
        ? `  [MIGRATION] ${applied} migration(s) appliquée(s).`
        : '  [MIGRATION] Base à jour, aucune migration à appliquer.');
}

module.exports = { runMigrations, MIGRATIONS };
