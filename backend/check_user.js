const db = require('./src/config/db');

async function checkUser(email) {
    try {
        const { rows } = await db.query('SELECT id, email, role, parent_id, permissions FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        console.log('User found:', rows[0]);
        
        const { rows: invites } = await db.query('SELECT * FROM team_invitations WHERE LOWER(invitee_email) = LOWER($1)', [email]);
        console.log('Invitations for this email:', invites);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email');
    process.exit(1);
}

checkUser(email);
