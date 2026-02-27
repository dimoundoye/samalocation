const db = require('../config/db');

const Notification = {
    async findByUserId(userId) {
        const { rows } = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    async create(data) {
        const { id, user_id, type, title, message, link } = data;
        await db.query(
            'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, user_id, type, title, message, link]
        );
        return { id, user_id, type, title, message, link };
    },

    async markAsRead(id, userId) {
        await db.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return true;
    },

    async markAllAsRead(userId, type = null) {
        let query = 'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false';
        let params = [userId];

        if (type) {
            query += ' AND type = $2';
            params.push(type);
        }

        await db.query(query, params);
        return true;
    }
};

module.exports = Notification;
