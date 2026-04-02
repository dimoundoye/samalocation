const db = require('./src/config/db');
const TeamInvitation = require('./src/models/teamInvitationModel');

async function test() {
    try {
        console.log('Testing TeamInvitation.create...');
        // Find a valid user ID first
        const { rows: users } = await db.query('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
            console.log('No users found to test with.');
            return;
        }
        const userId = users[0].id;
        
        const invite = await TeamInvitation.create(userId, 'test@example.com', { can_view_revenue: true });
        console.log('Invite created successfully:', invite);
        
        const found = await TeamInvitation.findByToken(invite.token);
        console.log('Invite found by token:', found);
        
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

test();
