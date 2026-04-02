const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const TeamInvitation = {
    async create(inviterId, email, permissions) {
        const id = uuidv4();
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        console.log(`[TeamInvitation] Creating invitation: inviter=${inviterId}, email=${email}, token=${token}`);
        
        const { rows } = await db.query(`
            INSERT INTO team_invitations ("id", "inviter_id", "invitee_email", "token", "permissions")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [id, inviterId, email, token, permissions]);
        
        return rows[0];
    },

    async findByToken(token) {
        const { rows } = await db.query(`
            SELECT i.*, p.full_name as inviter_name
            FROM team_invitations i
            JOIN user_profiles p ON i.inviter_id = p.id
            WHERE i.token = $1 AND i.status = 'pending' AND i.expires_at > NOW()
        `, [token]);
        return rows[0] || null;
    },

    async findByEmailAndInviter(email, inviterId) {
        const { rows } = await db.query(`
            SELECT * FROM team_invitations
            WHERE LOWER(invitee_email) = LOWER($1) AND inviter_id = $2 AND status = 'pending'
        `, [email, inviterId]);
        return rows[0] || null;
    },

    async updateStatus(id, status) {
        await db.query(`
            UPDATE team_invitations SET status = $1 WHERE id = $2
        `, [status, id]);
    }
};

module.exports = TeamInvitation;
