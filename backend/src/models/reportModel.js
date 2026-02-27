const db = require('../config/db');

const Report = {
    async create(reportData) {
        const { id, reporter_id, reported_id, reason } = reportData;

        await db.query(
            'INSERT INTO reports (id, reporter_id, reported_id, reason, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [id, reporter_id, reported_id, reason, 'pending']
        );

        return { id, reporter_id, reported_id, reason, status: 'pending' };
    },

    async findAll(filters = {}) {
        // PostgreSQL: pas besoin de COLLATE, les comparaisons de texte sont directes
        let query = `
            SELECT 
                r.*,
                reporter.full_name as reporter_name,
                reporter.email as reporter_email,
                reported.full_name as reported_name,
                reported.email as reported_email,
                reported_user.is_blocked as reported_is_blocked
            FROM reports r
            LEFT JOIN user_profiles reporter ON r.reporter_id = reporter.id
            LEFT JOIN user_profiles reported ON r.reported_id = reported.id
            LEFT JOIN users reported_user ON r.reported_id = reported_user.id
        `;

        const params = [];
        const conditions = [];
        let idx = 1;

        if (filters.status) {
            conditions.push(`r.status = $${idx++}`);
            params.push(filters.status);
        }

        if (filters.reported_id) {
            conditions.push(`r.reported_id = $${idx++}`);
            params.push(filters.reported_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY r.created_at DESC';

        const { rows: reports } = await db.query(query, params);
        return reports;
    },

    async findByReportedId(reported_id) {
        const { rows: reports } = await db.query(
            `SELECT r.*, 
                    reporter.full_name as reporter_name,
                    reporter.email as reporter_email
             FROM reports r
             LEFT JOIN user_profiles reporter ON r.reporter_id = reporter.id
             WHERE r.reported_id = $1
             ORDER BY r.created_at DESC`,
            [reported_id]
        );
        return reports;
    },

    async updateStatus(id, status, admin_notes = null) {
        await db.query(
            'UPDATE reports SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3',
            [status, admin_notes, id]
        );
        return true;
    },

    async getStatistics() {
        const { rows: totalResult } = await db.query('SELECT COUNT(*) as total FROM reports');
        const { rows: pendingResult } = await db.query("SELECT COUNT(*) as pending FROM reports WHERE status = 'pending'");

        const { rows: topReported } = await db.query(`
            SELECT 
                r.reported_id,
                MAX(up.full_name) as full_name,
                MAX(up.email) as email,
                COUNT(*) as report_count,
                BOOL_OR(u.is_blocked) as is_blocked
            FROM reports r
            LEFT JOIN user_profiles up ON r.reported_id = up.id
            LEFT JOIN users u ON r.reported_id = u.id
            GROUP BY r.reported_id
            ORDER BY report_count DESC
            LIMIT 3
        `);

        const { rows: statusDistribution } = await db.query(`
            SELECT status, COUNT(*) as count
            FROM reports
            GROUP BY status
        `);

        return {
            total: parseInt(totalResult[0].total),
            pending: parseInt(pendingResult[0].pending),
            topReported,
            statusDistribution
        };
    }
};

module.exports = Report;
