const db = require('../config/db');

const Report = {
    /**
     * Créer un nouveau signalement
     */
    async create(reportData) {
        const { id, reporter_id, reported_id, reason } = reportData;

        await db.query(
            'INSERT INTO reports (id, reporter_id, reported_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [id, reporter_id, reported_id, reason, 'pending']
        );

        return { id, reporter_id, reported_id, reason, status: 'pending' };
    },

    /**
     * Récupérer tous les signalements (pour admin)
     */
    async findAll(filters = {}) {
        let query = `
            SELECT 
                r.*,
                reporter.full_name as reporter_name,
                reporter.email as reporter_email,
                reported.full_name as reported_name,
                reported.email as reported_email,
                reported_user.is_blocked as reported_is_blocked
            FROM reports r
            LEFT JOIN user_profiles reporter ON r.reporter_id COLLATE utf8mb4_unicode_ci = reporter.id COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profiles reported ON r.reported_id COLLATE utf8mb4_unicode_ci = reported.id COLLATE utf8mb4_unicode_ci
            LEFT JOIN users reported_user ON r.reported_id COLLATE utf8mb4_unicode_ci = reported_user.id COLLATE utf8mb4_unicode_ci
        `;

        const params = [];
        const conditions = [];

        if (filters.status) {
            conditions.push('r.status = ?');
            params.push(filters.status);
        }

        if (filters.reported_id) {
            conditions.push('r.reported_id = ?');
            params.push(filters.reported_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY r.created_at DESC';

        const [reports] = await db.query(query, params);
        return reports;
    },

    /**
     * Récupérer les signalements d'un utilisateur spécifique
     */
    async findByReportedId(reported_id) {
        const [reports] = await db.query(
            `SELECT r.*, 
                    reporter.full_name as reporter_name,
                    reporter.email as reporter_email
             FROM reports r
             LEFT JOIN user_profiles reporter ON r.reporter_id COLLATE utf8mb4_unicode_ci = reporter.id COLLATE utf8mb4_unicode_ci
             WHERE r.reported_id = ?
             ORDER BY r.created_at DESC`,
            [reported_id]
        );
        return reports;
    },

    /**
     * Mettre à jour le statut d'un signalement
     */
    async updateStatus(id, status, admin_notes = null) {
        await db.query(
            'UPDATE reports SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
            [status, admin_notes, id]
        );
        return true;
    },

    /**
     * Obtenir les statistiques des signalements
     */
    async getStatistics() {
        // Total de signalements
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM reports');

        // Signalements en attente
        const [pendingResult] = await db.query('SELECT COUNT(*) as pending FROM reports WHERE status = ?', ['pending']);

        // Top 3 des propriétaires les plus signalés
        const [topReported] = await db.query(`
            SELECT 
                r.reported_id,
                MAX(up.full_name) as full_name,
                MAX(up.email) as email,
                COUNT(*) as report_count,
                MAX(u.is_blocked) as is_blocked
            FROM reports r
            LEFT JOIN user_profiles up ON r.reported_id COLLATE utf8mb4_unicode_ci = up.id COLLATE utf8mb4_unicode_ci
            LEFT JOIN users u ON r.reported_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
            GROUP BY r.reported_id
            ORDER BY report_count DESC
            LIMIT 3
        `);

        // Répartition par statut
        const [statusDistribution] = await db.query(`
            SELECT status, COUNT(*) as count
            FROM reports
            GROUP BY status
        `);

        return {
            total: totalResult[0].total,
            pending: pendingResult[0].pending,
            topReported: topReported,
            statusDistribution: statusDistribution
        };
    }
};

module.exports = Report;
