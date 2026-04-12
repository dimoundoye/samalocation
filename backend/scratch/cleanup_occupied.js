const db = require('../src/config/db');

async function cleanup() {
    console.log('--- Cleaning up occupied properties ---');
    try {
        const query = `
            UPDATE properties 
            SET is_published = false 
            WHERE id IN (
                SELECT p.id 
                FROM properties p 
                WHERE p.is_published = true 
                AND NOT EXISTS (
                    SELECT 1 FROM property_units pu 
                    WHERE pu.property_id = p.id 
                    AND pu.is_available = true
                )
            )
        `;
        const { rowCount } = await db.query(query);
        console.log(`✅ Cleanup finished: ${rowCount} properties unpublished.`);
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    } finally {
        process.exit();
    }
}

cleanup();
