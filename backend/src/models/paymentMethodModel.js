const db = require('../config/db');

/**
 * Coordonnées où les locataires paient directement le loyer au propriétaire.
 */
const PaymentMethod = {
    async getMethods(ownerId) {
        const { rows } = await db.query(
            'SELECT methods, updated_at FROM owner_payment_methods WHERE owner_id = $1',
            [ownerId]
        );
        return rows[0] ? { methods: rows[0].methods || [], updated_at: rows[0].updated_at } : { methods: [], updated_at: null };
    },

    async saveMethods(ownerId, methods, updatedBy) {
        const { rows } = await db.query(
            `INSERT INTO owner_payment_methods (owner_id, methods, updated_at, updated_by)
             VALUES ($1, $2, NOW(), $3)
             ON CONFLICT (owner_id) DO UPDATE SET methods = EXCLUDED.methods, updated_at = NOW(), updated_by = EXCLUDED.updated_by
             RETURNING methods, updated_at`,
            [ownerId, JSON.stringify(methods), updatedBy]
        );
        return rows[0];
    },

    /** Comptes des locataires ayant un bail actif chez ce propriétaire. */
    async findActiveTenantUserIds(ownerId) {
        const { rows } = await db.query(
            `SELECT DISTINCT t.user_id
             FROM tenants t
             JOIN property_units pu ON t.unit_id = pu.id
             JOIN properties p ON pu.property_id = p.id
             WHERE p.owner_id = $1 AND t.status = 'active' AND t.user_id IS NOT NULL`,
            [ownerId]
        );
        return rows.map(r => r.user_id);
    }
};

module.exports = PaymentMethod;
