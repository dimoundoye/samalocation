const db = require('../config/db');

const Tenant = {
    async findActiveLeasesByUserId(userId) {
        return this.findLeasesByUserId(userId, ['active', 'pending']);
    },

    async findAllLeasesByUserId(userId) {
        return this.findLeasesByUserId(userId, ['active', 'pending', 'inactive']);
    },

    async findLeasesByUserId(userId, statuses) {
        const { rows: profiles } = await db.query('SELECT email FROM user_profiles WHERE id = $1', [userId]);
        const userEmail = profiles[0]?.email;
        const statusPlaceholders = statuses.map((_, i) => `$${i + 3}`).join(', ');

        const { rows: tenants } = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent, pu.bedrooms, pu.unit_type,
                   p.id as property_id, p.name as property_name, p.address as property_address, 
                   p.photo_url, 
                   COALESCE(op_direct.user_profile_id, p.owner_id) as owner_id,
                   owner_prof.full_name as owner_name, owner_prof.email as owner_email,
                   owner_prof.phone as owner_phone
            FROM tenants t
            LEFT JOIN property_units pu ON t.unit_id = pu.id
            LEFT JOIN properties p ON pu.property_id = p.id
            LEFT JOIN owner_profiles op_direct ON p.owner_id = op_direct.id
            LEFT JOIN user_profiles owner_prof ON COALESCE(op_direct.user_profile_id, p.owner_id) = owner_prof.id
            WHERE (t.user_id = $1 OR (t.email = $2 AND t.email IS NOT NULL AND t.email != '')) 
            AND t.status IN (${statusPlaceholders})
            ORDER BY t.created_at DESC
        `, [userId, userEmail, ...statuses]);

        const enrichedLeases = [];
        for (const tenant of tenants) {
            const { rows: userProfile } = await db.query(`
                SELECT id, email, full_name, phone, role
                FROM user_profiles
                WHERE id = $1
            `, [userId]);

            if (tenant.owner_id) {
                const { rows: ownerProfiles } = await db.query(`
                    SELECT op.currency, op.company_name, op.logo_url, op.phone as contact_phone, up.full_name, up.email, up.phone
                    FROM owner_profiles op
                    LEFT JOIN user_profiles up ON op.user_profile_id = up.id
                    WHERE up.id = $1 OR op.id = $1
                `, [tenant.owner_id]);

                if (ownerProfiles[0]) {
                    tenant.ownerProfile = ownerProfiles[0];
                }
            }

            tenant.profile = userProfile[0] || null;
            enrichedLeases.push(tenant);
        }

        return enrichedLeases;
    },

    async findByOwnerId(ownerId) {
        const { rows: tenants } = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent, pu.rent_period,
                   p.name as property_name, p.property_type, p.id as property_id
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE p.owner_id = $1
            ORDER BY t.created_at DESC
        `, [ownerId]);
        return tenants;
    },

    async findById(id) {
        const { rows: tenants } = await db.query(`
            SELECT t.*, 
                   pu.unit_number, pu.monthly_rent as unit_rent,
                   p.name as property_name, p.id as property_id, p.owner_id
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE t.id = $1
        `, [id]);
        return tenants[0] || null;
    },

    async update(id, data) {
        const updates = [];
        const values = [];
        let idx = 1;

        if (data.full_name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(data.full_name); }
        if (data.email !== undefined) { updates.push(`email = $${idx++}`); values.push(data.email); }
        if (data.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(data.phone); }
        if (data.monthly_rent !== undefined) { updates.push(`monthly_rent = $${idx++}`); values.push(data.monthly_rent); }
        if (data.move_in_date !== undefined) { updates.push(`move_in_date = $${idx++}`); values.push(data.move_in_date); }
        if (data.status !== undefined) { updates.push(`status = $${idx++}`); values.push(data.status); }

        if (updates.length === 0) return await this.findById(id);

        values.push(id);
        const query = `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`;
        await db.query(query, values);

        return await this.findById(id);
    },

    async delete(id) {
        const tenant = await this.findById(id);

        if (!tenant) throw new Error('Tenant not found');

        // Soft delete : marquer comme inactif au lieu de supprimer
        // Cela permet de garder l'historique (reçus, contrats, etc.)
        await db.query(
            "UPDATE tenants SET status = 'inactive', updated_at = NOW() WHERE id = $1",
            [id]
        );

        // Libérer l'unité pour qu'elle soit disponible à nouveau
        if (tenant.unit_id) {
            await db.query('UPDATE property_units SET is_available = true WHERE id = $1', [tenant.unit_id]);
        }

        // Vérifier si on peut republier le logement
        const Property = require('./propertyModel');
        if (tenant.property_id) {
            try {
                // Remettre is_available sur l'unité et republier si possible
                const { rows: propRows } = await db.query(
                    'SELECT property_id FROM property_units WHERE id = $1',
                    [tenant.unit_id]
                );
                if (propRows[0]) {
                    await Property.checkAndUnpublish(propRows[0].property_id);
                }
            } catch (e) {
                console.warn('Could not republish property after soft delete:', e.message);
            }
        }

        return tenant;
    },

    async create(data) {
        const { id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id } = data;

        await db.query(
            'INSERT INTO tenants (id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id]
        );

        // Mark unit as occupied
        await db.query('UPDATE property_units SET is_available = false WHERE id = $1', [unit_id]);

        // Check and Unpublish if needed via Property model
        const Property = require('./propertyModel');
        const { rows: propertyRow } = await db.query('SELECT property_id FROM property_units WHERE id = $1', [unit_id]);
        if (propertyRow.length > 0) {
            await Property.checkAndUnpublish(propertyRow[0].property_id);
        }

        const { rows } = await db.query(`
            SELECT t.*, pu.unit_number, p.name as property_name
            FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE t.id = $1
        `, [id]);
        return rows[0];
    },

    async findActiveByUnitId(unitId) {
        const { rows } = await db.query(
            "SELECT id FROM tenants WHERE unit_id = $1 AND status IN ('active', 'pending')",
            [unitId]
        );
        return rows[0] || null;
    }
};

module.exports = Tenant;
