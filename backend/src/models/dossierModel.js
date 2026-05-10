const db = require('../config/db');

const Dossier = {
    /**
     * Récupère le dossier d'un utilisateur par son ID
     */
    async findByUserId(userId) {
        const { rows } = await db.query(
            'SELECT * FROM tenant_dossiers WHERE user_id = $1',
            [userId]
        );
        return rows[0] || null;
    },

    /**
     * Récupère un dossier par son ID
     */
    async findById(id) {
        const { rows } = await db.query(
            'SELECT * FROM tenant_dossiers WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Crée ou met à jour un dossier
     */
    async save(userId, data) {
        const {
            profession, contract_type, employer_name, monthly_income, 
            profession_since, cni_url, last_three_payslips, tax_notice_url,
            employment_certificate_url, proof_of_residence_url,
            has_guarantor, guarantor_info, is_complete,
            occupants_count, guarantor_relationship, marital_status
        } = data;

        const { rows } = await db.query(`
            INSERT INTO tenant_dossiers (
                user_id, profession, contract_type, employer_name, monthly_income,
                profession_since, cni_url, last_three_payslips, tax_notice_url,
                employment_certificate_url, proof_of_residence_url,
                has_guarantor, guarantor_info, is_complete, updated_at,
                occupants_count, guarantor_relationship, marital_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17)
            ON CONFLICT (user_id) DO UPDATE SET
                profession = EXCLUDED.profession,
                contract_type = EXCLUDED.contract_type,
                employer_name = EXCLUDED.employer_name,
                monthly_income = EXCLUDED.monthly_income,
                profession_since = EXCLUDED.profession_since,
                cni_url = COALESCE(EXCLUDED.cni_url, tenant_dossiers.cni_url),
                last_three_payslips = COALESCE(EXCLUDED.last_three_payslips, tenant_dossiers.last_three_payslips),
                tax_notice_url = COALESCE(EXCLUDED.tax_notice_url, tenant_dossiers.tax_notice_url),
                employment_certificate_url = COALESCE(EXCLUDED.employment_certificate_url, tenant_dossiers.employment_certificate_url),
                proof_of_residence_url = COALESCE(EXCLUDED.proof_of_residence_url, tenant_dossiers.proof_of_residence_url),
                has_guarantor = EXCLUDED.has_guarantor,
                guarantor_info = EXCLUDED.guarantor_info,
                is_complete = EXCLUDED.is_complete,
                occupants_count = EXCLUDED.occupants_count,
                guarantor_relationship = EXCLUDED.guarantor_relationship,
                marital_status = EXCLUDED.marital_status,
                updated_at = NOW()
            RETURNING *
        `, [
            userId, profession, contract_type, employer_name, monthly_income,
            profession_since, cni_url, JSON.stringify(last_three_payslips || []), tax_notice_url,
            employment_certificate_url, proof_of_residence_url,
            has_guarantor, JSON.stringify(guarantor_info || {}), is_complete,
            occupants_count || 1, guarantor_relationship, marital_status || 'Célibataire'
        ]);

        return rows[0];
    },

    /**
     * Partage un dossier avec un propriétaire
     */
    async share(dossierId, ownerId, propertyId = null, expiresAt = null) {
        const { rows } = await db.query(`
            INSERT INTO dossier_shares (dossier_id, owner_id, property_id, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (dossier_id, owner_id, property_id) DO UPDATE SET
                status = 'active',
                shared_at = NOW(),
                expires_at = EXCLUDED.expires_at
            RETURNING *
        `, [dossierId, ownerId, propertyId, expiresAt]);
        
        return rows[0];
    },

    /**
     * Vérifie si un propriétaire a accès à un dossier
     */
    async hasAccess(dossierId, ownerId) {
        const { rows } = await db.query(`
            SELECT 1 FROM dossier_shares 
            WHERE dossier_id = $1 AND owner_id = $2
            AND (expires_at IS NULL OR expires_at > NOW())
        `, [dossierId, ownerId]);
        
        return rows.length > 0;
    },

    /**
     * Liste les partages actifs pour un propriétaire
     */
    async findSharedWith(ownerId) {
        const { rows } = await db.query(`
            SELECT ds.*, td.profession, td.contract_type, td.monthly_income, td.is_verified,
                   up.full_name as tenant_name, up.email as tenant_email
            FROM dossier_shares ds
            JOIN tenant_dossiers td ON ds.dossier_id = td.id
            JOIN user_profiles up ON td.user_id = up.id
            WHERE ds.owner_id = $1
            AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
            ORDER BY ds.shared_at DESC
        `, [ownerId]);
        
        return rows;
    },

    /**
     * Met à jour le statut d'un partage de dossier
     */
    async updateShareStatus(dossierId, ownerId, status) {
        const { rows } = await db.query(`
            UPDATE dossier_shares
            SET status = $1, updated_at = NOW()
            WHERE dossier_id = $2 AND owner_id = $3
            RETURNING *
        `, [status, dossierId, ownerId]);
        
        return rows[0];
    },

    /**
     * Liste tous les partages d'un dossier (pour le locataire)
     */
    async findSharesByDossierId(dossierId) {
        const { rows } = await db.query(`
            SELECT ds.*, up.full_name as owner_name, up.email as owner_email,
                   p.name as property_name
            FROM dossier_shares ds
            JOIN user_profiles up ON ds.owner_id = up.id
            LEFT JOIN properties p ON ds.property_id = p.id
            WHERE ds.dossier_id = $1
            ORDER BY ds.shared_at DESC
        `, [dossierId]);
        return rows;
    },

    /**
     * Révoque le partage d'un dossier
     */
    async deleteShare(dossierId, ownerId, propertyId = null) {
        let query = 'DELETE FROM dossier_shares WHERE dossier_id = $1 AND owner_id = $2';
        const params = [dossierId, ownerId];

        if (propertyId) {
            query += ' AND property_id = $3';
            params.push(propertyId);
        }

        const { rowCount } = await db.query(query, params);
        return rowCount > 0;
    },

    async migrate() {
        await db.query(`
            -- S'assurer que la colonne status existe avec une valeur par défaut
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dossier_shares' AND column_name='status') THEN
                    ALTER TABLE dossier_shares ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dossier_shares' AND column_name='updated_at') THEN
                    ALTER TABLE dossier_shares ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
                END IF;
            END $$;
        `);
    }
};

module.exports = Dossier;
