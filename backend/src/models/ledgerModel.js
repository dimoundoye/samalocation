const db = require('../config/db');

const Ledger = {
    async create(data, client = db) {
        const {
            owner_id,
            type,
            amount,
            fee = 0.00,
            net_amount,
            platform_surplus = 0.00,
            status = 'completed',
            description = null,
            reference_id = null
        } = data;

        const { rows } = await client.query(
            `INSERT INTO ledger_transactions 
            (owner_id, type, amount, fee, net_amount, platform_surplus, status, description, reference_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [owner_id, type, amount, fee, net_amount, platform_surplus, status, description, reference_id]
        );

        return rows[0];
    },

    async findByOwnerId(ownerId) {
        const { rows } = await db.query(
            'SELECT * FROM ledger_transactions WHERE owner_id = $1 ORDER BY created_at DESC',
            [ownerId]
        );
        return rows;
    },

    async getPlatformStats() {
        const { rows } = await db.query(
            `SELECT 
                COALESCE(SUM(platform_surplus), 0) as total_surplus,
                COUNT(*) as total_transactions,
                COALESCE(SUM(CASE WHEN type = 'pay_rent' THEN amount ELSE 0 END), 0) as total_rent_volume,
                COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END), 0) as total_withdrawn_volume
            FROM ledger_transactions 
            WHERE status = 'completed'`
        );
        return rows[0];
    }
};

module.exports = Ledger;
