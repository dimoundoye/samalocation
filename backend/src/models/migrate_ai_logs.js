const db = require('../config/db');

async function migrate() {
    console.log('Starting AI usage logs migration...');
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

        await db.query(`CREATE INDEX IF NOT EXISTS idx_ai_action ON ai_usage_logs(action);`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_ai_created_at ON ai_usage_logs(created_at);`);

        console.log('Migration successful: ai_usage_logs table created.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
