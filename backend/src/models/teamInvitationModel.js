const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateVerificationToken, hashToken } = require('../utils/auth');

const TeamInvitation = {
    /**
     * Crée l'invitation (ou renouvelle celle encore en attente pour ce destinataire).
     * Seule l'empreinte du jeton est stockée ; le jeton en clair n'existe que dans le lien envoyé.
     */
    async create(inviterId, email, permissions) {
        const token = generateVerificationToken();
        const tokenHash = hashToken(token);

        const { rows: [renewed] } = await db.query(`
            UPDATE team_invitations
            SET token = $3, permissions = $4, created_at = NOW(), expires_at = NOW() + INTERVAL '7 days'
            WHERE LOWER(invitee_email) = LOWER($2) AND inviter_id = $1 AND status = 'pending'
            RETURNING *
        `, [inviterId, email, tokenHash, permissions]);
        if (renewed) return { ...renewed, token };

        const { rows } = await db.query(`
            INSERT INTO team_invitations ("id", "inviter_id", "invitee_email", "token", "permissions")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [uuidv4(), inviterId, email, tokenHash, permissions]);

        return { ...rows[0], token };
    },

    async findByToken(token) {
        const { rows } = await db.query(`
            SELECT i.*, p.full_name as inviter_name
            FROM team_invitations i
            JOIN user_profiles p ON i.inviter_id = p.id
            WHERE i.token = $1 AND i.status = 'pending' AND i.expires_at > NOW()
        `, [hashToken(token)]);
        return rows[0] || null;
    },

    /**
     * Passe l'invitation de 'pending' à un autre statut. Renvoie false si elle n'était plus en attente
     * (déjà acceptée entre-temps) : une invitation ne sert qu'une fois.
     */
    async updateStatus(id, status) {
        const { rowCount } = await db.query(`
            UPDATE team_invitations SET status = $1 WHERE id = $2 AND status = 'pending'
        `, [status, id]);
        return rowCount > 0;
    },

    async migrate() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS team_invitations (
                    id UUID PRIMARY KEY,
                    inviter_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                    invitee_email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    permissions JSONB DEFAULT '{"can_view_revenue": false}',
                    status VARCHAR(50) DEFAULT 'pending', 
                    created_at TIMESTAMP DEFAULT NOW(),
                    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
                );
            `);
            return true;
        } catch (err) {
            console.error('Migration error (team_invitations):', err.message);
            return false;
        }
    }
};

module.exports = TeamInvitation;
