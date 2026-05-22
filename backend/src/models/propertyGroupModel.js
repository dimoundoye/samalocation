const db = require('../config/db');

const PropertyGroup = {
    async findAllByOwnerId(ownerId) {
        const { rows } = await db.query(
            'SELECT id, name, property_ids as "propertyIds", parent_id as "parentId" FROM property_groups WHERE owner_id = $1 ORDER BY created_at ASC',
            [ownerId]
        );
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            propertyIds: r.propertyIds || [],
            parentId: r.parentId || undefined
        }));
    },

    async bulkSync(ownerId, groups) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete all existing groups for this owner
            await client.query('DELETE FROM property_groups WHERE owner_id = $1', [ownerId]);

            // 2. Insert new groups
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    await client.query(
                        `INSERT INTO property_groups (id, owner_id, name, property_ids, parent_id) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            group.id, 
                            ownerId, 
                            group.name, 
                            JSON.stringify(group.propertyIds || []), 
                            group.parentId || null
                        ]
                    );
                }
            }

            await client.query('COMMIT');
            return this.findAllByOwnerId(ownerId);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in PropertyGroup.bulkSync:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    async migrate() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS property_groups (
                id VARCHAR(50) PRIMARY KEY,
                owner_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                property_ids JSONB DEFAULT '[]'::jsonb,
                parent_id VARCHAR(50) NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE INDEX IF NOT EXISTS idx_property_groups_owner_id ON property_groups(owner_id)`
        ];

        for (const sql of queries) {
            try {
                await db.query(sql);
            } catch (err) {
                console.error('Migration error (property_groups):', err.message);
            }
        }
        return true;
    }
};

module.exports = PropertyGroup;
