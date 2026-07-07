const db = require('../src/config/db');

async function test() {
    const id = '72e6c631-e81b-453f-a714-ca994f0b3b7b';
    console.log('Verification pour l\'ID :', id);
    try {
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        console.log('Users found:', userRes.rows.length);
        if (userRes.rows.length > 0) {
            console.log(userRes.rows[0]);
        }

        const profileRes = await db.query('SELECT * FROM user_profiles WHERE id = $1', [id]);
        console.log('User Profiles found:', profileRes.rows.length);
        if (profileRes.rows.length > 0) {
            console.log(profileRes.rows[0]);
        }

        const ownerRes = await db.query('SELECT * FROM owner_profiles WHERE id = $1', [id]);
        console.log('Owner Profiles found:', ownerRes.rows.length);
        if (ownerRes.rows.length > 0) {
            console.log(ownerRes.rows[0]);
        }
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        process.exit(0);
    }
}

test();
