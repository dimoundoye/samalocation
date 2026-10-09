const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Restitution d'une caution (dépôt de garantie) : décompte entre la caution versée,
 * les retenues éventuelles et le montant rendu au locataire.
 */
const DepositSettlement = {
    async create(data) {
        const {
            deposit_receipt_id,
            deposit_amount,
            refunded_amount,
            retained_amount,
            deductions = [],
            settlement_date,
            payment_method = null,
            notes = null,
            owner_signature = null,
            created_by = null
        } = data;

        const id = uuidv4();
        let retries = 3;
        while (retries > 0) {
            const settlement_number = await this.generateSettlementNumber();
            try {
                await db.query(
                    `INSERT INTO deposit_settlements
                        (id, deposit_receipt_id, settlement_number, deposit_amount, refunded_amount, retained_amount,
                         deductions, settlement_date, payment_method, notes, owner_signature, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [id, deposit_receipt_id, settlement_number, deposit_amount, refunded_amount, retained_amount,
                        JSON.stringify(deductions), settlement_date, payment_method, notes, owner_signature, created_by]
                );
                break;
            } catch (err) {
                if (err.code === '23505' && err.message?.includes('settlement_number') && retries > 1) {
                    retries--;
                    continue;
                }
                throw err;
            }
        }

        return this.findById(id);
    },

    /**
     * Numéro du décompte : RES-AAAAMM-0001 (séquence mensuelle, comme les reçus)
     */
    async generateSettlementNumber() {
        const now = new Date();
        const prefix = `RES-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
        const { rows } = await db.query(
            `SELECT COALESCE(MAX(CAST(SPLIT_PART(settlement_number, '-', 3) AS INTEGER)), 0) AS max_seq
             FROM deposit_settlements WHERE settlement_number LIKE $1`,
            [`${prefix}%`]
        );
        return `${prefix}${String(parseInt(rows[0].max_seq, 10) + 1).padStart(4, '0')}`;
    },

    async findById(id) {
        const { rows } = await db.query('SELECT * FROM deposit_settlements WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async findValidByReceiptId(depositReceiptId) {
        const { rows } = await db.query(
            "SELECT * FROM deposit_settlements WHERE deposit_receipt_id = $1 AND status = 'valid' LIMIT 1",
            [depositReceiptId]
        );
        return rows[0] || null;
    },

    async cancel(id, cancellationReason, cancelledBy) {
        const { rows } = await db.query(
            `UPDATE deposit_settlements
             SET status = 'cancelled', cancellation_reason = $1, cancelled_at = NOW(), cancelled_by = $2
             WHERE id = $3 AND status = 'valid'
             RETURNING *`,
            [cancellationReason, cancelledBy, id]
        );
        return rows[0] || null;
    }
};

module.exports = DepositSettlement;
