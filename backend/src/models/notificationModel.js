const db = require('../config/db');

const Notification = {
    /**
     * Get all notifications for a user
     */
    async findByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    /**
     * Create a notification
     */
    async create(data) {
        const { id, user_id, type, title, message, link } = data;
        await db.query(
            'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
            [id, user_id, type, title, message, link]
        );
        return { id, user_id, type, title, message, link };
    },

    /**
     * Mark notification as read
     */
    async markAsRead(id, userId) {
        await db.query(
            'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return true;
    },

    /**
     * Mark all as read
     */
    async markAllAsRead(userId, type = null) {
        let query = 'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false';
        let params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        await db.query(query, params);
        return true;
    }
};

module.exports = Notification;
