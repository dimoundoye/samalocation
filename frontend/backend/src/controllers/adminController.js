const db = require('../config/db');
const response = require('../utils/response');

const adminController = {
    /**
     * Obtenir les statistiques générales
     */
    async getStatistics(req, res, next) {
        try {
            // Total utilisateurs par rôle
            const [roleCounts] = await db.query(`
                SELECT role, COUNT(*) as count 
                FROM user_profiles 
                GROUP BY role
            `);

            // Total propriétés
            const [propertiesCount] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published
                FROM properties
            `);

            const lastUsersCheck = req.query.lastUsersCheck || '1970-01-01';
            const lastPropertiesCheck = req.query.lastPropertiesCheck || '1970-01-01';

            // Nouveaux utilisateurs depuis la dernière vérification (ou 7 derniers jours par défaut pour le calcul initial)
            const [newUsers] = await db.query(`
                SELECT COUNT(*) as count
                FROM user_profiles
                WHERE created_at >= ?
            `, [lastUsersCheck]);

            // Nouvelles propriétés depuis la dernière vérification
            const [newProperties] = await db.query(`
                SELECT COUNT(*) as count
                FROM properties
                WHERE created_at >= ?
            `, [lastPropertiesCheck]);

            // Signalements en attente (toujours basés sur le statut, pas la date)
            const [pendingReports] = await db.query(`
                SELECT COUNT(*) as count
                FROM reports
                WHERE status = 'pending'
            `);

            const owners = roleCounts.find(r => r.role === 'owner')?.count || 0;
            const tenants = roleCounts.find(r => r.role === 'tenant')?.count || 0;

            return response.success(res, {
                totalUsers: owners + tenants,
                owners,
                tenants,
                totalProperties: propertiesCount[0]?.total || 0,
                publishedProperties: propertiesCount[0]?.published || 0,
                newUsersCount: newUsers[0]?.count || 0,
                newPropertiesCount: newProperties[0]?.count || 0,
                pendingReportsCount: pendingReports[0]?.count || 0
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

            const [users] = await db.query(`
                SELECT id, full_name, email, role, created_at
                FROM user_profiles
                ORDER BY created_at DESC
                LIMIT ?
            `, [limit]);

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

            const [growth] = await db.query(`
                SELECT 
                    DATE(created_at) as date,
                    role,
                    COUNT(*) as count
                FROM user_profiles
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at), role
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
            const [globalStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) as unpublished
                FROM properties
            `);

            // Par type
            const [byType] = await db.query(`
                SELECT 
                    property_type,
                    COUNT(*) as count
                FROM properties
                GROUP BY property_type
            `);

            // Propriétés récentes
            const [recent] = await db.query(`
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
            const [properties] = await db.query(`
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
    }
};

module.exports = adminController;
