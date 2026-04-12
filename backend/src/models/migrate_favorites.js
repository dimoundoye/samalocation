const db = require('../config/db');

async function migrateFavorites() {
    console.log('--- Migration: Favorites ---');
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                property_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, property_id)
            )
        `);
        console.log('✅ Table "favorites" created or already exists.');
        
        // Add index for faster lookups
        await db.query('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id)');
        
        console.log('✅ Indexes for "favorites" added.');
    } catch (error) {
        console.error('❌ Migration Error (Favorites):', error.message);
    }
}

if (require.main === module) {
    migrateFavorites().then(() => process.exit(0));
}

module.exports = migrateFavorites;
