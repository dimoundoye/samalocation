const Notification = require('../models/notificationModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const notificationController = {
    /**
     * Get all notifications for current user
     * Automatically marks them as read
     */
    async getUserNotifications(req, res, next) {
        try {
            const userId = req.user.id;
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
            const userId = req.user.id;
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
            const userId = req.user.id;
            await Notification.markAllAsRead(userId);
            return response.success(res, null);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = notificationController;
