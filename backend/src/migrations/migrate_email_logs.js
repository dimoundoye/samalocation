const db = require('../config/db');

async function migrateEmailLogs() {
    try {
        console.log('--- Migration: Table email_campaign_logs ---');
        await db.query(`
            CREATE TABLE IF NOT EXISTS email_campaign_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                template_id VARCHAR(100) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                target_audience VARCHAR(50) NOT NULL,
                recipient_count INTEGER DEFAULT 1,
                recipient_emails TEXT,
                sent_by VARCHAR(100),
                status VARCHAR(50) DEFAULT 'sent',
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_created_at ON email_campaign_logs(created_at DESC);
        `);
        console.log('✅ Table email_campaign_logs créée ou déjà existante avec succès.');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la migration email_campaign_logs:', error.message);
        return false;
    }
}

if (require.main === module) {
    migrateEmailLogs().then(() => process.exit(0));
}

module.exports = migrateEmailLogs;
