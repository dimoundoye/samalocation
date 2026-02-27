const db = require('../config/db');
const response = require('../utils/response');

const adminController = {
    /**
     * Obtenir les statistiques générales
     */
    async getStatistics(req, res, next) {
        try {
            // Total utilisateurs par rôle
            const { rows: roleCounts } = await db.query(`
                SELECT role, COUNT(*) as count 
                FROM user_profiles 
                GROUP BY role
            `);

            // Total propriétés
            const { rows: propertiesCount } = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published
                FROM properties
            `);

            const lastUsersCheck = req.query.lastUsersCheck || '1970-01-01';
            const lastPropertiesCheck = req.query.lastPropertiesCheck || '1970-01-01';

            // Nouveaux utilisateurs depuis la dernière vérification (ou 7 derniers jours par défaut pour le calcul initial)
            const { rows: newUsers } = await db.query(`
                SELECT COUNT(*) as count
                FROM user_profiles up
                JOIN users u ON up.id = u.id
                WHERE u.created_at >= $1
            `, [lastUsersCheck]);

            // Nouvelles propriétés depuis la dernière vérification
            const { rows: newProperties } = await db.query(`
                SELECT COUNT(*) as count
                FROM properties
                WHERE created_at >= $1
            `, [lastPropertiesCheck]);

            // Signalements en attente (toujours basés sur le statut, pas la date)
            const { rows: pendingReports } = await db.query(`
                SELECT COUNT(*) as count
                FROM reports
                WHERE status = 'pending'
            `);

            // Vérifications en attente
            const { rows: pendingVerifications } = await db.query(`
                SELECT COUNT(*) as count
                FROM owner_profiles
                WHERE verification_status = 'pending'
            `);

            const owners = parseInt(roleCounts.find(r => r.role === 'owner')?.count || 0);
            const tenants = parseInt(roleCounts.find(r => r.role === 'tenant')?.count || 0);

            return response.success(res, {
                totalUsers: owners + tenants,
                owners,
                tenants,
                totalProperties: parseInt(propertiesCount[0]?.total || 0),
                publishedProperties: parseInt(propertiesCount[0]?.published || 0),
                newUsersCount: parseInt(newUsers[0]?.count || 0),
                newPropertiesCount: parseInt(newProperties[0]?.count || 0),
                pendingReportsCount: parseInt(pendingReports[0]?.count || 0),
                pendingVerificationsCount: parseInt(pendingVerifications[0]?.count || 0)
            });
        } catch (error) {
            console.error('Error getting admin statistics:', error);
            next(error);
        }
    },

    /**
     * Obtenir les derniers utilisateurs enregistrés
     */
    async getRecentUsers(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const since = req.query.since;

            let query = `
                SELECT up.id, up.full_name, up.email, up.role, u.created_at, up.custom_id as customId
                FROM user_profiles up
                JOIN users u ON up.id = u.id
            `;
            const params = [];

            if (since) {
                query += ` WHERE u.created_at >= $1`;
                params.push(since);
            }

            query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1}`;
            params.push(limit);

            const { rows: users } = await db.query(query, params);

            return response.success(res, users);
        } catch (error) {
            console.error('Error getting recent users:', error);
            next(error);
        }
    },

    /**
     * Obtenir les données de croissance des utilisateurs
     */
    async getUserGrowth(req, res, next) {
        try {
            const days = parseInt(req.query.days) || 30;

            const { rows: growth } = await db.query(`
                SELECT 
                    DATE(u.created_at) as date,
                    up.role,
                    COUNT(*) as count
                FROM user_profiles up
                JOIN users u ON up.id = u.id
                WHERE u.created_at >= NOW() - ($1::text || ' days')::INTERVAL
                GROUP BY DATE(u.created_at), up.role
                ORDER BY date ASC
            `, [days]);

            return response.success(res, growth);
        } catch (error) {
            console.error('Error getting user growth:', error);
            next(error);
        }
    },

    /**
     * Obtenir la vue d'ensemble des propriétés
     */
    async getPropertiesOverview(req, res, next) {
        try {
            // Statistiques globales
            const { rows: globalStats } = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) as unpublished
                FROM properties
            `);

            // Par type
            const { rows: byType } = await db.query(`
                SELECT 
                    property_type,
                    COUNT(*) as count
                FROM properties
                GROUP BY property_type
            `);

            // Propriétés récentes
            const { rows: recent } = await db.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.property_type,
                    p.is_published,
                    p.created_at,
                    up.full_name as owner_name
                FROM properties p
                LEFT JOIN user_profiles up ON p.owner_id = up.id
                ORDER BY p.created_at DESC
                LIMIT 5
            `);

            return response.success(res, {
                global: globalStats[0],
                byType,
                recent
            });
        } catch (error) {
            console.error('Error getting properties overview:', error);
            next(error);
        }
    },

    /**
     * Obtenir toutes les propriétés (pour gestion admin)
     */
    async getAllProperties(req, res, next) {
        try {
            const { rows: properties } = await db.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.address,
                    p.property_type,
                    p.is_published,
                    p.created_at,
                    up.full_name as owner_name,
                    up.id as owner_id,
                    (SELECT MIN(monthly_rent) FROM property_units WHERE property_id = p.id) as min_rent,
                    (SELECT COUNT(*) FROM property_units WHERE property_id = p.id) as units_count
                FROM properties p
                LEFT JOIN user_profiles up ON p.owner_id = up.id
                ORDER BY p.created_at DESC
            `);

            return response.success(res, properties);
        } catch (error) {
            console.error('Error getting all properties:', error);
            next(error);
        }
    },

    /**
     * Liste des demandes de vérification en attente
     */
    async getPendingVerifications(req, res, next) {
        try {
            const { rows: verifications } = await db.query(`
                SELECT 
                    op.id,
                    up.full_name,
                    up.email,
                    op.company_name,
                    op.id_card_url,
                    op.verification_status,
                    u.updated_at
                FROM owner_profiles op
                JOIN user_profiles up ON op.id = up.id
                JOIN users u ON op.id = u.id
                WHERE op.verification_status = 'pending'
                ORDER BY u.updated_at ASC
            `);

            return response.success(res, verifications);
        } catch (error) {
            console.error('Error getting pending verifications:', error);
            next(error);
        }
    },

    /**
     * Liste des propriétaires par statut de vérification
     */
    async getVerifications(req, res, next) {
        try {
            const { status } = req.query; // status: 'pending', 'verified', 'rejected'

            let query = `
                SELECT 
                    op.id,
                    up.full_name,
                    up.email,
                    op.company_name,
                    op.id_card_url,
                    op.verification_status,
                    op.is_verified,
                    op.verified_at,
                    u.updated_at
                FROM owner_profiles op
                JOIN user_profiles up ON op.id = up.id
                JOIN users u ON op.id = u.id
            `;

            const params = [];
            if (status) {
                query += ` WHERE op.verification_status = $1`;
                params.push(status);
            }

            query += ` ORDER BY u.updated_at DESC`;

            const { rows: verifications } = await db.query(query, params);

            return response.success(res, verifications);
        } catch (error) {
            console.error('Error getting verifications:', error);
            next(error);
        }
    },

    /**
     * Mettre à jour le statut de vérification d'un propriétaire
     */
    async updateVerificationStatus(req, res, next) {
        try {
            const { ownerId } = req.params;
            const { status, reason } = req.body; // status: 'verified' or 'rejected'

            if (!['verified', 'rejected'].includes(status)) {
                return response.error(res, 'Statut invalide', 400);
            }

            const isVerified = status === 'verified';

            await db.query(`
                UPDATE owner_profiles 
                SET 
                    verification_status = $1, 
                    is_verified = $2, 
                    verified_at = CASE WHEN $3 = 'verified' THEN NOW() ELSE NULL END,
                    updated_at = NOW()
                WHERE id = $4
            `, [status, isVerified, status, ownerId]);

            // Optionnel : Envoyer une notification au propriétaire ici

            return response.success(res, null, `Profil propriétaire ${isVerified ? 'vérifié' : 'rejeté'} avec succès`);
        } catch (error) {
            console.error('Error updating verification status:', error);
            next(error);
        }
    }
};

module.exports = adminController;
