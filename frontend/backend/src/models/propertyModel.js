const db = require('../config/db');

const Property = {
    /**
     * Get all published properties
     */
    async findAllPublished(limit) {
        let query = `
            SELECT p.*, 
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'monthly_rent', monthly_rent, 'is_available', is_available, 'unit_type', unit_type, 'bedrooms', bedrooms, 'rent_period', rent_period))
                    FROM property_units WHERE property_id = p.id) as property_units
            FROM properties p
            WHERE is_published = true
            ORDER BY published_at DESC
        `;

        const params = [];
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Get properties by owner ID
     */
    async findByOwnerId(ownerId) {
        const query = `
            SELECT p.*, 
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'monthly_rent', monthly_rent, 'is_available', is_available, 'unit_type', unit_type, 'bedrooms', bedrooms, 'rent_period', rent_period, 'unit_number', unit_number))
                    FROM property_units WHERE property_id = p.id) as property_units
            FROM properties p
            WHERE owner_id = ?
            ORDER BY created_at DESC
        `;

        const [rows] = await db.query(query, [ownerId]);
        return rows;
    },

    /**
     * Get property by ID (including units and owner)
     */
    async findById(id) {
        const [properties] = await db.query('SELECT * FROM properties WHERE id = ?', [id]);
        if (properties.length === 0) return null;

        const property = properties[0];

        // Fetch units
        const [units] = await db.query('SELECT * FROM property_units WHERE property_id = ?', [id]);
        property.property_units = units;

        // Fetch owner profile
        const [ownerProfiles] = await db.query(`
            SELECT company_name, phone, phone as contact_phone 
            FROM owner_profiles 
            WHERE user_profile_id = ? OR id = ?
        `, [property.owner_id, property.owner_id]);
        property.owner_profiles = ownerProfiles;

        return property;
    },

    /**
     * Create a new property
     */
    async create(data) {
        const { id, owner_id, property_type, name, address, description, photos, photo_url, equipments } = data;

        await db.query(
            'INSERT INTO properties (id, owner_id, property_type, name, address, description, photos, photo_url, is_published, equipments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, owner_id, property_type, name, address, description, JSON.stringify(photos || []), photo_url, false, JSON.stringify(equipments || [])]
        );

        return this.findById(id);
    },

    /**
     * Toggle publication status
     */
    async updatePublication(id, ownerId) {
        const [properties] = await db.query('SELECT is_published FROM properties WHERE id = ? AND owner_id = ?', [id, ownerId]);
        if (properties.length === 0) return null;

        const isPublished = properties[0].is_published;
        const nextPublished = !isPublished;
        const publishedAt = nextPublished ? new Date() : null;

        await db.query(
            'UPDATE properties SET is_published = ?, published_at = ? WHERE id = ?',
            [nextPublished, publishedAt, id]
        );

        return { is_published: nextPublished };
    },

    /**
     * Add units to a property
     */
    async addUnits(propertyId, ownerId, units) {
        // Verify ownership
        const [properties] = await db.query('SELECT id FROM properties WHERE id = ? AND owner_id = ?', [propertyId, ownerId]);
        if (properties.length === 0) return false;

        // Insert units
        const { v4: uuidv4 } = require('uuid');
        for (const unit of units) {
            const unitId = uuidv4();
            await db.query(
                'INSERT INTO property_units (id, property_id, unit_type, unit_number, monthly_rent, area_sqm, bedrooms, bathrooms, description, is_available, rent_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [unitId, propertyId, unit.unit_type, unit.unit_number, unit.monthly_rent, unit.area_sqm, unit.bedrooms, unit.bathrooms, unit.description, true, unit.rent_period || 'mois']
            );
        }

        return true;
    },
    async findByUnitId(unitId) {
        const [rows] = await db.query(`
            SELECT p.*
            FROM properties p
            JOIN property_units pu ON p.id = pu.property_id
            WHERE pu.id = ?
        `, [unitId]);
        return rows[0] || null;
    },
    /**
     * Delete a property (only if owned by the owner)
     */
    async delete(id, ownerId) {
        // First verify ownership
        const [properties] = await db.query('SELECT id FROM properties WHERE id = ? AND owner_id = ?', [id, ownerId]);
        if (properties.length === 0) return false;

        // Delete property (cascading deletes will handle units, tenants, receipts if foreign keys are set up with ON DELETE CASCADE)
        await db.query('DELETE FROM properties WHERE id = ?', [id]);
        return true;
    }
};

module.exports = Property;
