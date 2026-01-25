const User = require('../models/userModel');
const response = require('../utils/response');
const { generateToken, verifyToken, generateVerificationToken } = require('../utils/auth');
const { sendVerificationEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { verifyTurnstileToken } = require('../utils/cloudflare');

/**
 * Generate a custom ID: 2 uppercase letters + 5 digits
 */
const generateCustomId = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let isUnique = false;
    let customId = '';

    while (!isUnique) {
        let l1 = letters.charAt(Math.floor(Math.random() * letters.length));
        let l2 = letters.charAt(Math.floor(Math.random() * letters.length));
        let n = '';
        for (let i = 0; i < 5; i++) {
            n += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        // Randomly shuffle positions? The user said "AA12345 la position peut changer"
        // Let's stick to a consistent but semi-random format or just a simple AA00000
        customId = l1 + l2 + n;

        // Check uniqueness
        const db = require('../config/db');
        const [existing] = await db.query('SELECT id FROM users WHERE custom_id = ?', [customId]);
        if (existing.length === 0) {
            isUnique = true;
        }
    }

    return customId;
};

const authController = {
    /**
     * Signup
     */
    async signup(req, res, next) {
        try {
            let { email, password, name, phone, role, companyName, turnstileToken } = req.body;
            email = email?.toLowerCase();

            // Vérification Turnstile
            const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
            if (!isHuman) {
                return response.error(res, "Veuillez confirmer que vous n'êtes pas un robot.", 403);
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return response.error(res, 'Cet e-mail est déjà utilisé.', 400);
            }

            if (password.length < 8) {
                return response.error(res, 'Le mot de passe doit contenir au moins 8 caractères.', 400);
            }

            const id = uuidv4();
            const customId = await generateCustomId();
            const passwordHash = await bcrypt.hash(password, 10);

            await User.create({
                id,
                customId,
                email,
                passwordHash,
                name,
                phone,
                role,
                companyName
            });

            const token = generateToken({ id, email, role });
            return response.success(res, {
                token,
                user: { id, customId, email, name, role }
            }, 'Compte créé avec succès !', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Login
     */
    async login(req, res, next) {
        try {
            let { email, password, turnstileToken } = req.body; // email is now identifier (email or ID)
            email = email?.toLowerCase();

            // Vérification Turnstile
            const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
            if (!isHuman) {
                return response.error(res, "Veuillez confirmer que vous n'êtes pas un robot.", 403);
            }

            const user = await User.findByEmailOrId(email);
            if (!user) {
                return response.error(res, 'Identifiants invalides', 401);
            }

            // Vérifier si l'utilisateur est bloqué
            const isBlocked = await User.isBlocked(user.id);
            if (isBlocked) {
                return response.error(res, 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.', 403);
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return response.error(res, 'Identifiants invalides', 401);
            }

            const profile = await User.findProfileById(user.id);
            if (!profile) {
                return response.error(res, 'Profil non trouvé', 404);
            }

            const token = generateToken({ id: user.id, email: user.email, role: profile.role });
            return response.success(res, {
                token,
                user: {
                    id: user.id,
                    customId: user.custom_id,
                    email: user.email,
                    name: profile.full_name,
                    role: profile.role,
                    setupRequired: !user.is_setup_complete
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get Me
     */
    async getMe(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return response.error(res, 'Non authentifié', 401);
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) {
                return response.error(res, 'Token invalide', 401);
            }

            const profile = await User.findProfileById(decoded.id);
            if (!profile) {
                return response.error(res, 'Utilisateur non trouvé', 404);
            }

            return response.success(res, {
                user: {
                    id: profile.id,
                    customId: profile.custom_id,
                    email: profile.email,
                    name: profile.full_name,
                    role: profile.role,
                    setupRequired: !profile.is_setup_complete
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Search users
     */
    async searchUsers(req, res, next) {
        try {
            const { q, role } = req.query;
            if (!q || q.trim().length < 2) {
                return response.success(res, []);
            }

            const results = await User.search(q, role);
            return response.success(res, results);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Changer le mot de passe
     */
    async changePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return response.error(res, 'L\'ancien et le nouveau mot de passe sont requis', 400);
            }

            if (newPassword.length < 8) {
                return response.error(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
            }

            const db = require('../config/db');
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

            if (!users || users.length === 0) {
                return response.error(res, 'Utilisateur non trouvé', 404);
            }

            const user = users[0];

            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return response.error(res, 'L\'ancien mot de passe est incorrect', 401);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

            return response.success(res, null, 'Mot de passe modifié avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Create a tenant account (Owner action)
     */
    async createTenantAccount(req, res, next) {
        try {
            const { name, email, phone } = req.body;
            const finalName = name || 'Nouveau Locataire';

            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const id = uuidv4();
            const customId = await generateCustomId();

            // Default email if none provided (placeholder)
            const userEmail = email || `${customId.toLowerCase()}@samalocation.sn`;

            await User.create({
                id,
                customId,
                email: userEmail,
                passwordHash,
                name: finalName,
                phone: phone || '',
                role: 'tenant',
                isSetupComplete: false
            });

            return response.success(res, {
                id,
                customId,
                tempPassword,
                name: finalName
            }, 'Compte locataire créé avec succès', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Complete setup (Tenant action)
     */
    async completeSetup(req, res, next) {
        try {
            const userId = req.user.id;
            const { name, email, phone, newPassword } = req.body;

            if (!name || !email || !phone || !newPassword) {
                return response.error(res, 'Toutes les informations sont requises', 400);
            }

            if (newPassword.length < 8) {
                return response.error(res, 'Le mot de passe doit contenir au moins 8 caractères', 400);
            }

            // Update profile
            await User.finalizeProfile(userId, { name, email, phone });

            // Update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const db = require('../config/db');
            await db.query('UPDATE users SET password_hash = ?, is_setup_complete = TRUE WHERE id = ?', [hashedPassword, userId]);

            // Synchronize name and email in tenants table
            await db.query('UPDATE tenants SET full_name = ?, email = ?, phone = ? WHERE user_id = ?', [name, email, phone, userId]);

            return response.success(res, null, 'Configuration terminée avec succès');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
