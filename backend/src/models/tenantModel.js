const db = require('../config/db');

const Tenant = {
    /**
     * Get active lease info for a tenant user  
     */
    async findActiveLeaseByUserId(userId) {
        console.log('Finding active lease for userId:', userId);

        const [tenants] = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent, pu.bedrooms, pu.unit_type,
                   p.id as property_id, p.name as property_name, p.address as property_address, 
                   p.photo_url, p.owner_id,
                   owner_prof.full_name as owner_name, owner_prof.email as owner_email,
                   owner_prof.phone as owner_phone
            FROM tenants t
            LEFT JOIN property_units pu ON t.unit_id = pu.id
            LEFT JOIN properties p ON pu.property_id = p.id
            LEFT JOIN user_profiles owner_prof ON p.owner_id = owner_prof.id
            WHERE t.user_id = ? AND t.status = 'active'
            LIMIT 1
        `, [userId]);

        console.log('Found tenant lease:', tenants[0] || null);

        // Si on trouve un tenant, récupérer aussi le user_profile et tenant_profile
        if (tenants[0]) {
            const tenant = tenants[0];

            // Récupérer le user_profile du locataire
            const [userProfile] = await db.query(`
                SELECT id, email, full_name, phone, role
                FROM user_profiles
                WHERE id = ?
            `, [userId]);

            // Récupérer le owner_profile complet
            if (tenant.owner_id) {
                const [ownerProfiles] = await db.query(`
                    SELECT op.*, up.full_name, up.email, up.phone
                    FROM owner_profiles op
                    LEFT JOIN user_profiles up ON op.user_profile_id = up.id
                    WHERE up.id = ?
                `, [tenant.owner_id]);

                if (ownerProfiles[0]) {
                    tenant.ownerProfile = ownerProfiles[0];
                }
            }

            tenant.profile = userProfile[0] || null;
            return tenant;
        }

        return null;
    },

    /**
     * Get all tenants for an owner
     */
    async findByOwnerId(ownerId) {
        const [tenants] = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent,
                   p.name as property_name, p.property_type, p.id as property_id
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE p.owner_id = ?
            ORDER BY t.created_at DESC
        `, [ownerId]);
        return tenants;
    },

    /**
     * Get tenant by ID with property/unit details
     */
    async findById(id) {
        const [tenants] = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent,
                   p.name as property_name, p.id as property_id, p.owner_id
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE t.id = ?
        `, [id]);
        return tenants[0] || null;
    },

    /**
     * Update tenant
     */
    async update(id, data) {
        // Construire la requête dynamiquement pour ne mettre à jour que les champs fournis
        const updates = [];
        const values = [];

        if (data.full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(data.full_name);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.phone !== undefined) {
            updates.push('phone = ?');
            values.push(data.phone);
        }
        if (data.monthly_rent !== undefined) {
            updates.push('monthly_rent = ?');
            values.push(data.monthly_rent);
        }
        if (data.move_in_date !== undefined) {
            updates.push('move_in_date = ?');
            values.push(data.move_in_date);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }

        if (updates.length === 0) {
            // Aucune mise à jour, retourner le tenant actuel
            return await this.findById(id);
        }

        // Ajouter l'ID à la fin
        values.push(id);

        const query = `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        // Return updated tenant
        return await this.findById(id);
    },

    /**
     * Delete tenant and free up unit
     */
    async delete(id) {
        // Get tenant to access unit_id
        const tenant = await this.findById(id);

        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Delete tenant
        await db.query('DELETE FROM tenants WHERE id = ?', [id]);

        // Mark unit as available
        if (tenant.unit_id) {
            await db.query('UPDATE property_units SET is_available = true WHERE id = ?', [tenant.unit_id]);
        }

        return tenant;
    },

    /**
     * Assign a tenant to a unit
     */
    async create(data) {
        const { id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id } = data;

        await db.query(
            'INSERT INTO tenants (id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id]
        );

        // Mark unit as occupied
        await db.query('UPDATE property_units SET is_available = false WHERE id = ?', [unit_id]);

        // Return the created tenant with joined info
        const [rows] = await db.query(`
            SELECT t.*, pu.unit_number, p.name as property_name
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE t.id = ?
        `, [id]);
        return rows[0];
    }
};

module.exports = Tenant;
