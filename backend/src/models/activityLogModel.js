const db = require('../config/db');

const ActivityLog = {
    /**
     * Créer une entrée dans le journal d'activité
     */
    async create({ agencyId, actorId, actorName, actorRole = 'owner', action, entityType, entityId, entityLabel, metadata = {} }) {
        try {
            await db.query(`
                INSERT INTO activity_logs (agency_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [agencyId, actorId, actorName, actorRole, action, entityType, entityId || null, entityLabel, JSON.stringify(metadata)]);
        } catch (err) {
            console.error('[ActivityLog] Erreur lors de l\'enregistrement:', err.message);
        }
    },

    /**
     * Récupérer le journal d'activité d'une agence avec pagination et filtres
     */
    async findByAgencyId(agencyId, { limit = 50, offset = 0, actorId = null, entityType = null, action = null } = {}) {
        const conditions = ['agency_id = $1'];
        const params = [agencyId];
        let idx = 2;

        if (actorId) {
            conditions.push(`actor_id = $${idx++}`);
            params.push(actorId);
        }
        if (entityType) {
            if (entityType === 'tenant') {
                conditions.push(`entity_type IN ('tenant', 'receipt')`);
            } else {
                conditions.push(`entity_type = $${idx++}`);
                params.push(entityType);
            }
        }
        if (action) {
            conditions.push(`action = $${idx++}`);
            params.push(action);
        }

        const where = conditions.join(' AND ');
        params.push(limit, offset);

        const { rows } = await db.query(`
            SELECT * FROM activity_logs
            WHERE ${where}
            ORDER BY created_at DESC
            LIMIT $${idx++} OFFSET $${idx++}
        `, params);

        const countParams = params.slice(0, params.length - 2);
        const { rows: countRows } = await db.query(
            `SELECT COUNT(*) FROM activity_logs WHERE ${where}`,
            countParams
        );

        return {
            logs: rows,
            total: parseInt(countRows[0].count)
        };
    },

    /**
     * Supprimer les entrées de plus de 12 mois (nettoyage automatique)
     */
    async cleanup(agencyId) {
        await db.query(
            `DELETE FROM activity_logs WHERE agency_id = $1 AND created_at < NOW() - INTERVAL '12 months'`,
            [agencyId]
        );
    },

    /**
     * Exécuter la migration pour créer la table activity_logs et ses index si nécessaire
     */
    async migrate() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agency_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                actor_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                actor_name VARCHAR(255) NOT NULL DEFAULT 'Inconnu',
                actor_role VARCHAR(20) NOT NULL DEFAULT 'owner',
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(255),
                entity_label TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`,
            `CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON activity_logs(agency_id);`,
            `CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);`,
            `CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);`,
            `CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);`
        ];

        for (const query of queries) {
            try {
                await db.query(query);
            } catch (err) {
                console.error('[ActivityLog] Migration error:', err.message);
            }
        }
        return true;
    }
};

module.exports = ActivityLog;
