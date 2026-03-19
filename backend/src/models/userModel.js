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
        const { rows } = await db.query(`
            SELECT u.*, up.role 
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.id
            WHERE LOWER(u.email) = $1
        `, [normalizedEmail]);
        return rows[0] || null;
    },

    async create(userData) {
        const { id, customId, email, passwordHash, name, phone, role, companyName, isSetupComplete = true, parentId = null, permissions = { can_view_revenue: false } } = userData;

        await db.query(
            'INSERT INTO users (id, custom_id, email, password_hash, email_verified, is_setup_complete, parent_id, permissions) VALUES ($1, $2, $3, $4, true, $5, $6, $7)',
            [id, customId, email, passwordHash, isSetupComplete, parentId, JSON.stringify(permissions)]
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
            SELECT up.*, u.is_setup_complete, u.parent_id, u.permissions
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
                u.custom_id as "customId",
                u.email,
                u.is_setup_complete,
                u.created_at,
                u.is_blocked,
                u.blocked_at,
                u.block_reason,
                u.parent_id,
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
            'SELECT * FROM public.users WHERE verification_token = $1 AND verification_token_expires > NOW()',
            [token]
        );
        return rows[0] || null;
    },

    async verifyEmail(userId) {
        await db.query(
            'UPDATE public.users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
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
            'UPDATE public.users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [token, expires, userId]
        );
    },

    async findByResetToken(token) {
        const { rows } = await db.query(
            'SELECT * FROM public.users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        return rows[0] || null;
    },

    async updatePassword(userId, passwordHash) {
        await db.query(
            'UPDATE public.users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );
    },

    async findCollaboratorsByParentId(parentId) {
        const { rows } = await db.query(`
            SELECT u.id, u.email, up.full_name, up.role, u.created_at, u.permissions
            FROM users u
            JOIN user_profiles up ON u.id = up.id
            WHERE u.parent_id = $1
        `, [parentId]);
        return rows;
    },

    async updateParentId(userId, parentId) {
        await db.query(`
            UPDATE users 
            SET parent_id = $1 
            WHERE id = $2
        `, [parentId, userId]);
    },

    async updatePermissions(userId, permissions) {
        await db.query(`
            UPDATE users 
            SET permissions = $1 
            WHERE id = $2
        `, [JSON.stringify(permissions), userId]);
    },

    async removeCollaborator(userId, parentId) {
        // We don't delete the user, just detach them from the team
        await db.query(`
            UPDATE users 
            SET parent_id = NULL 
            WHERE id = $1 AND parent_id = $2
        `, [userId, parentId]);
    },

    async delete(userId) {
        const profile = await this.findProfileById(userId);
        if (!profile) return false;

        // Si c'est un locataire, on utilise la logique de Tenant.delete s'il y a une liaison
        if (profile.role === 'tenant') {
            const { rows: tenants } = await db.query('SELECT id FROM tenants WHERE user_id = $1', [userId]);
            const Tenant = require('./tenantModel');
            for (const t of tenants) {
                await Tenant.delete(t.id);
            }
        }

        // Si c'est un propriétaire
        if (profile.role === 'owner') {
            // 1. Supprimer ses biens (cela devrait cascader ou être géré)
            const { rows: properties } = await db.query('SELECT id FROM properties WHERE owner_id = $1', [userId]);
            for (const p of properties) {
                await db.query('DELETE FROM property_units WHERE property_id = $1', [p.id]);
                await db.query('DELETE FROM properties WHERE id = $1', [p.id]);
            }

            // 2. Supprimer son profil propriétaire
            await db.query('DELETE FROM owner_profiles WHERE user_profile_id = $1', [userId]);
        }

        // Communs
        await db.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
        await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM ai_usage_logs WHERE user_id = $1', [userId]);

        // Enfin l'utilisateur et son profil
        await db.query('DELETE FROM user_profiles WHERE id = $1', [userId]);
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        return true;
    }
};

module.exports = User;
