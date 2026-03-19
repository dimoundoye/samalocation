const path = require('path');
// Utiliser un chemin absolu pour éviter les erreurs de require
const db = require(path.join(__dirname, '../backend/src/config/db'));

async function cleanup() {
    try {
        console.log("Cleanup script started...");
        console.log("🧹 Cleaning up duplicate pending subscriptions...");
        
        // Trouver les souscriptions 'pending' qui ont une souscription 'active' plus récente pour le même utilisateur
        const { rows: toUpdate } = await db.query(`
            SELECT s1.id 
            FROM subscriptions s1
            WHERE s1.status = 'pending'
            AND EXISTS (
                SELECT 1 FROM subscriptions s2 
                WHERE s2.user_id = s1.user_id 
                AND s2.status = 'active' 
                AND s2.created_at > s1.created_at
            )
        `);

        console.log(`🔍 Found ${toUpdate.length} pending subscriptions to clean up.`);

        for (const row of toUpdate) {
            console.log(`Updating subscription ${row.id}...`);
            await db.query("UPDATE subscriptions SET status = 'active', payment_method = 'manual_admin_approval' WHERE id = $1", [row.id]);
        }

        console.log("✅ Cleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
    }
}

cleanup();
