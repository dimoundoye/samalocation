const db = require('../config/db');

async function migrate() {
    console.log('Starting team invitations migration...');
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS team_invitations (
                id UUID PRIMARY KEY,
                inviter_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                invitee_email VARCHAR(255) NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                permissions JSONB DEFAULT '{"can_view_revenue": false}',
                status VARCHAR(50) DEFAULT 'pending', 
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
            );
        `);

        console.log('Migration successful: team_invitations table created.');
    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    }
}

migrate();
