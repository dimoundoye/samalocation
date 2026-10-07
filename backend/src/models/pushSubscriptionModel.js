const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Abonnements Web Push : un par navigateur/appareil, rattaché au compte connecté
const PushSubscription = {
    /**
     * Enregistre l'abonnement d'un appareil. Si l'appareil était abonné pour un autre compte
     * (changement de compte sur le même navigateur), il est rattaché au compte actuel.
     */
    async upsert(userId, { endpoint, keys }, userAgent = null) {
        await db.query(
            `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (endpoint)
             DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
                           user_agent = EXCLUDED.user_agent, updated_at = NOW()`,
            [uuidv4(), userId, endpoint, keys.p256dh, keys.auth, userAgent]
        );
    },

    async removeForUser(userId, endpoint) {
        await db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
    },

    async removeByEndpoint(endpoint) {
        await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    },

    /**
     * Appareils à prévenir pour une notification adressée à `recipientId` :
     * l'utilisateur lui-même, plus les membres actifs de l'organisation si `recipientId` est une organisation
     * (les collaborateurs voient les notifications de l'espace qu'ils gèrent).
     */
    async findForRecipient(recipientId) {
        try {
            const { rows } = await db.query(
                `SELECT DISTINCT ps.endpoint, ps.p256dh, ps.auth
                 FROM push_subscriptions ps
                 JOIN users u ON u.id = ps.user_id AND COALESCE(u.is_blocked, false) = false
                 WHERE ps.user_id = $1
                    OR ps.user_id IN (SELECT m.user_id::text FROM memberships m
                                      WHERE m.organization_id::text = $1 AND m.status = 'active')`,
                [String(recipientId)]
            );
            return rows;
        } catch (err) {
            // Table memberships absente (migration create_organizations non lancée) : destinataire direct uniquement
            if (err.code !== '42P01') throw err;
            const { rows } = await db.query(
                'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
                [String(recipientId)]
            );
            return rows;
        }
    },

    async migrate() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id UUID PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT NOT NULL UNIQUE,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                user_agent VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        `);
    }
};

module.exports = PushSubscription;
