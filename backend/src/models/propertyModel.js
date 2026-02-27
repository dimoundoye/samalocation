const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Property = {
    async countAllPublished(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM properties WHERE is_published = true';
        const params = [];
        let idx = 1;

        if (filters.type && filters.type !== 'all') {
            query += ` AND property_type = $${idx++}`;
            params.push(filters.type);
        }

        if (filters.search) {
            const searchTerms = filters.search.trim().split(/\s+/);
            searchTerms.forEach(term => {
                query += ` AND (name ILIKE $${idx} OR address ILIKE $${idx + 1})`;
                params.push(`%${term}%`, `%${term}%`);
                idx += 2;
            });
        }

        const { rows } = await db.query(query, params);
        return parseInt(rows[0].count);
    },

    async findAllPublished(limit, offset = 0, filters = {}) {
        let query = 'SELECT * FROM properties WHERE is_published = true';
        const params = [];
        let idx = 1;

        if (filters.type && filters.type !== 'all') {
            query += ` AND property_type = $${idx++}`;
            params.push(filters.type);
        }

        if (filters.search) {
            const searchTerms = filters.search.trim().split(/\s+/);
            searchTerms.forEach(term => {
                query += ` AND (name ILIKE $${idx} OR address ILIKE $${idx + 1})`;
                params.push(`%${term}%`, `%${term}%`);
                idx += 2;
            });
        }

        query += ' ORDER BY published_at DESC';

        if (limit) {
            query += ` LIMIT $${idx++}`;
            params.push(parseInt(limit));
            query += ` OFFSET $${idx++}`;
            params.push(parseInt(offset));
        }

        const { rows } = await db.query(query, params);

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id).filter(Boolean);
        const ownerIds = [...new Set(rows.map(r => r.owner_id))].filter(Boolean);

        if (propertyIds.length === 0) return rows;

        const { rows: allUnits } = await db.query(
            'SELECT id, property_id, monthly_rent, is_available, unit_type, bedrooms, bathrooms, area_sqm, rent_period, unit_number FROM property_units WHERE property_id = ANY($1)',
            [propertyIds]
        );

        let allOwnerProfiles = [];
        if (ownerIds.length > 0) {
            const { rows: profiles } = await db.query(`
                SELECT user_profile_id, id, company_name, phone, phone as contact_phone, verification_status, is_verified
                FROM owner_profiles 
                WHERE user_profile_id = ANY($1) OR id = ANY($2)
            `, [ownerIds, ownerIds]);
            allOwnerProfiles = profiles;
        }

        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles.filter(o => o.user_profile_id === row.owner_id || o.id === row.owner_id)
        }));
    },

    async findByOwnerId(ownerId) {
        const { rows } = await db.query(
            'SELECT * FROM properties WHERE owner_id = $1 OR owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $2) ORDER BY created_at DESC',
            [ownerId, ownerId]
        );

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id);

        const { rows: allUnits } = await db.query(
            'SELECT id, property_id, monthly_rent, is_available, unit_type, bedrooms, bathrooms, area_sqm, rent_period, unit_number FROM property_units WHERE property_id = ANY($1)',
            [propertyIds]
        );

        const { rows: allOwnerProfiles } = await db.query(`
            SELECT user_profile_id, company_name, phone, phone as contact_phone, bio, verification_status, is_verified
            FROM owner_profiles 
            WHERE user_profile_id = $1 OR id = $2
        `, [ownerId, ownerId]);

        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles
        }));
    },

    async findById(id) {
        const { rows: properties } = await db.query('SELECT * FROM properties WHERE id = $1', [id]);
        if (properties.length === 0) return null;

        const property = properties[0];

        const { rows: units } = await db.query('SELECT * FROM property_units WHERE property_id = $1', [id]);
        property.property_units = units;

        const { rows: ownerProfiles } = await db.query(`
            SELECT company_name, phone, phone as contact_phone, bio, verification_status, is_verified
            FROM owner_profiles 
            WHERE user_profile_id = $1 OR id = $2
        `, [property.owner_id, property.owner_id]);
        property.owner_profiles = ownerProfiles;

        return property;
    },

    async create(data) {
        const { id, owner_id, property_type, name, address, latitude, longitude, description, photos, photo_url, equipments } = data;

        await db.query(
            'INSERT INTO properties (id, owner_id, property_type, name, address, latitude, longitude, description, photos, photo_url, is_published, equipments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11)',
            [id, owner_id, property_type, name, address, latitude || null, longitude || null, description, JSON.stringify(photos || []), photo_url, JSON.stringify(equipments || [])]
        );

        return this.findById(id);
    },

    async updatePublication(id, ownerId) {
        const { rows: properties } = await db.query('SELECT is_published FROM properties WHERE id = $1 AND owner_id = $2', [id, ownerId]);
        if (properties.length === 0) return null;

        const isPublished = properties[0].is_published;
        const nextPublished = !isPublished;
        const publishedAt = nextPublished ? new Date() : null;

        await db.query(
            'UPDATE properties SET is_published = $1, published_at = $2 WHERE id = $3',
            [nextPublished, publishedAt, id]
        );

        return { is_published: nextPublished };
    },

    async addUnits(propertyId, ownerId, units) {
        const { rows: properties } = await db.query('SELECT id FROM properties WHERE id = $1 AND owner_id = $2', [propertyId, ownerId]);
        if (properties.length === 0) return false;

        for (const unit of units) {
            const unitId = uuidv4();
            await db.query(
                'INSERT INTO property_units (id, property_id, unit_type, unit_number, monthly_rent, area_sqm, bedrooms, bathrooms, description, is_available, rent_period) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)',
                [unitId, propertyId, unit.unit_type, unit.unit_number, unit.monthly_rent, unit.area_sqm, unit.bedrooms, unit.bathrooms, unit.description, unit.rent_period || 'mois']
            );
        }

        return true;
    },

    async findByUnitId(unitId) {
        const { rows } = await db.query(`
            SELECT p.*
            FROM properties p
            JOIN property_units pu ON p.id = pu.property_id
            WHERE pu.id = $1
        `, [unitId]);
        return rows[0] || null;
    },

    async findSimilar(propertyId, type, address, limit = 4) {
        const addressParts = address ? address.split(',') : [];
        const neighborhood = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : address;

        const query = `
            SELECT * FROM properties 
            WHERE id != $1 AND is_published = true
            AND (property_type = $2 OR address ILIKE $3)
            ORDER BY published_at DESC LIMIT $4
        `;
        const params = [propertyId, type, `%${neighborhood}%`, parseInt(limit)];

        const { rows } = await db.query(query, params);

        if (rows.length === 0) return [];

        const propertyIds = rows.map(r => r.id).filter(Boolean);
        const ownerIds = [...new Set(rows.map(r => r.owner_id))].filter(Boolean);

        const { rows: allUnits } = await db.query(
            'SELECT * FROM property_units WHERE property_id = ANY($1)',
            [propertyIds]
        );

        let allOwnerProfiles = [];
        if (ownerIds.length > 0) {
            const { rows: profiles } = await db.query(`
                SELECT user_profile_id, id, company_name, phone, phone as contact_phone, verification_status, is_verified
                FROM owner_profiles 
                WHERE user_profile_id = ANY($1) OR id = ANY($2)
            `, [ownerIds, ownerIds]);
            allOwnerProfiles = profiles;
        }

        return rows.map(row => ({
            ...row,
            property_units: allUnits.filter(u => u.property_id === row.id),
            owner_profiles: allOwnerProfiles.filter(o => o.user_profile_id === row.owner_id || o.id === row.owner_id)
        }));
    },

    async delete(id, ownerId) {
        const { rows: properties } = await db.query('SELECT id FROM properties WHERE id = $1 AND owner_id = $2', [id, ownerId]);
        if (properties.length === 0) return false;

        await db.query('DELETE FROM properties WHERE id = $1', [id]);
        return true;
    },

    async updateUnit(unitId, data) {
        const { unit_type, unit_number, monthly_rent, area_sqm, bedrooms, bathrooms, description, is_available, rent_period } = data;
        const updateFields = [];
        const params = [];
        let idx = 1;

        if (unit_type) { updateFields.push(`unit_type = $${idx++}`); params.push(unit_type); }
        if (unit_number) { updateFields.push(`unit_number = $${idx++}`); params.push(unit_number); }
        if (monthly_rent !== undefined) { updateFields.push(`monthly_rent = $${idx++}`); params.push(monthly_rent); }
        if (area_sqm !== undefined) { updateFields.push(`area_sqm = $${idx++}`); params.push(area_sqm); }
        if (bedrooms !== undefined) { updateFields.push(`bedrooms = $${idx++}`); params.push(bedrooms); }
        if (bathrooms !== undefined) { updateFields.push(`bathrooms = $${idx++}`); params.push(bathrooms); }
        if (description !== undefined) { updateFields.push(`description = $${idx++}`); params.push(description); }
        if (is_available !== undefined) { updateFields.push(`is_available = $${idx++}`); params.push(is_available); }
        if (rent_period) { updateFields.push(`rent_period = $${idx++}`); params.push(rent_period); }

        if (updateFields.length === 0) return true;

        params.push(unitId);
        await db.query(`UPDATE property_units SET ${updateFields.join(', ')} WHERE id = $${idx}`, params);
        return true;
    },

    async update(id, ownerId, data) {
        const { rows: properties } = await db.query('SELECT id FROM properties WHERE id = $1 AND owner_id = $2', [id, ownerId]);
        if (properties.length === 0) return null;

        const { name, address, latitude, longitude, description, photos, photo_url, equipments, property_type, units } = data;

        const updateFields = [];
        const params = [];
        let idx = 1;

        if (name) { updateFields.push(`name = $${idx++}`); params.push(name); }
        if (address) { updateFields.push(`address = $${idx++}`); params.push(address); }
        if (latitude !== undefined) { updateFields.push(`latitude = $${idx++}`); params.push(latitude); }
        if (longitude !== undefined) { updateFields.push(`longitude = $${idx++}`); params.push(longitude); }
        if (description !== undefined) { updateFields.push(`description = $${idx++}`); params.push(description); }
        if (photos) { updateFields.push(`photos = $${idx++}`); params.push(JSON.stringify(photos)); }
        if (photo_url) { updateFields.push(`photo_url = $${idx++}`); params.push(photo_url); }
        if (equipments) { updateFields.push(`equipments = $${idx++}`); params.push(JSON.stringify(equipments)); }
        if (property_type) { updateFields.push(`property_type = $${idx++}`); params.push(property_type); }

        if (updateFields.length > 0) {
            params.push(id);
            await db.query(`UPDATE properties SET ${updateFields.join(', ')} WHERE id = $${idx}`, params);
        }

        // Handle units update if provided
        if (units && Array.isArray(units)) {
            for (const unit of units) {
                if (unit.id) {
                    await this.updateUnit(unit.id, unit);
                } else {
                    // Create new unit
                    const unitId = uuidv4();
                    await db.query(
                        'INSERT INTO property_units (id, property_id, unit_type, unit_number, monthly_rent, area_sqm, bedrooms, bathrooms, description, is_available, rent_period) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)',
                        [unitId, id, unit.unit_type, unit.unit_number, unit.monthly_rent, unit.area_sqm, unit.bedrooms, unit.bathrooms, unit.description, unit.rent_period || 'mois']
                    );
                }
            }
        }

        return this.findById(id);
    },

    async migrate() {
        // PostgreSQL supporte ADD COLUMN IF NOT EXISTS nativement
        const queries = [
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS equipments JSONB NULL"
        ];

        for (const sql of queries) {
            try {
                await db.query(sql);
            } catch (err) {
                console.error('Migration error:', err.message);
            }
        }
        return true;
    }
};

module.exports = Property;
