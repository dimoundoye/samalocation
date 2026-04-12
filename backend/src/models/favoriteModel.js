const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Favorite = {
    async add(userId, propertyId) {
        const id = uuidv4();
        try {
            await db.query(
                'INSERT INTO favorites (id, user_id, property_id) VALUES ($1, $2::UUID, $3::UUID) ON CONFLICT (user_id, property_id) DO NOTHING',
                [id, userId, propertyId]
            );
            return true;
        } catch (error) {
            console.error('Error adding favorite:', error.message);
            throw error;
        }
    },

    async remove(userId, propertyId) {
        try {
            await db.query(
                'DELETE FROM favorites WHERE user_id = $1::UUID AND property_id = $2::UUID',
                [userId, propertyId]
            );
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error.message);
            throw error;
        }
    },

    async findByUser(userId) {
        try {
            const { rows } = await db.query(`
                SELECT p.*
                FROM properties p
                JOIN favorites f ON p.id = f.property_id::TEXT
                WHERE f.user_id = $1::UUID
                ORDER BY f.created_at DESC
            `, [userId]);

            if (rows.length === 0) return [];

            const propertyIds = rows.map(r => r.id);

            // Get units for these properties
            const { rows: allUnits } = await db.query(
                'SELECT * FROM property_units WHERE property_id = ANY($1)',
                [propertyIds]
            );

            // Get owner profiles
            const ownerIds = [...new Set(rows.map(r => r.owner_id))];
            let allOwnerProfiles = [];
            if (ownerIds.length > 0) {
                const { rows: profiles } = await db.query(`
                    SELECT user_profile_id, company_name, phone, phone as contact_phone, verification_status, is_verified
                    FROM owner_profiles 
                    WHERE user_profile_id = ANY($1) OR id = ANY($1)
                `, [ownerIds]);
                allOwnerProfiles = profiles;
            }

            return rows.map(row => ({
                ...row,
                property_units: allUnits.filter(u => u.property_id === row.id),
                owner_profiles: allOwnerProfiles.filter(o => o.user_profile_id === row.owner_id || o.id === row.owner_id)
            }));
        } catch (error) {
            console.error('Error fetching favorites:', error.message);
            throw error;
        }
    },

    async isFavorite(userId, propertyId) {
        try {
            const { rows } = await db.query(
                'SELECT 1 FROM favorites WHERE user_id = $1::UUID AND property_id = $2::UUID',
                [userId, propertyId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking favorite status:', error.message);
            return false;
        }
    }
};

module.exports = Favorite;
