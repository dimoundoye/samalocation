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

            // Paiements en attente
            const { rows: pendingPayments } = await db.query(`
                SELECT COUNT(*) as count
                FROM subscriptions
                WHERE status = 'pending'
            `);

            // Statistiques d'abonnements (par plan)
            const { rows: subStats } = await db.query(`
                SELECT 
                    plan_name, 
                    COUNT(*) as count, 
                    SUM(price) as revenue
                FROM subscriptions
                WHERE status = 'active'
                GROUP BY plan_name
            `);

            // Revenu total (historique des paiements validés)
            const { rows: totalRevenue } = await db.query(`
                SELECT SUM(price) as total FROM subscriptions WHERE status IN ('active', 'expired')
            `);

            // Revenu du mois en cours (paiements effectués ce mois-ci)
            const { rows: currentMonthRevenue } = await db.query(`
                SELECT SUM(price) as total FROM subscriptions 
                WHERE status IN ('active', 'expired')
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
            `);

            // Statistiques IA
            const AIUsage = require('../models/aiUsageModel');
            const aiStats = await AIUsage.getStats();

            const owners = parseInt(roleCounts.find(r => r.role === 'owner')?.count || 0);
            const tenants = parseInt(roleCounts.find(r => r.role === 'tenant')?.count || 0);

            // Mapper les stats par plan (Premium, Professionnel)
            const subscriptions = {
                premium: subStats.find(s => s.plan_name.toLowerCase() === 'premium')?.count || 0,
                professionnel: subStats.find(s => s.plan_name.toLowerCase() === 'professionnel')?.count || 0,
                free: owners - (subStats.reduce((acc, s) => acc + parseInt(s.count), 0))
            };

            return response.success(res, {
                totalUsers: owners + tenants,
                owners,
                tenants,
                totalProperties: parseInt(propertiesCount[0]?.total || 0),
                publishedProperties: parseInt(propertiesCount[0]?.published || 0),
                newUsersCount: parseInt(newUsers[0]?.count || 0),
                newPropertiesCount: parseInt(newProperties[0]?.count || 0),
                pendingReportsCount: parseInt(pendingReports[0]?.count || 0),
                pendingVerificationsCount: parseInt(pendingVerifications[0]?.count || 0),
                pendingPaymentsCount: parseInt(pendingPayments[0]?.count || 0),
                subscriptions,
                revenue: {
                    active: parseFloat(currentMonthRevenue[0]?.total || 0),
                    total: parseFloat(totalRevenue[0]?.total || 0)
                },
                aiUsage: aiStats.map(s => ({
                    action: s.action,
                    count: parseInt(s.count),
                    last_used: s.last_used
                }))
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
                    p.description,
                    p.property_type,
                    p.is_published,
                    p.photo_url,
                    p.photos,
                    p.latitude,
                    p.longitude,
                    p.equipments,
                    p.created_at,
                    up.full_name as owner_name,
                    up.id as owner_id,
                    (SELECT SUM(bedrooms) FROM property_units WHERE property_id = p.id) as bedrooms,
                    (SELECT SUM(bathrooms) FROM property_units WHERE property_id = p.id) as bathrooms,
                    (SELECT SUM(area_sqm) FROM property_units WHERE property_id = p.id) as area_sqm,
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
    },

    /**
     * Obtenir les statistiques de revenus basées sur les reçus
     */
    async getRevenueStats(req, res, next) {
        try {
            // --- VOLUME DES REÇUS (Mouvements de loyers sur la plateforme) ---
            
            // Statistiques par jour (30 derniers jours)
            const { rows: daily } = await db.query(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(amount) as total
                FROM receipts
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            // Statistiques par mois (12 derniers mois)
            const { rows: monthly } = await db.query(`
                SELECT 
                    DATE_TRUNC('month', created_at) as date,
                    SUM(amount) as total
                FROM receipts
                WHERE created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY date ASC
            `);

            // Statistiques par année
            const { rows: yearly } = await db.query(`
                SELECT 
                    EXTRACT(YEAR FROM created_at)::text as date,
                    SUM(amount) as total
                FROM receipts
                GROUP BY EXTRACT(YEAR FROM created_at)
                ORDER BY date ASC
            `);

            // --- REVENUS ADMIN (Abonnements payés) ---

            // Revenu admin mensuel (12 derniers mois)
            const { rows: adminMonthly } = await db.query(`
                SELECT 
                    DATE_TRUNC('month', created_at) as date,
                    SUM(price) as total
                FROM subscriptions
                WHERE status IN ('active', 'expired') AND price > 0
                AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY date ASC
            `);

            // Revenu admin annuel
            const { rows: adminYearly } = await db.query(`
                SELECT 
                    EXTRACT(YEAR FROM created_at)::text as date,
                    SUM(price) as total
                FROM subscriptions
                WHERE status IN ('active', 'expired') AND price > 0
                GROUP BY EXTRACT(YEAR FROM created_at)
                ORDER BY date ASC
            `);

            return response.success(res, {
                daily,
                monthly,
                yearly,
                adminMonthly,
                adminYearly
            });
        } catch (error) {
            console.error('Error getting revenue stats:', error);
            next(error);
        }
    },

    /**
     * Mettre à jour manuelle de l'abonnement d'un utilisateur
     */
    async updateUserSubscription(req, res, next) {
        try {
            const { userId } = req.params;
            const { planName, status, durationDays, price, subscriptionId, reason } = req.body;
            const Subscription = require('../models/subscriptionModel');
            const Notification = require('../models/notificationModel');

            const result = await Subscription.manualUpdate(userId, {
                planName,
                status,
                durationDays,
                price,
                subscriptionId,
                reason
            });

            // Envoyer une notification à l'utilisateur
            let title = 'Abonnement mis à jour';
            let message = `Votre abonnement a été mis à jour par l'administrateur.`;

            if (status === 'active') {
                title = 'Abonnement activé !';
                message = `L'administrateur a validé votre paiement. Vous profitez désormais du plan ${planName || 'Premium'} pour ${durationDays || 30} jours.`;
            } else if (status === 'rejected') {
                title = 'Demande d\'abonnement refusée';
                message = reason 
                    ? `Votre demande pour le plan ${planName || 'Premium'} a été refusée pour la raison suivante : ${reason}`
                    : `Votre demande pour le plan ${planName || 'Premium'} n'a pas pu être validée. Veuillez vérifier vos informations de paiement ou contacter le support.`;
            }

            await Notification.create({
                id: require('uuid').v4(),
                user_id: userId,
                type: 'system',
                title: title,
                message: message,
                link: '/owner-dashboard?tab=subscription'
            });

            return response.success(res, result, 'Abonnement mis à jour avec succès');
        } catch (error) {
            console.error('Error updating user subscription:', error);
            next(error);
        }
    },

    /**
     * Obtenir les dernières transactions (abonnements)
     */
    async getRecentTransactions(req, res, next) {
        try {
            const Subscription = require('../models/subscriptionModel');
            const limit = parseInt(req.query.limit) || 20;
            const transactions = await Subscription.findRecentTransactions(limit);
            return response.success(res, transactions);
        } catch (error) {
            console.error('Error getting recent transactions:', error);
            next(error);
        }
    },
    /**
     * Obtenir les événements récents (activités)
     */
    async getEvents(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;

            // On récupère plusieurs types d'événements et on les fusionne
            const [users, properties, reports, transactions] = await Promise.all([
                db.query(`
                    SELECT 'user' as type, full_name as title, role as detail, u.created_at
                    FROM user_profiles up 
                    JOIN users u ON up.id = u.id 
                    ORDER BY u.created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'property' as type, name as title, property_type as detail, created_at
                    FROM properties 
                    ORDER BY created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'report' as type, reason as title, status as detail, created_at
                    FROM reports 
                    ORDER BY created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'payment' as type, plan_name as title, price as detail, created_at
                    FROM subscriptions 
                    ORDER BY created_at DESC LIMIT 10
                `)
            ]);

            const events = [
                ...users.rows.map(r => ({ ...r, title: `Nouvel utilisateur: ${r.title}`, detail: r.detail === 'owner' ? 'Propriétaire' : 'Locataire' })),
                ...properties.rows.map(r => ({ ...r, title: `Nouveau bien: ${r.title}`, detail: r.detail })),
                ...reports.rows.map(r => ({ ...r, title: `Signalement: ${r.title}`, detail: r.detail === 'pending' ? 'En attente' : 'Traité' })),
                ...transactions.rows.map(r => ({ ...r, title: `Nouveau paiement: ${r.title}`, detail: `${r.detail} F CFA` }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);

            return response.success(res, events);
        } catch (error) {
            console.error('Error getting admin events:', error);
            next(error);
        }
    },
    /**
     * Obtenir les statistiques de fréquentation en direct
     */
    async getLiveAnalytics(req, res, next) {
        try {
            const Analytics = require('../models/analyticsModel');
            const stats = await Analytics.getVisitStats();
            return response.success(res, stats);
        } catch (error) {
            console.error('Error getting live analytics:', error);
            next(error);
        }
    },
    /**
     * Obtenir tous les paramètres de la plateforme
     */
    async getPlatformSettings(req, res, next) {
        try {
            const PlatformSettings = require('../models/settingsModel');
            const settings = await PlatformSettings.getAll();
            return response.success(res, settings);
        } catch (error) {
            console.error('Error getting platform settings:', error);
            next(error);
        }
    },
    /**
     * Mettre à jour un paramètre spécifique
     */
    async updatePlatformSettings(req, res, next) {
        try {
            const { key, value } = req.body;
            if (!key) return response.error(res, "La clé du paramètre est requise.", 400);

            const PlatformSettings = require('../models/settingsModel');
            const result = await PlatformSettings.update(key, value);
            return response.success(res, result, 'Paramètre mis à jour avec succès');
        } catch (error) {
            console.error('Error updating platform setting:', error);
            next(error);
        }
    }
};

module.exports = adminController;
