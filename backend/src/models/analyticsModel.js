const db = require('../config/db');

const Analytics = {
    /**
     * Récupère les statistiques de visite (Hébergé sur site_visits)
     */
    async getVisitStats() {
        // Visiteurs du jour (dernières 24h)
        const { rows: daily } = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_bot = true THEN 1 ELSE 0 END) as bots,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        `);

        // Utilisateurs actuellement en ligne (actifs les 5 dernières minutes)
        const { rows: online } = await db.query(`
            SELECT COUNT(DISTINCT ip_address) as count
            FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '5 minutes'
            AND is_bot = false
        `);

        // Visiteurs du mois (30 derniers jours)
        const { rows: monthly } = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_bot = true THEN 1 ELSE 0 END) as bots,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);

        // Visiteurs de l'année
        const { rows: yearly } = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_bot = true THEN 1 ELSE 0 END) as bots,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '1 year'
        `);

        // Croissance journalière pour le graphique (30 derniers jours)
        const { rows: growth } = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(DISTINCT ip_address) as unique_visitors,
                SUM(CASE WHEN is_bot = true THEN 1 ELSE 0 END) as bots
            FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);

        // Top des robots identifiés
        const { rows: topBots } = await db.query(`
            SELECT user_agent, COUNT(*) as count
            FROM site_visits
            WHERE is_bot = true
            GROUP BY user_agent
            ORDER BY count DESC
            LIMIT 10
        `);

        return {
            online_now: parseInt(online[0].count),
            daily: daily[0],
            monthly: monthly[0],
            yearly: yearly[0],
            growth,
            topBots
        };
    }
};

module.exports = Analytics;
