const pool = require('./src/config/db');

async function repair() {
    try {
        console.log('--- DATA REPAIR START ---');

        // 1. Identify properties with owner_profile_id as owner_id
        const [mismatched] = await pool.query(`
            SELECT p.id, p.name, p.owner_id as current_owner_id, op.user_profile_id
            FROM properties p
            JOIN owner_profiles op ON p.owner_id = op.id
        `);

        console.log(`Found ${mismatched.length} properties with owner_profile_id mismatch.`);

        if (mismatched.length > 0) {
            // 2. Perform the update
            const [result] = await pool.query(`
                UPDATE properties p 
                JOIN owner_profiles op ON p.owner_id = op.id 
                SET p.owner_id = op.user_profile_id
            `);
            console.log(`Successfully repaired ${result.affectedRows} property records.`);
        } else {
            console.log('No repairs needed for properties table.');
        }

        console.log('--- DATA REPAIR END ---');
        process.exit(0);
    } catch (error) {
        console.error('REPAIR ERROR:', error);
        process.exit(1);
    }
}

repair();
