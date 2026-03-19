const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const Notification = require('./notificationModel');

const Contract = {
    async create(data) {
        const {
            tenant_id,
            owner_id,
            property_id,
            unit_id,
            start_date,
            duration_months,
            rent_amount,
            deposit_amount,
            payment_day,
            payment_method,
            notes,
            contract_type,
            owner_id_type, owner_id_number, owner_id_date,
            owner_dob, owner_birthplace,
            tenant_id_type, tenant_id_number, tenant_id_date,
            tenant_dob, tenant_birthplace,
            detailed_address,
            charges_info,
            occupancy_limit,
            inventory,
            document_hash
        } = data;

        const contract_number = await this.generateContractNumber();

        // Helper to handle empty strings as null for date/number fields
        const nullIfEmpty = (val) => (val === "" || val === undefined) ? null : val;

        // Fetch owner's current signature
        let owner_signature = null;
        try {
            const { rows: ownerRows } = await db.query('SELECT signature_url FROM owner_profiles WHERE user_profile_id = $1', [owner_id]);
            if (ownerRows[0]) {
                owner_signature = ownerRows[0].signature_url;
            }
        } catch (error) {
            console.error("Error fetching owner signature for contract creation:", error);
        }

        const { rows } = await db.query(
            `INSERT INTO rental_contracts 
            (tenant_id, owner_id, property_id, unit_id, start_date, duration_months, rent_amount, deposit_amount, 
            payment_day, payment_method, notes, contract_number, status, contract_type,
            owner_id_type, owner_id_number, owner_id_date, owner_dob, owner_birthplace,
            tenant_id_type, tenant_id_number, tenant_id_date, tenant_dob, tenant_birthplace,
            detailed_address, charges_info, occupancy_limit, inventory, document_hash, owner_signed, owner_signed_at, owner_signature) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending_signature', $13, 
            $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, TRUE, CURRENT_TIMESTAMP, $29) 
            RETURNING *`,
            [
                tenant_id, owner_id, property_id, unit_id, start_date, duration_months || 12, rent_amount, deposit_amount,
                payment_day || 5, payment_method, notes, contract_number, contract_type || 'standard',
                owner_id_type, owner_id_number, nullIfEmpty(owner_id_date), nullIfEmpty(owner_dob), owner_birthplace,
                tenant_id_type, tenant_id_number, nullIfEmpty(tenant_id_date), nullIfEmpty(tenant_dob), tenant_birthplace,
                detailed_address, charges_info || {}, nullIfEmpty(occupancy_limit), inventory || {}, document_hash,
                owner_signature
            ]
        );

        const contract = rows[0];

        // Notify tenant
        try {
            // Get tenant's user_id
            const { rows: tenantRows } = await db.query('SELECT user_id FROM tenants WHERE id = $1', [tenant_id]);
            if (tenantRows[0] && tenantRows[0].user_id) {
                await Notification.create({
                    id: uuidv4(),
                    user_id: tenantRows[0].user_id,
                    type: 'contract_created',
                    title: 'Nouveau contrat',
                    message: `Un nouveau contrat de bail (${contract_number}) a été créé pour vous. Merci de le signer.`,
                    link: '/tenant-dashboard'
                });
            }
        } catch (error) {
            console.error("Error creating notification for tenant contract:", error);
        }

        return contract;
    },

    async generateContractNumber() {
        const year = new Date().getFullYear();
        const { rows } = await db.query(
            'SELECT COUNT(*) as count FROM rental_contracts WHERE EXTRACT(YEAR FROM created_at) = $1',
            [year]
        );
        const count = parseInt(rows[0].count) + 1;
        return `CONT-${year}-${String(count).padStart(4, '0')}`;
    },

    async findById(id) {
        const { rows } = await db.query(`
            SELECT c.*, 
                   c.id as contract_id,
                   t.full_name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
                   up_owner.full_name as owner_name, up_owner.email as owner_email, up_owner.phone as owner_phone,
                   op.company_name as owner_company, op.address as owner_address, 
                   COALESCE(c.owner_signature, op.signature_url) as owner_signature,
                   COALESCE(c.tenant_signature, null) as tenant_signature,
                   p.name as property_name, p.address as property_address, p.property_type,
                   pu.unit_number
            FROM rental_contracts c
            JOIN tenants t ON c.tenant_id = t.id
            JOIN user_profiles up_owner ON c.owner_id = up_owner.id
            LEFT JOIN owner_profiles op ON c.owner_id = op.user_profile_id
            JOIN properties p ON c.property_id = p.id
            JOIN property_units pu ON c.unit_id = pu.id
            WHERE c.id = $1
        `, [id]);
        return rows[0] || null;
    },

    async findByOwnerId(ownerId) {
        // Auto-fix: If tenant has signed but status is still pending, move to active
        // This repairs contracts created before the owner-auto-sign fix
        await db.query(
            "UPDATE rental_contracts SET status = 'active' WHERE owner_id = $1 AND tenant_signed = TRUE AND status = 'pending_signature'",
            [ownerId]
        );

        const { rows } = await db.query(`
            SELECT c.*, t.full_name as tenant_name, p.name as property_name, pu.unit_number
            FROM rental_contracts c
            JOIN tenants t ON c.tenant_id = t.id
            JOIN properties p ON c.property_id = p.id
            JOIN property_units pu ON c.unit_id = pu.id
            WHERE c.owner_id = $1
            ORDER BY c.created_at DESC
        `, [ownerId]);
        return rows;
    },

    async findByTenantUserId(userId) {
        // First find the tenant records for this user
        const { rows: tenantRecords } = await db.query('SELECT id FROM tenants WHERE user_id = $1', [userId]);
        const tenantIds = tenantRecords.map(r => r.id);

        if (tenantIds.length === 0) return [];

        const { rows } = await db.query(`
            SELECT c.*, 
                   up_owner.full_name as owner_name, 
                   p.name as property_name, 
                   pu.unit_number
            FROM rental_contracts c
            JOIN user_profiles up_owner ON c.owner_id = up_owner.id
            JOIN properties p ON c.property_id = p.id
            JOIN property_units pu ON c.unit_id = pu.id
            WHERE c.tenant_id = ANY($1)
            ORDER BY c.created_at DESC
        `, [tenantIds]);
        return rows;
    },

    async signByOwner(id) {
        const contract = await this.findById(id);
        const newStatus = contract.tenant_signed ? 'active' : 'pending_signature';

        // Fetch current owner signature
        let owner_signature = null;
        try {
            const { rows: ownerRows } = await db.query('SELECT signature_url FROM owner_profiles WHERE user_profile_id = $1', [contract.owner_id]);
            if (ownerRows[0]) {
                owner_signature = ownerRows[0].signature_url;
            }
        } catch (error) {
            console.error("Error fetching signature for signByOwner:", error);
        }

        const { rows } = await db.query(
            "UPDATE rental_contracts SET owner_signed = TRUE, owner_signed_at = CURRENT_TIMESTAMP, owner_signature = $3, status = $2 WHERE id = $1 RETURNING *",
            [id, newStatus, owner_signature]
        );
        return rows[0];
    },

    async signByTenant(id) {
        // When tenant signs, if owner also signed, set status to active
        const contract = await this.findById(id);
        const newStatus = 'active';

        const { rows } = await db.query(
            "UPDATE rental_contracts SET tenant_signed = TRUE, tenant_signed_at = CURRENT_TIMESTAMP, status = $2 WHERE id = $1 RETURNING *",
            [id, newStatus]
        );

        // Notify owner
        try {
            await Notification.create({
                id: uuidv4(),
                user_id: contract.owner_id,
                type: 'contract_signed',
                title: 'Contrat signé',
                message: `Le locataire ${contract.tenant_name} a signé le contrat ${contract.contract_number}.`,
                link: '/owner-dashboard'
            });
        } catch (notifError) {
            console.error("Error creating notification for signed contract:", notifError);
        }

        return rows[0];
    },

    async terminate(id) {
        return await db.query(
            "UPDATE rental_contracts SET status = 'terminated', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );
    }
};

module.exports = Contract;
