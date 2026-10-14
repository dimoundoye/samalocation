const db = require('../config/db');
const LEGAL = require('../config/legal');

const formatDate = (version) => new Date(`${version}T00:00:00Z`)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Prévient tous les utilisateurs (cloche) quand une page juridique change de version.
 * Chaque version n'est annoncée qu'une fois, même avec plusieurs serveurs qui démarrent en même temps :
 * l'enregistrement de la version et l'envoi des notifications se font dans la même transaction.
 */
async function announceLegalUpdates() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const changed = [];
        for (const [key, doc] of Object.entries(LEGAL)) {
            const { rowCount } = await client.query(
                `INSERT INTO legal_announcements (document, version) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [key, doc.version]
            );
            if (rowCount > 0) changed.push(doc);
        }

        if (changed.length === 0) {
            await client.query('COMMIT');
            return 0;
        }

        // Les deux pages changées ensemble : une seule notification
        const date = formatDate(changed.map(d => d.version).sort().pop());
        const title = changed.length > 1
            ? 'Mise à jour de nos conditions'
            : `Mise à jour : ${changed[0].name}`;
        const message = changed.length > 1
            ? `Nos Conditions d'utilisation et notre Politique de confidentialité ont été mises à jour le ${date}. Prenez quelques minutes pour les lire.`
            : `${changed[0].updated} le ${date}. Prenez quelques minutes pour ${changed[0].pronoun} lire.`;

        const { rowCount: sent } = await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message, link)
             SELECT gen_random_uuid(), up.id, 'legal', $1, $2, $3
             FROM user_profiles up
             WHERE up.role <> 'admin'`,
            [title, message, changed[0].link]
        );

        await client.query('COMMIT');
        console.log(`  [LÉGAL] 📜 ${changed.map(d => d.name).join(' + ')} : ${sent} utilisateur(s) prévenu(s).`);
        return sent;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { announceLegalUpdates };
