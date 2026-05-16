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
            notes = null,
            period_type = 'mois',
            start_date = null,
            end_date = null
        } = data;

        const id = uuidv4();
        const receipt_number = await this.generateReceiptNumber();

        // Fetch names, signature and template
        let owner_signature = null;
        let receipt_template = 'classic';
        let owner_logo = null;
        let owner_name = null;
        let owner_email = null;
        let owner_phone = null;
        let tenant_name = null;
        let tenant_email = null;
        let tenant_phone = null;
        let currency = 'XOF';

        try {
            // Get owner info
            const { rows: propRows } = await db.query(`
                SELECT p.owner_id, up.full_name as owner_name, up.email as owner_email, up.phone as owner_phone,
                       op.signature_url, op.receipt_template, op.receipt_logo_url, op.currency
                FROM properties p
                JOIN user_profiles up ON p.owner_id = up.id
                LEFT JOIN owner_profiles op ON p.owner_id = op.user_profile_id
                WHERE p.id = $1
            `, [property_id]);

            if (propRows[0]) {
                owner_name = propRows[0].owner_name;
                owner_email = propRows[0].owner_email;
                owner_phone = propRows[0].owner_phone;
                owner_signature = propRows[0].signature_url;
                receipt_template = propRows[0].receipt_template || 'classic';
                owner_logo = propRows[0].receipt_logo_url;
                currency = propRows[0].currency || 'XOF';
            }

            // Get tenant info
            const { rows: tenantRows } = await db.query(`
                SELECT COALESCE(up.full_name, t_up.full_name) as tenant_name,
                       COALESCE(up.email, t_up.email) as tenant_email,
                       COALESCE(up.phone, t_up.phone) as tenant_phone
                FROM user_profiles up
                LEFT JOIN tenants t ON up.id = t.user_id
                LEFT JOIN user_profiles t_up ON (t.user_id = t_up.id)
                WHERE up.id = $1 OR t.id = $1
                LIMIT 1
            `, [tenant_id]);

            if (tenantRows[0]) {
                tenant_name = tenantRows[0].tenant_name;
                tenant_email = tenantRows[0].tenant_email;
                tenant_phone = tenantRows[0].tenant_phone;
            }
        } catch (error) {
            console.error("Error fetching details for receipt creation:", error);
        }

        await db.query(
            `INSERT INTO receipts 
            (id, tenant_id, property_id, unit_id, month, year, amount, payment_date, payment_method, receipt_number, notes, owner_signature, receipt_template, owner_logo, period_type, start_date, end_date, owner_name, tenant_name, currency, owner_email, owner_phone, tenant_email, tenant_phone) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
            [id, tenant_id, property_id, unit_id, month, year, amount, payment_date, payment_method, receipt_number, notes, owner_signature, receipt_template, owner_logo, period_type, start_date, end_date, owner_name, tenant_name, currency, owner_email, owner_phone, tenant_email, tenant_phone]
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
                COALESCE(r.tenant_name, up_direct.full_name, up_via_t.full_name) as tenant_name,
                COALESCE(r.tenant_email, up_direct.email, up_via_t.email) as tenant_email,
                COALESCE(r.tenant_phone, up_direct.phone, up_via_t.phone) as tenant_phone,
                COALESCE(r.owner_name, owner.full_name) as owner_name,
                COALESCE(r.owner_email, owner.email) as owner_email,
                COALESCE(r.owner_phone, owner.phone) as owner_phone,
                COALESCE(r.currency, owner_prof.currency, 'XOF') as currency,
                owner_prof.signature_url as current_owner_signature,
                owner_prof.receipt_template as current_receipt_template,
                owner_prof.logo_url as current_owner_agency_logo,
                owner_prof.receipt_logo_url as current_owner_receipt_logo,
                owner_prof.currency,
                p.name as property_name,
                p.address as property_address,
                pu.unit_number,
                pu.rent_period,
                pu.monthly_rent as unit_base_rent,
                t.monthly_rent as tenant_rent,
                t.move_in_date
            FROM receipts r
            LEFT JOIN user_profiles up_direct ON r.tenant_id = up_direct.id
            LEFT JOIN tenants t ON (r.tenant_id = t.id OR r.tenant_id = t.user_id)
            LEFT JOIN user_profiles up_via_t ON t.user_id = up_via_t.id
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            LEFT JOIN owner_profiles owner_prof ON p.owner_id = owner_prof.user_profile_id
            LEFT JOIN property_units pu ON r.unit_id = pu.id
            WHERE r.id = $1`,
            [id]
        );

        if (receipts[0]) {
            // Priority:
            // 1. Value stored in receipt table (Immutability)
            // 2. Value in live owner profile (only for legacy receipts created without snapshot)
            receipts[0].signature_url = receipts[0].owner_signature || receipts[0].current_owner_signature;
            receipts[0].receipt_template = receipts[0].receipt_template || receipts[0].current_receipt_template || 'classic';
            // Priority for branding: snapshot logo, then professional receipt logo, then nothing for receipts if plan doesn't allow (handled in controller)
            receipts[0].logo_url = receipts[0].owner_logo || receipts[0].current_owner_receipt_logo;
        }

        return receipts[0] || null;
    },

    async findByTenantId(userId, limit = 100, offset = 0) {
        // Find all tenant records (stays) for this user to include legacy user_id links and new stay_id links
        const { rows: tenantRecords } = await db.query('SELECT id FROM tenants WHERE user_id = $1', [userId]);
        const stayIds = tenantRecords.map(r => r.id);

        const { rows: receipts } = await db.query(
            `SELECT 
                r.*,
                p.name as property_name,
                p.address as property_address,
                pu.rent_period,
                pu.monthly_rent as unit_base_rent,
                owner.full_name as owner_name,
                owner_prof.currency
            FROM receipts r
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            LEFT JOIN owner_profiles owner_prof ON p.owner_id = owner_prof.user_profile_id
            LEFT JOIN property_units pu ON r.unit_id = pu.id
            WHERE r.tenant_id = $1 OR r.tenant_id = ANY($2)
            ORDER BY r.created_at DESC
            LIMIT $3 OFFSET $4`,
            [userId, stayIds, limit, offset]
        );

        return receipts;
    },

    async findByOwnerId(ownerId, limit = 200, offset = 0) {
        const { rows: receipts } = await db.query(
            `SELECT 
                r.*,
                tenant.full_name as tenant_name,
                p.name as property_name,
                p.address as property_address,
                pu.rent_period,
                pu.monthly_rent as unit_base_rent,
                owner_prof.currency
            FROM receipts r
            LEFT JOIN user_profiles tenant ON r.tenant_id = tenant.id
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN owner_profiles owner_prof ON p.owner_id = owner_prof.user_profile_id
            LEFT JOIN property_units pu ON r.unit_id = pu.id
            WHERE p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $2)
            ORDER BY r.created_at DESC
            LIMIT $3 OFFSET $4`,
            [ownerId, ownerId, limit, offset]
        );

        return receipts;
    },

    async delete(id) {
        await db.query('DELETE FROM receipts WHERE id = $1', [id]);
        return true;
    },

    async migrate() {
        const queries = [
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS period_type VARCHAR(20) DEFAULT 'mois'",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS start_date DATE NULL",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS end_date DATE NULL",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)", 
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255)",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'XOF'",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255)",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50)",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255)",
            "ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50)"
        ];

        for (const sql of queries) {
            try {
                await db.query(sql);
            } catch (err) {
                console.error('Migration error (receipts):', err.message);
            }
        }
        return true;
    }
};

module.exports = Receipt;
