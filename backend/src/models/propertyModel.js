const db = require('../config/db');

const Property = {
    /**
     * Get all published properties
     */
    async countAllPublished(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM properties WHERE is_published = 1';
        const params = [];

        if (filters.type && filters.type !== 'all') {
            query += ' AND property_type = ?';
            params.push(filters.type);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR address LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        const [rows] = await db.query(query, params);
        return rows[0].count;
    },

    async findAllPublished(limit, offset = 0, filters = {}) {
        let query = 'SELECT * FROM properties WHERE is_published = 1';
        const params = [];

        if (filters.type && filters.type !== 'all') {
            query += ' AND property_type = ?';
            params.push(filters.type);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR address LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY published_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));

            if (offset !== undefined) {
                query += ' OFFSET ?';
                params.push(parseInt(offset));
            }
        }

        const [rows] = await db.query(query, params);

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id).filter(Boolean);
        const ownerIds = [...new Set(rows.map(r => r.owner_id))].filter(Boolean);

        if (propertyIds.length === 0) return rows;

        // Batch fetch units
        const [allUnits] = await db.query(
            'SELECT id, property_id, monthly_rent, is_available, unit_type, bedrooms, bathrooms, area_sqm, rent_period, unit_number FROM property_units WHERE property_id IN (?)',
            [propertyIds]
        );

        // Batch fetch owner profiles using UNION for better index performance than OR
        let allOwnerProfiles = [];
        if (ownerIds.length > 0) {
            const [profiles] = await db.query(`
                SELECT user_profile_id, id, company_name, phone, phone as contact_phone 
                FROM owner_profiles 
                WHERE user_profile_id IN (?)
                UNION
                SELECT user_profile_id, id, company_name, phone, phone as contact_phone 
                FROM owner_profiles 
                WHERE id IN (?)
            `, [ownerIds, ownerIds]);
            allOwnerProfiles = profiles;
        }

        // Map units and owners to properties
        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles.filter(o => o.user_profile_id === row.owner_id || o.id === row.owner_id)
        }));
    },

    /**
     * Get properties by owner ID
     */
    async findByOwnerId(ownerId) {
        const [rows] = await db.query(
            'SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC',
            [ownerId]
        );

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id);

        // Batch fetch units
        const [allUnits] = await db.query(
            'SELECT id, property_id, monthly_rent, is_available, unit_type, bedrooms, bathrooms, area_sqm, rent_period, unit_number FROM property_units WHERE property_id IN (?)',
            [propertyIds]
        );

        // Batch fetch owner profiles
        const [allOwnerProfiles] = await db.query(`
            SELECT user_profile_id, company_name, phone, phone as contact_phone 
            FROM owner_profiles 
            WHERE user_profile_id = ? OR id = ?
        `, [ownerId, ownerId]);

        // Map units and owners to properties
        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles
        }));
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
     * Find similar properties
     */
    async findSimilar(propertyId, type, address, limit = 4) {
        // Extraire un quartier potentiel de l'adresse (ex: "Almadies" de "Rue 10, Almadies")
        const addressParts = address ? address.split(',') : [];
        const neighborhood = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : address;

        let query = `
            SELECT * FROM properties 
            WHERE id != ? AND is_published = 1 
            AND (property_type = ? OR address LIKE ?)
            ORDER BY published_at DESC LIMIT ?
        `;
        const params = [propertyId, type, `%${neighborhood}%`, parseInt(limit)];

        const [rows] = await db.query(query, params);

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id).filter(Boolean);
        const ownerIds = [...new Set(rows.map(r => r.owner_id))].filter(Boolean);

        // Batch fetch units
        const [allUnits] = await db.query(
            'SELECT * FROM property_units WHERE property_id IN (?)',
            [propertyIds]
        );

        // Batch fetch owner profiles
        let allOwnerProfiles = [];
        if (ownerIds.length > 0) {
            const [profiles] = await db.query(`
                SELECT user_profile_id, id, company_name, phone, phone as contact_phone 
                FROM owner_profiles 
                WHERE user_profile_id IN (?) OR id IN (?)
            `, [ownerIds, ownerIds]);
            allOwnerProfiles = profiles;
        }

        // Map units and owners to properties
        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles.filter(o => o.user_profile_id === row.owner_id || o.id === row.owner_id)
        }));
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
