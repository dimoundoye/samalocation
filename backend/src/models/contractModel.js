const Subscription = require('./subscriptionModel');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const Notification = require('./notificationModel');
const crypto = require('crypto');

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
            owner_phone, owner_email,
            tenant_id_type, tenant_id_number, tenant_id_date,
            tenant_dob, tenant_birthplace,
            tenant_phone, tenant_email,
            detailed_address,
            property_type,
            property_details,
            charges_info,
            occupancy_limit,
            inventory,
            document_hash,
            owner_name,
            tenant_name,
            custom_content,
            custom_template_id
        } = data;

        // Helper to handle empty strings as null for date/number fields
        const nullIfEmpty = (val) => (val === "" || val === undefined) ? null : val;

        // Fetch owner's current signature
        let owner_signature = null;
        try {
            const { rows: ownerRows } = await db.query('SELECT signature_url FROM owner_profiles WHERE user_profile_id = $1', [owner_id]);
            // Signature électronique réservée aux plans qui l'incluent (plan terminé : pas de signature apposée)
            if (ownerRows[0] && await Subscription.hasAccessToFeature(owner_id, 'electronic_signature')) {
                owner_signature = ownerRows[0].signature_url;
            }
        } catch (error) {
            console.error("Error fetching signature for create:", error);
        }

        let contract = null;
        let retries = 3;
        while (retries > 0) {
            const contract_number = await this.generateContractNumber();
            try {
                const { rows } = await db.query(
                    `INSERT INTO rental_contracts 
                    (tenant_id, owner_id, property_id, unit_id, start_date, duration_months, rent_amount, deposit_amount, 
                    payment_day, payment_method, notes, contract_number, status, contract_type,
                    owner_id_type, owner_id_number, owner_id_date, owner_dob, owner_birthplace, owner_phone, owner_email,
                    tenant_id_type, tenant_id_number, tenant_id_date, tenant_dob, tenant_birthplace, tenant_phone, tenant_email,
                    detailed_address, property_type, property_details, charges_info, occupancy_limit, inventory, document_hash, owner_signed, owner_signed_at, owner_signature,
                    owner_name, tenant_name, custom_content, custom_template_id) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending_signature', $13, 
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, TRUE, CURRENT_TIMESTAMP, $35,
                    $36, $37, $38, $39) 
                    RETURNING *`,
                    [
                        tenant_id, owner_id, property_id, unit_id, start_date, duration_months || 12, rent_amount, deposit_amount,
                        payment_day || 5, payment_method, notes, contract_number, contract_type || 'standard',
                        owner_id_type, owner_id_number, nullIfEmpty(owner_id_date), nullIfEmpty(owner_dob), owner_birthplace, owner_phone, owner_email,
                        tenant_id_type, tenant_id_number, nullIfEmpty(tenant_id_date), nullIfEmpty(tenant_dob), tenant_birthplace, tenant_phone, tenant_email,
                        detailed_address, property_type || 'Appartement', property_details || '', charges_info || {}, nullIfEmpty(occupancy_limit), inventory || {}, document_hash,
                        owner_signature,
                        owner_name, tenant_name, nullIfEmpty(custom_content), nullIfEmpty(custom_template_id)
                    ]
                );
                contract = rows[0];
                break;
            } catch (err) {
                if (err.code === '23505' && (err.constraint?.includes('contract_number') || err.message?.includes('contract_number')) && retries > 1) {
                    console.warn(`⚠️ Collision de numéro de contrat (${contract_number}), nouvelle tentative avec un nouveau numéro...`);
                    retries--;
                    continue;
                }
                throw err;
            }
        }

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
                    message: `Un nouveau contrat de bail (${contract.contract_number}) a été créé pour vous. Merci de le signer.`,
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
        const prefix = `CONT-${year}-`;

        // Récupérer tous les numéros de contrat de l'année pour trouver la séquence maximale
        const { rows } = await db.query(
            'SELECT contract_number FROM rental_contracts WHERE contract_number LIKE $1',
            [`${prefix}%`]
        );

        let maxSeq = 0;
        for (const row of rows) {
            if (row.contract_number) {
                const parts = row.contract_number.split('-');
                if (parts.length >= 3) {
                    const seq = parseInt(parts[2], 10);
                    if (!isNaN(seq) && seq > maxSeq) {
                        maxSeq = seq;
                    }
                }
            }
        }

        let nextSeq = maxSeq + 1;
        let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;

        // Sécurité supplémentaire : vérifier l'unicité
        let exists = true;
        while (exists) {
            const check = await db.query('SELECT 1 FROM rental_contracts WHERE contract_number = $1', [candidate]);
            if (check.rows.length === 0) {
                exists = false;
            } else {
                nextSeq++;
                candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
            }
        }

        return candidate;
    },

    async findById(id) {
        if (!id) return null;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
        // Recherche par préfixe d'ID autorisée uniquement avec au moins 8 caractères hexadécimaux,
        // sinon un préfixe court ("0", "a"...) permettrait d'énumérer tous les contrats.
        const isSafePrefix = /^[0-9a-f-]{8,}$/i.test(String(id));
        const whereClause = isUuid
            ? 'WHERE c.id = $1'
            : (isSafePrefix ? 'WHERE c.id::text LIKE $1 OR c.contract_number = $2' : 'WHERE c.contract_number = $1');
        const params = isUuid ? [id] : (isSafePrefix ? [`${id}%`, id] : [id]);

        const { rows } = await db.query(`
            SELECT c.*, 
                   c.id as contract_id,
                   t.user_id as tenant_user_id,
                   t.full_name as live_tenant_name, t.email as live_tenant_email, t.phone as live_tenant_phone,
                   up_owner.full_name as live_owner_name, up_owner.email as live_owner_email, up_owner.phone as live_owner_phone,
                   COALESCE(NULLIF(c.owner_name, ''), up_owner.full_name) as owner_name,
                   COALESCE(NULLIF(c.tenant_name, ''), t.full_name) as tenant_name,
                   COALESCE(NULLIF(c.tenant_phone, ''), t.phone) as tenant_phone,
                   COALESCE(NULLIF(c.tenant_email, ''), t.email) as tenant_email,
                   COALESCE(NULLIF(c.owner_phone, ''), up_owner.phone) as owner_phone,
                   COALESCE(NULLIF(c.owner_email, ''), up_owner.email) as owner_email,
                   op.company_name as owner_company, op.address as owner_address, 
                   -- Signature figée au moment où le bailleur a signé : jamais remplacée par sa signature actuelle
                   NULLIF(c.owner_signature, '') as owner_signature,
                   COALESCE(c.tenant_signature, null) as tenant_signature,
                   p.name as property_name, p.address as property_address, p.property_type,
                   pu.unit_number,
                   op.currency
            FROM rental_contracts c
            JOIN tenants t ON c.tenant_id = t.id
            JOIN user_profiles up_owner ON c.owner_id = up_owner.id
            LEFT JOIN owner_profiles op ON c.owner_id = op.user_profile_id
            LEFT JOIN properties p ON c.property_id = p.id
            LEFT JOIN property_units pu ON c.unit_id = pu.id
            ${whereClause}
        `, params);
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
            // Signature électronique réservée aux plans qui l'incluent (plan terminé : pas de signature apposée)
            if (ownerRows[0] && await Subscription.hasAccessToFeature(contract.owner_id, 'electronic_signature')) {
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

    /**
     * Empreinte SHA-256 du contenu engageant du contrat (parties, bien, conditions, clauses).
     * Calculée au moment de la signature : si une clause change ensuite, l'empreinte ne correspond plus.
     */
    computeContentHash(contract) {
        const fields = [
            'contract_number', 'contract_type', 'owner_name', 'owner_id_type', 'owner_id_number',
            'tenant_name', 'tenant_id_type', 'tenant_id_number', 'property_id', 'unit_id', 'detailed_address',
            'start_date', 'duration_months', 'rent_amount', 'deposit_amount', 'payment_day', 'payment_method',
            'charges_info', 'occupancy_limit', 'inventory', 'notes', 'custom_content'
        ];
        const normalize = v => (v instanceof Date ? v.toISOString().slice(0, 10) : v ?? null);
        const canonical = JSON.stringify(fields.map(f => [f, normalize(contract[f])]));
        return crypto.createHash('sha256').update(canonical).digest('hex');
    },

    /**
     * Signature du locataire : image manuscrite + preuve (identifiant, date, IP, appareil, empreinte du contrat).
     */
    async signByTenant(id, { signature, proof }) {
        const contract = await this.findById(id);
        const newStatus = 'active';
        const documentHash = this.computeContentHash(contract);
        const fullProof = { ...proof, document_hash: documentHash };

        const { rows } = await db.query(
            `UPDATE rental_contracts
             SET tenant_signed = TRUE, tenant_signed_at = CURRENT_TIMESTAMP, status = $2,
                 tenant_signature = $3, tenant_signature_proof = $4, document_hash = $5
             WHERE id = $1 AND tenant_signed IS NOT TRUE
             RETURNING *`,
            [id, newStatus, signature, JSON.stringify(fullProof), documentHash]
        );
        if (!rows[0]) return null; // déjà signé entre-temps

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
    },

    async migrate() {
        const queries = [
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'Appartement'",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS property_details TEXT",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255)",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_content TEXT",
            "ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_template_id UUID"
        ];

        for (const sql of queries) {
            try {
                await db.query(sql);
            } catch (err) {
                console.error('Migration error (rental_contracts):', err.message);
            }
        }
        return true;
    }
};

module.exports = Contract;
