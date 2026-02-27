const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Receipt = {
    async create(data) {
        const {
            tenant_id,
            property_id,
            unit_id,
            month,
            year,
            amount,
            payment_date,
            payment_method = 'virement',
            notes = null
        } = data;

        const id = uuidv4();
        const receipt_number = await this.generateReceiptNumber();

        await db.query(
            `INSERT INTO receipts 
            (id, tenant_id, property_id, unit_id, month, year, amount, payment_date, payment_method, receipt_number, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [id, tenant_id, property_id, unit_id, month, year, amount, payment_date, payment_method, receipt_number, notes]
        );

        return this.findById(id);
    },

    async generateReceiptNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // PostgreSQL: EXTRACT au lieu de YEAR()/MONTH()
        const { rows } = await db.query(
            'SELECT COUNT(*) as count FROM receipts WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2',
            [year, new Date().getMonth() + 1]
        );

        const count = parseInt(rows[0].count) + 1;
        const sequence = String(count).padStart(4, '0');

        return `REC-${year}${month}-${sequence}`;
    },

    async findById(id) {
        console.log('🔍 findById called for receipt:', id);
        const { rows: receipts } = await db.query(
            `SELECT 
                r.*,
                tenant.full_name as tenant_name,
                tenant.email as tenant_email,
                tenant.phone as tenant_phone,
                owner.full_name as owner_name,
                owner.email as owner_email,
                owner.phone as owner_phone,
                owner_prof.signature_url,
                owner_prof.receipt_template,
                p.name as property_name,
                p.address as property_address,
                pu.unit_number,
                t.monthly_rent as tenant_rent,
                t.move_in_date
            FROM receipts r
            LEFT JOIN user_profiles tenant ON r.tenant_id = tenant.id
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            LEFT JOIN owner_profiles owner_prof ON p.owner_id = owner_prof.id
            LEFT JOIN property_units pu ON r.property_id = pu.property_id AND (
                EXISTS (SELECT 1 FROM tenants t2 WHERE t2.user_id = r.tenant_id AND t2.unit_id = pu.id)
            )
            LEFT JOIN tenants t ON t.user_id = r.tenant_id
            WHERE r.id = $1`,
            [id]
        );

        return receipts[0] || null;
    },

    async findByTenantId(tenantId) {
        const { rows: receipts } = await db.query(
            `SELECT 
                r.*,
                p.name as property_name,
                p.address as property_address,
                owner.full_name as owner_name
            FROM receipts r
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            WHERE r.tenant_id = $1
            ORDER BY r.created_at DESC`,
            [tenantId]
        );

        return receipts;
    },

    async findByOwnerId(ownerId) {
        const { rows: receipts } = await db.query(
            `SELECT 
                r.*,
                tenant.full_name as tenant_name,
                p.name as property_name,
                p.address as property_address
            FROM receipts r
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles tenant ON r.tenant_id = tenant.id
            WHERE p.owner_id = $1
            ORDER BY r.created_at DESC`,
            [ownerId]
        );

        return receipts;
    },

    async delete(id) {
        await db.query('DELETE FROM receipts WHERE id = $1', [id]);
        return true;
    }
};

module.exports = Receipt;
