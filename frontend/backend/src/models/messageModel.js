const db = require('../config/db');

const Message = {
    /**
     * Get all messages for a user
     */
    async findByUserId(userId) {
        const [rows] = await db.query(`
            SELECT m.*, 
                   up_sender.full_name as sender_name, up_sender.email as sender_email,
                   up_receiver.full_name as receiver_name, up_receiver.email as receiver_email
            FROM messages m
            LEFT JOIN user_profiles up_sender ON m.sender_id = up_sender.id
            LEFT JOIN user_profiles up_receiver ON m.receiver_id = up_receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ? 
            ORDER BY m.created_at ASC
        `, [userId, userId]);
        return rows;
    },

    /**
     * Send a message
     */
    async create(data) {
        const { id, sender_id, receiver_id, message, property_id } = data;
        await db.query(
            'INSERT INTO messages (id, sender_id, receiver_id, message, property_id) VALUES (?, ?, ?, ?, ?)',
            [id, sender_id, receiver_id, message, property_id]
        );
        return { id, sender_id, receiver_id, message, property_id };
    },

    /**
     * Mark messages as read
     */
    async markAsRead(messageIds, userId) {
        console.log(`[MessageModel] Marking ${messageIds.length} messages as read for user ${userId}`);
        const [result] = await db.query(
            'UPDATE messages SET is_read = true WHERE id IN (?) AND receiver_id = ?',
            [messageIds, userId]
        );
        console.log(`[MessageModel] Updated ${result.affectedRows} messages`);
        return true;
    },

    /**
     * Delete a message (only sender can delete their own messages)
     */
    async delete(messageId, userId) {
        // Verify that user is the sender
        const [messages] = await db.query(
            'SELECT id FROM messages WHERE id = ? AND sender_id = ?',
            [messageId, userId]
        );

        if (messages.length === 0) {
            return false; // Not authorized or message doesn't exist
        }

        await db.query('DELETE FROM messages WHERE id = ?', [messageId]);
        return true;
    },

    /**
     * Delete messages older than X months
     */
    async deleteOldMessages(months) {
        console.log(`[MessageModel] Deleting messages older than ${months} months...`);
        const [result] = await db.query(
            'DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)',
            [months]
        );
        console.log(`[MessageModel] Successfully deleted ${result.affectedRows} old messages`);
        return result.affectedRows;
    }
};

module.exports = Message;
