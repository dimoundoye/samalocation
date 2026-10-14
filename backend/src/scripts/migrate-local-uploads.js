/**
 * Transfère vers Cloudinary les anciens fichiers du dossier uploads/ encore référencés en base,
 * puis remplace leurs URL locales par les URL Cloudinary.
 *
 * Tant que des fichiers vivent sur le disque du VPS, le backend ne peut pas tourner sur plusieurs
 * serveurs et ces fichiers disparaissent avec le serveur. Les nouveaux envois vont déjà sur Cloudinary.
 *
 * Usage (depuis backend/, ou dans le conteneur : docker compose exec backend node src/scripts/migrate-local-uploads.js) :
 *   node src/scripts/migrate-local-uploads.js           → simulation : liste ce qui serait transféré, ne modifie rien
 *   node src/scripts/migrate-local-uploads.js --apply   → envoie les fichiers sur Cloudinary et met à jour la base
 *
 * Les fichiers locaux ne sont jamais supprimés : une fois la migration vérifiée, le dossier peut être archivé.
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db'); // charge aussi le .env (CLOUDINARY_URL)
const cloudinary = require('cloudinary').v2;

const APPLY = process.argv.includes('--apply');
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const CLOUDINARY_FOLDER = 'samalocation/legacy-uploads';
const TEXT_TYPES = ['text', 'varchar', 'bpchar', 'json', 'jsonb', '_text', '_varchar'];
const SKIPPED_TABLES = ['schema_migrations'];

// URL absolue (https://api.exemple.com/uploads/x.jpg) ou relative (/uploads/x.jpg)
const UPLOAD_REF = /(?:https?:\/\/[^\s"'<>(),\\]+)?\/uploads\/[^\s"'<>(),?#\\]+/g;

const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`;

// Chemin du fichier sur le disque, confiné au dossier uploads (anti path-traversal)
function localPathFor(ref) {
    let rel = ref.split('/uploads/')[1] || '';
    try { rel = decodeURIComponent(rel); } catch { /* garde la forme brute */ }
    const fullPath = path.resolve(UPLOADS_DIR, rel);
    return fullPath.startsWith(UPLOADS_DIR + path.sep) ? fullPath : null;
}

async function listTextColumns() {
    const { rows } = await db.query(`
        SELECT c.relname AS table_name, a.attname AS column_name, format_type(a.atttypid, a.atttypmod) AS column_type
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_type t ON t.oid = a.atttypid
        WHERE n.nspname = 'public' AND c.relkind = 'r'
          AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
          AND t.typname = ANY($1)
        ORDER BY c.relname, a.attname
    `, [TEXT_TYPES]);
    return rows.filter(r => !SKIPPED_TABLES.includes(r.table_name));
}

async function main() {
    console.log(APPLY ? '=== MIGRATION (--apply) ===' : '=== SIMULATION (aucune modification, ajouter --apply pour exécuter) ===');
    if (APPLY && !cloudinary.config().cloud_name) {
        throw new Error('CLOUDINARY_URL manquant dans le .env');
    }

    // 1. Repérer toutes les références /uploads/ en base
    const columns = await listTextColumns();
    const usages = []; // { table, column, type, refs: Set }
    const allRefs = new Set();

    for (const col of columns) {
        const ident = `${quoteIdent(col.table_name)}.${quoteIdent(col.column_name)}`;
        const { rows } = await db.query(
            `SELECT ${quoteIdent(col.column_name)}::text AS value FROM ${quoteIdent(col.table_name)}
             WHERE strpos(${quoteIdent(col.column_name)}::text, '/uploads/') > 0`
        );
        if (rows.length === 0) continue;

        const refs = new Set();
        for (const { value } of rows) {
            for (const match of value.matchAll(UPLOAD_REF)) refs.add(match[0]);
        }
        if (refs.size === 0) continue;

        usages.push({ table: col.table_name, column: col.column_name, type: col.column_type, refs });
        refs.forEach(r => allRefs.add(r));
        console.log(`  ${ident} : ${rows.length} ligne(s), ${refs.size} référence(s)`);
    }

    if (allRefs.size === 0) {
        console.log('\n✅ Aucune référence à /uploads/ en base : rien à migrer.');
        return;
    }

    // 2. Vérifier la présence des fichiers et les envoyer sur Cloudinary
    const replacements = new Map(); // ref locale → URL Cloudinary
    const missing = [];
    const uploadedByFile = new Map(); // un même fichier peut être référencé sous plusieurs formes d'URL

    for (const ref of allRefs) {
        const fullPath = localPathFor(ref);
        if (!fullPath || !fs.existsSync(fullPath)) {
            missing.push(ref);
            continue;
        }
        if (!APPLY) {
            console.log(`  [à transférer] ${ref}`);
            continue;
        }
        if (!uploadedByFile.has(fullPath)) {
            const publicId = path.relative(UPLOADS_DIR, fullPath)
                .replace(/\\/g, '/')
                .replace(/\.[^/.]+$/, '')
                .replace(/[^\w\-/]/g, '_');
            const result = await cloudinary.uploader.upload(fullPath, {
                folder: CLOUDINARY_FOLDER,
                public_id: publicId,
                resource_type: 'auto',
                overwrite: false,
            });
            uploadedByFile.set(fullPath, result.secure_url);
            console.log(`  [envoyé] ${ref} → ${result.secure_url}`);
        }
        replacements.set(ref, uploadedByFile.get(fullPath));
    }

    if (missing.length > 0) {
        console.log(`\n⚠️  ${missing.length} fichier(s) référencé(s) mais absent(s) du disque (laissés tels quels) :`);
        missing.forEach(ref => console.log(`  - ${ref}`));
    }

    if (!APPLY) {
        console.log(`\n${allRefs.size - missing.length} fichier(s) à transférer. Relancer avec --apply pour exécuter.`);
        return;
    }

    // 3. Remplacer les URL en base, en une seule transaction (tout ou rien).
    // Les références les plus longues d'abord : une URL absolue contient la forme relative.
    const orderedRefs = [...replacements.keys()].sort((a, b) => b.length - a.length);
    const client = await db.connect();
    let updatedRows = 0;
    try {
        await client.query('BEGIN');
        for (const usage of usages) {
            const col = quoteIdent(usage.column);
            for (const ref of orderedRefs) {
                if (!usage.refs.has(ref)) continue;
                const result = await client.query(
                    `UPDATE ${quoteIdent(usage.table)} SET ${col} = replace(${col}::text, $1, $2)::${usage.type}
                     WHERE strpos(${col}::text, $1) > 0`,
                    [ref, replacements.get(ref)]
                );
                updatedRows += result.rowCount;
            }
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        err.message = `Mise à jour de la base annulée (aucune modification) : ${err.message}`;
        throw err;
    } finally {
        client.release();
    }

    console.log(`\n✅ ${uploadedByFile.size} fichier(s) transféré(s), ${updatedRows} mise(s) à jour en base.`);
    console.log('Les fichiers locaux sont conservés : archivez le dossier uploads/ une fois le site vérifié.');
}

main()
    .catch(err => {
        console.error('❌', err.message);
        process.exitCode = 1;
    })
    // db.js garde un minuteur de journalisation actif : sortie explicite une fois le pool fermé
    .finally(() => db.end().finally(() => process.exit()));
