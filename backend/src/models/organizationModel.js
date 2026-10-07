const db = require('../config/db');

// Code Postgres "relation does not exist" : la migration create_organizations n'a pas encore été lancée
const UNDEFINED_TABLE = '42P01';

/**
 * Tolère l'absence des tables (code déployé avant la migration) sans masquer les autres erreurs.
 * À retirer une fois la migration passée en production.
 */
async function tolerateMissingTables(fn) {
    try {
        return await fn();
    } catch (err) {
        if (err.code === UNDEFINED_TABLE) {
            console.warn('[ORG] Tables organisations absentes, synchronisation ignorée. Lancer migrations/create_organizations.sql');
            return null;
        }
        throw err;
    }
}

const Organization = {
    /**
     * Rôle d'organisation correspondant aux anciennes permissions de collaborateur (users.permissions)
     */
    roleFromLegacyPermissions(permissions) {
        const perms = typeof permissions === 'string' ? JSON.parse(permissions) : (permissions || {});
        return perms.can_view_revenue ? 'manager' : 'agent';
    },

    /**
     * Crée l'organisation principale d'un propriétaire ou d'une agence (même id que l'utilisateur)
     * et son adhésion 'owner'.
     */
    async ensurePersonalOrg(userId, { name, currency = 'XOF', type = 'individual' } = {}) {
        return tolerateMissingTables(async () => {
            await db.query(
                `INSERT INTO organizations (id, name, type, currency, created_by)
                 VALUES ($1, $2, $3, $4, $1)
                 ON CONFLICT (id) DO NOTHING`,
                [userId, name || 'Mon espace', type, currency]
            );
            await this.upsertMembership(userId, userId, 'owner');
        });
    },

    /**
     * Ajoute ou réactive une adhésion.
     */
    async upsertMembership(userId, organizationId, role, { invitedBy = null } = {}) {
        return tolerateMissingTables(() => db.query(
            `INSERT INTO memberships (user_id, organization_id, role, status, invited_by)
             VALUES ($1, $2, $3, 'active', $4)
             ON CONFLICT (user_id, organization_id)
             DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now()`,
            [userId, organizationId, role, invitedBy]
        ));
    },

    async updateMembershipRole(userId, organizationId, role) {
        return tolerateMissingTables(() => db.query(
            `UPDATE memberships SET role = $3, updated_at = now()
             WHERE user_id = $1 AND organization_id = $2 AND role <> 'owner'`,
            [userId, organizationId, role]
        ));
    },

    async revokeMembership(userId, organizationId) {
        return tolerateMissingTables(() => db.query(
            `UPDATE memberships SET status = 'revoked', updated_at = now()
             WHERE user_id = $1 AND organization_id = $2 AND role <> 'owner'`,
            [userId, organizationId]
        ));
    },

    /**
     * Organisations actives d'un utilisateur, avec son rôle et ses permissions dans chacune.
     */
    async findForUser(userId) {
        const { rows } = await db.query(
            `SELECT o.id, o.name, o.type, o.country, o.currency, m.role,
                    COALESCE(array_agg(rp.permission) FILTER (WHERE rp.permission IS NOT NULL), '{}') AS permissions
             FROM memberships m
             JOIN organizations o ON o.id = m.organization_id
             LEFT JOIN role_permissions rp ON rp.role = m.role
             WHERE m.user_id = $1 AND m.status = 'active'
             GROUP BY o.id, m.role
             ORDER BY (m.role = 'owner') DESC, o.name`,
            [userId]
        );
        return rows;
    }
};

module.exports = Organization;
