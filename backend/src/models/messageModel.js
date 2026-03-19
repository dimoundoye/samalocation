const db = require('../config/db');

const Message = {
    async findByUserId(userId) {
        const { rows } = await db.query(`
            SELECT m.*, 
                   up_sender.full_name as sender_name, up_sender.email as sender_email,
                   up_receiver.full_name as receiver_name, up_receiver.email as receiver_email
            FROM messages m
            LEFT JOIN user_profiles up_sender ON m.sender_id = up_sender.id
            LEFT JOIN user_profiles up_receiver ON m.receiver_id = up_receiver.id
            WHERE m.sender_id = $1 OR m.receiver_id = $2
            ORDER BY m.created_at ASC
        `, [userId, userId]);
        return rows;
    },

    async create(data) {
        const { id, sender_id, receiver_id, message, property_id } = data;
        await db.query(
            'INSERT INTO messages (id, sender_id, receiver_id, message, property_id) VALUES ($1, $2, $3, $4, $5)',
            [id, sender_id, receiver_id, message, property_id]
        );
        
        // On récupère le message complet avec les noms pour le temps réel
        const { rows } = await db.query(`
            SELECT m.*, 
                   up_sender.full_name as sender_name, up_sender.email as sender_email,
                   up_receiver.full_name as receiver_name, up_receiver.email as receiver_email
            FROM messages m
            LEFT JOIN user_profiles up_sender ON m.sender_id = up_sender.id
            LEFT JOIN user_profiles up_receiver ON m.receiver_id = up_receiver.id
            WHERE m.id = $1
        `, [id]);
        
        return rows[0];
    },

    async markAsRead(messageIds, userId) {
        console.log(`[MessageModel] Marking ${messageIds.length} messages as read for user ${userId}`);
        const result = await db.query(
            'UPDATE messages SET is_read = true WHERE id = ANY($1) AND receiver_id = $2',
            [messageIds, userId]
        );
        console.log(`[MessageModel] Updated ${result.rowCount} messages`);
        return true;
    },

    async delete(messageId, userId) {
        const { rows: messages } = await db.query(
            'SELECT id FROM messages WHERE id = $1 AND sender_id = $2',
            [messageId, userId]
        );

        if (messages.length === 0) return false;

        await db.query('DELETE FROM messages WHERE id = $1', [messageId]);
        return true;
    }
};

module.exports = Message;
