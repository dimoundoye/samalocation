const db = require('../config/db');

const User = {
    /**
     * Find user by email
     */
    async findByEmail(email) {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return users[0] || null;
    },

    
    async create(userData) {
        const { id, email, passwordHash, name, phone, role, companyName } = userData;

    // Transactional approach could be better, but let's stick to our pattern
    await db.query(
        'INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, 1)',
        [id, email, passwordHash]
    );

    await db.query(
        'INSERT INTO user_profiles (id, email, full_name, phone, role) VALUES (?, ?, ?, ?, ?)',
        [id, email, name, phone, role]
    );

    if(role === 'owner') {
        await db.query(
            'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone) VALUES (?, ?, ?, ?)',
            [id, id, companyName || name, phone]
        );
        }

return { id, email, name, role };
    },

    /**
     * Get user profile by ID
     */
    async findProfileById(id) {
        const [profiles] = await db.query('SELECT * FROM user_profiles WHERE id = ?', [id]);
        return profiles[0] || null;
    },

    /**
     * Search users by name or email with optional role filter
     */
    async search(query, role = null) {
        let sql = `
            SELECT id, full_name, email, role 
            FROM user_profiles 
            WHERE full_name LIKE ? OR email LIKE ?
        `;

        const params = [`%${query}%`, `%${query}%`];

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
                u.email,
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
    }
};

module.exports = User;
