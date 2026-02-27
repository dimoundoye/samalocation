const db = require('../config/db');

const User = {
    async findByEmailOrId(identifier) {
        const normalizedIdentifier = identifier?.toLowerCase();
        const { rows } = await db.query(
            'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(custom_id) = $2',
            [normalizedIdentifier, normalizedIdentifier]
        );
        return rows[0] || null;
    },

    async findByEmail(email) {
        const normalizedEmail = email?.toLowerCase();
        const { rows } = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
        return rows[0] || null;
    },

    async create(userData) {
        const { id, customId, email, passwordHash, name, phone, role, companyName, isSetupComplete = true } = userData;

        await db.query(
            'INSERT INTO users (id, custom_id, email, password_hash, email_verified, is_setup_complete) VALUES ($1, $2, $3, $4, true, $5)',
            [id, customId, email, passwordHash, isSetupComplete]
        );

        await db.query(
            'INSERT INTO user_profiles (id, custom_id, email, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, customId, email, name, phone, role]
        );

        if (role === 'owner') {
            await db.query(
                'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone) VALUES ($1, $2, $3, $4)',
                [id, id, companyName || name, phone]
            );
        }

        return { id, customId, email, name, role };
    },

    async findProfileById(id) {
        const { rows } = await db.query(`
            SELECT up.*, u.is_setup_complete 
            FROM user_profiles up
            JOIN users u ON up.id = u.id
            WHERE up.id = $1
        `, [id]);
        return rows[0] || null;
    },

    async search(query, role = null) {
        let sql = `
            SELECT id, custom_id, full_name, email, role 
            FROM user_profiles 
            WHERE full_name ILIKE $1 OR email ILIKE $2 OR custom_id ILIKE $3
        `;

        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        if (role) {
            sql += ' AND role = $4';
            params.push(role);
        }

        sql += ' LIMIT 10';

        const { rows } = await db.query(sql, params);
        return rows;
    },

    async blockUser(userId, adminId, reason) {
        await db.query(
            'UPDATE users SET is_blocked = TRUE, blocked_at = NOW(), blocked_by = $1, block_reason = $2 WHERE id = $3',
            [adminId, reason, userId]
        );
        return true;
    },

    async unblockUser(userId) {
        await db.query(
            'UPDATE users SET is_blocked = FALSE, blocked_at = NULL, blocked_by = NULL, block_reason = NULL WHERE id = $1',
            [userId]
        );
        return true;
    },

    async isBlocked(userId) {
        const { rows } = await db.query('SELECT is_blocked FROM users WHERE id = $1', [userId]);
        return rows[0]?.is_blocked || false;
    },

    async findAllWithBlockInfo() {
        const { rows } = await db.query(`
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
        return rows;
    },

    async findByVerificationToken(token) {
        const { rows } = await db.query(
            'SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
            [token]
        );
        return rows[0] || null;
    },

    async verifyEmail(userId) {
        await db.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
            [userId]
        );
        return true;
    },

    async updateSetupStatus(userId, isComplete) {
        await db.query(
            'UPDATE users SET is_setup_complete = $1 WHERE id = $2',
            [isComplete, userId]
        );
        return true;
    },

    async finalizeProfile(userId, { name, email, phone }) {
        await db.query(
            'UPDATE user_profiles SET full_name = $1, email = $2, phone = $3 WHERE id = $4',
            [name, email, phone, userId]
        );
        if (email) {
            await db.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
        }
        return true;
    },

    async saveResetToken(userId, token, expires) {
        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [token, expires, userId]
        );
    },

    async findByResetToken(token) {
        const { rows } = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        return rows[0] || null;
    },

    async updatePassword(userId, passwordHash) {
        await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );
    }
};

module.exports = User;
