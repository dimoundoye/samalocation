const db = require('../config/db');

const User = {
    /**
     * Find user by email
     */
    async findByEmailOrId(identifier) {
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? OR custom_id = ?',
            [identifier, identifier]
        );
        return users[0] || null;
    },

    async findByEmail(email) {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return users[0] || null;
    },


    async create(userData) {
        const { id, customId, email, passwordHash, name, phone, role, companyName, isSetupComplete = true } = userData;

        // Transactional approach could be better, but let's stick to our pattern
        await db.query(
            'INSERT INTO users (id, custom_id, email, password_hash, email_verified, is_setup_complete) VALUES (?, ?, ?, ?, 1, ?)',
            [id, customId, email, passwordHash, isSetupComplete]
        );

        await db.query(
            'INSERT INTO user_profiles (id, custom_id, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, customId, email, name, phone, role]
        );

        if (role === 'owner') {
            await db.query(
                'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone) VALUES (?, ?, ?, ?)',
                [id, id, companyName || name, phone]
            );
        }

        return { id, customId, email, name, role };
    },

    /**
     * Get user profile by ID
     */
    async findProfileById(id) {
        const [profiles] = await db.query(`
            SELECT up.*, u.is_setup_complete 
            FROM user_profiles up
            JOIN users u ON up.id = u.id
            WHERE up.id = ?
        `, [id]);
        return profiles[0] || null;
    },

    /**
     * Search users by name or email with optional role filter
     */
    async search(query, role = null) {
        let sql = `
            SELECT id, custom_id, full_name, email, role 
            FROM user_profiles 
            WHERE full_name LIKE ? OR email LIKE ? OR custom_id LIKE ?
        `;

        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        if (role) {
            sql += ' AND role = ?';
            params.push(role);
        }

        sql += ' LIMIT 10';

        const [profiles] = await db.query(sql, params);
        return profiles;
    },

    /**
     * Bloquer un utilisateur
     */
    async blockUser(userId, adminId, reason) {
        await db.query(
            'UPDATE users SET is_blocked = TRUE, blocked_at = NOW(), blocked_by = ?, block_reason = ? WHERE id = ?',
            [adminId, reason, userId]
        );
        return true;
    },

    /**
     * Débloquer un utilisateur
     */
    async unblockUser(userId) {
        await db.query(
            'UPDATE users SET is_blocked = FALSE, blocked_at = NULL, blocked_by = NULL, block_reason = NULL WHERE id = ?',
            [userId]
        );
        return true;
    },

    /**
     * Vérifier si un utilisateur est bloqué
     */
    async isBlocked(userId) {
        const [users] = await db.query('SELECT is_blocked FROM users WHERE id = ?', [userId]);
        return users[0]?.is_blocked || false;
    },

    /**
     * Obtenir tous les utilisateurs avec leurs informations de blocage
     */
    async findAllWithBlockInfo() {
        const [users] = await db.query(`
            SELECT 
                u.id,
                u.custom_id,
                u.email,
                u.is_setup_complete,
                u.created_at,
                u.is_blocked,
                u.blocked_at,
                u.block_reason,
                up.full_name,
                up.role,
                admin_profile.full_name as blocked_by_name
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.id
            LEFT JOIN user_profiles admin_profile ON u.blocked_by = admin_profile.id
            ORDER BY u.created_at DESC
        `);
        return users;
    },

    /**
     * Trouver un utilisateur par son token de vérification
     */
    async findByVerificationToken(token) {
        const [users] = await db.query(
            'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
            [token]
        );
        return users[0] || null;
    },

    /**
     * Marquer l'e-mail comme vérifié
     */
    async verifyEmail(userId) {
        await db.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
            [userId]
        );
        return true;
    },
    /**
     * Marquer la configuration comme terminée
     */
    async updateSetupStatus(userId, isComplete) {
        await db.query(
            'UPDATE users SET is_setup_complete = ? WHERE id = ?',
            [isComplete, userId]
        );
        return true;
    },

    /**
     * Mettre à jour les infos de base lors de la configuration
     */
    async finalizeProfile(userId, { name, email, phone }) {
        await db.query(
            'UPDATE user_profiles SET full_name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone, userId]
        );
        // Also update the email in the 'users' table if changed
        if (email) {
            await db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
        }
        return true;
    }
};

module.exports = User;
