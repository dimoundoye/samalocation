const db = require('../config/db');

const Withdrawal = {
    async create(data, client = db) {
        const {
            owner_id,
            amount,
            fee,
            net_amount,
            provider,
            recipient_details,
            status = 'pending'
        } = data;

        const { rows } = await client.query(
            `INSERT INTO withdrawals 
            (owner_id, amount, fee, net_amount, provider, recipient_details, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [owner_id, amount, fee, net_amount, provider, recipient_details, status]
        );

        return rows[0];
    },

    async updateStatus(id, status, details = {}, client = db) {
        const { transaction_id = null, error_message = null } = details;
        const { rows } = await client.query(
            `UPDATE withdrawals 
            SET status = $1, transaction_id = $2, error_message = $3, updated_at = NOW() 
            WHERE id = $4 
            RETURNING *`,
            [status, transaction_id, error_message, id]
        );
        return rows[0];
    },

    async findById(id) {
        const { rows } = await db.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async findByOwnerId(ownerId) {
        const { rows } = await db.query(
            'SELECT * FROM withdrawals WHERE owner_id = $1 ORDER BY created_at DESC',
            [ownerId]
        );
        return rows;
    },

    async findAll() {
        const { rows } = await db.query(
            `SELECT w.*, up.full_name as owner_name, up.email as owner_email 
            FROM withdrawals w
            JOIN user_profiles up ON w.owner_id = up.id
            ORDER BY w.created_at DESC`
        );
        return rows;
    },

    async getPending() {
        const { rows } = await db.query("SELECT * FROM withdrawals WHERE status = 'pending'");
        return rows;
    }
};

module.exports = Withdrawal;
