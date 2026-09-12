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

    async getStats(filter = {}) {
        const { period, year, month } = filter;
        let whereClause = '';
        const params = [];

        if (period === 'month' && year && month) {
            whereClause = `WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2`;
            params.push(year, month);
        } else if (period === 'month' && year) {
            whereClause = `WHERE EXTRACT(YEAR FROM created_at) = $1`;
            params.push(year);
        } else if (period === 'year' && year) {
            whereClause = `WHERE EXTRACT(YEAR FROM created_at) = $1`;
            params.push(year);
        }

        const query = `
            SELECT 
                action, 
                COUNT(*)::int as count,
                COALESCE(SUM(prompt_tokens + completion_tokens), 0)::int as total_tokens,
                MAX(created_at) as last_used
            FROM ai_usage_logs
            ${whereClause}
            GROUP BY action
        `;
        const { rows } = await db.query(query, params);
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
    },

    async migrate() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS ai_usage_logs (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36),
                    action VARCHAR(50) NOT NULL,
                    model VARCHAR(50) DEFAULT 'gemini-1.5-pro',
                    prompt_tokens INT DEFAULT 0,
                    completion_tokens INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await db.query('CREATE INDEX IF NOT EXISTS idx_ai_action ON ai_usage_logs(action);');
            await db.query('CREATE INDEX IF NOT EXISTS idx_ai_created_at ON ai_usage_logs(created_at);');
            return true;
        } catch (err) {
            console.error('Migration error (ai_usage_logs):', err.message);
            return false;
        }
    }
};

module.exports = AIUsage;
