const Notification = require('../models/notificationModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const notificationController = {
    /**
     * Get all notifications for current user
     * Automatically marks them as read
     */
    async getUserNotifications(req, res, next) {
        try {
            const userId = req.ownerId;
            const notifications = await Notification.findByUserId(userId);

            return response.success(res, notifications);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Create a notification (manual)
     */
    async createNotification(req, res, next) {
        try {
            const { user_id, type, title, message, link } = req.body;

            if (!user_id || !title || !message) {
                return response.error(res, 'user_id, title et message sont requis', 400);
            }
            if (String(title).length > 150 || String(message).length > 1000) {
                return response.error(res, 'Notification trop longue', 400);
            }

            // Anti-phishing : uniquement des liens internes à l'application ("/chemin", jamais "//domaine")
            if (link && (typeof link !== 'string' || !link.startsWith('/') || link.startsWith('//') || link.includes('\\'))) {
                return response.error(res, 'Lien invalide', 400);
            }

            const isAdmin = req.user.role === 'admin';
            if (!isAdmin) {
                // Les types système sont réservés à la plateforme (dont les annonces de mise à jour des conditions)
                if (['system', 'admin_alert', 'legal'].includes(type)) {
                    return response.error(res, 'Type de notification non autorisé', 403);
                }

                // Un propriétaire ne peut notifier que les locataires de ses propres biens
                const { rows: allowed } = await db.query(
                    `SELECT 1 FROM tenants t
                     JOIN property_units pu ON t.unit_id = pu.id
                     JOIN properties p ON pu.property_id = p.id
                     WHERE t.user_id = $1 AND (p.owner_id = $2 OR p.owner_id = $3)
                     LIMIT 1`,
                    [user_id, req.ownerId, req.user.id]
                );
                if (allowed.length === 0) {
                    return response.error(res, 'Non autorisé à notifier cet utilisateur', 403);
                }
            }

            const notification = await Notification.create({
                id: uuidv4(),
                user_id,
                type,
                title,
                message,
                link
            });
            return response.success(res, notification, 'Notification created', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const userId = req.ownerId;
            const notificationId = req.params.id;
            await Notification.markAsRead(notificationId, userId);
            return response.success(res, null);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Mark all as read
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.ownerId;
            const { type } = req.body;
            await Notification.markAllAsRead(userId, type);
            return response.success(res, null);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = notificationController;
