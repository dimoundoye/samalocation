const db = require('../config/db');

const MaintenanceRequest = {
    async create(data) {
        const { id, tenant_id, property_id, unit_id, title, description, priority, photos } = data;

        await db.query(
            'INSERT INTO maintenance_requests (id, tenant_id, property_id, unit_id, title, description, priority, photos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, tenant_id, property_id, unit_id, title, description, priority || 'medium', JSON.stringify(photos || [])]
        );

        return await this.findById(id);
    },

    async findById(id) {
        const { rows } = await db.query(`
            SELECT mr.*, 
                   t.full_name as tenant_name, t.phone as tenant_phone,
                   p.name as property_name, p.address as property_address,
                   pu.unit_number
            FROM maintenance_requests mr
            JOIN tenants t ON mr.tenant_id = t.id
            JOIN properties p ON mr.property_id = p.id
            JOIN property_units pu ON mr.unit_id = pu.id
            WHERE mr.id = $1
        `, [id]);

        if (rows[0] && rows[0].photos) {
            try {
                rows[0].photos = typeof rows[0].photos === 'string' ? JSON.parse(rows[0].photos) : rows[0].photos;
            } catch (e) {
                rows[0].photos = [];
            }
        }

        return rows[0] || null;
    },

    async findByTenantId(tenantId) {
        const { rows } = await db.query(`
            SELECT mr.*, p.name as property_name, pu.unit_number
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            JOIN property_units pu ON mr.unit_id = pu.id
            WHERE mr.tenant_id = $1
            ORDER BY mr.created_at DESC
        `, [tenantId]);

        return rows.map(row => {
            if (row.photos) {
                try {
                    row.photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos;
                } catch (e) {
                    row.photos = [];
                }
            }
            return row;
        });
    },

    async findByOwnerId(ownerId) {
        const { rows } = await db.query(`
            SELECT mr.*, 
                   t.full_name as tenant_name, t.phone as tenant_phone,
                   p.name as property_name, pu.unit_number
            FROM maintenance_requests mr
            JOIN tenants t ON mr.tenant_id = t.id
            JOIN properties p ON mr.property_id = p.id
            JOIN property_units pu ON mr.unit_id = pu.id
            WHERE (p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $2))
            ORDER BY 
                CASE mr.status 
                    WHEN 'pending' THEN 1 
                    WHEN 'in_progress' THEN 2 
                    WHEN 'resolved' THEN 3 
                    WHEN 'cancelled' THEN 4 
                END,
                mr.created_at DESC
        `, [ownerId, ownerId]);

        return rows.map(row => {
            if (row.photos) {
                try {
                    row.photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos;
                } catch (e) {
                    row.photos = [];
                }
            }
            return row;
        });
    },

    async updateStatus(id, status) {
        await db.query(
            'UPDATE maintenance_requests SET status = $1 WHERE id = $2',
            [status, id]
        );
        return await this.findById(id);
    }
};

module.exports = MaintenanceRequest;
