const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AIUsage = {
    async log(data) {
        const { user_id, action, model = 'gemini-1.5-pro', prompt_tokens = 0, completion_tokens = 0 } = data;
        const id = uuidv4();
        await db.query(
            'INSERT INTO ai_usage_logs (id, user_id, action, model, prompt_tokens, completion_tokens) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, user_id, action, model, prompt_tokens, completion_tokens]
        );
        return id;
    },

    async getStats() {
        const { rows } = await db.query(`
            SELECT 
                action, 
                COUNT(*) as count,
                MAX(created_at) as last_used
            FROM ai_usage_logs
            GROUP BY action
        `);
        return rows;
    },

    async getDailyUsage(days = 7) {
        const { rows } = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM ai_usage_logs
            WHERE created_at > NOW() - INTERVAL '1 day' * $1
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);
        return rows;
    }
};

module.exports = AIUsage;
