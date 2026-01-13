const User = require('../models/userModel');
const response = require('../utils/response');
const { generateToken, verifyToken, generateVerificationToken } = require('../utils/auth');
const { sendVerificationEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const authController = {
    /**
     * Signup
     */
    async signup(req, res, next) {
        try {
            const { email, password, name, phone, role, companyName } = req.body;

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return response.error(res, 'Cet e-mail est déjà utilisé.', 400);
            }

            const id = uuidv4();
            const passwordHash = await bcrypt.hash(password, 10);

            await User.create({
                id,
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
                user: { id, email, name, role }
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
            const { email, password } = req.body;

            const user = await User.findByEmail(email);
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
                    email: user.email,
                    name: profile.full_name,
                    role: profile.role
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
                    email: profile.email,
                    name: profile.full_name,
                    role: profile.role
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

            if (newPassword.length < 6) {
                return response.error(res, 'Le nouveau mot de passe doit contenir au moins 6 caractères', 400);
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
    }
};

module.exports = authController;
