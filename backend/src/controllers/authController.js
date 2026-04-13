const User = require('../models/userModel');
const response = require('../utils/response');
const { generateToken, verifyToken, generateVerificationToken } = require('../utils/auth');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../config/db');

/**
 * Generate a custom ID: 2 uppercase letters + 5 digits
 */
const generateCustomId = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let isUnique = false;
    let customId = '';
    let digitCount = 5; // On commence à 5 chiffres
    let attemptsForCurrentCount = 0;
    const MAX_LENGTH = 10; // Limite de la colonne VARCHAR(10)

    while (!isUnique) {
        attemptsForCurrentCount++;
        
        // Si on échoue trop souvent avec le nombre actuel de chiffres, on passe au cran au-dessus
        // On augmente le nombre de chiffres tous les 10 échecs
        if (attemptsForCurrentCount > 10) {
            digitCount++;
            attemptsForCurrentCount = 0; // On reset les tentatives pour le nouveau palier
            
            // Sécurité pour ne pas dépasser la taille de la colonne en base (2 lettres + 8 chiffres = 10)
            if (digitCount > 8) {
                console.error('[ID-GEN] Alerte ! Le nombre de chiffres dépasse les capacités de la base.');
                // En dernier recours, on utilise un timestamp pour forcer l'unicité
                customId = 'XX' + Date.now().toString().slice(-8);
                isUnique = true;
                break;
            }
        }

        let l1 = letters.charAt(Math.floor(Math.random() * letters.length));
        let l2 = letters.charAt(Math.floor(Math.random() * letters.length));
        let n = '';
        for (let i = 0; i < digitCount; i++) {
            n += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        customId = l1 + l2 + n;

        // Vérification de l'unicité en base
        const { rows } = await db.query('SELECT id FROM users WHERE custom_id = $1', [customId]);
        if (rows.length === 0) {
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
            let { email, password, name, phone, role, companyName, referralCode } = req.body;
            email = email?.toLowerCase();

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

            // Génération d'un token de vérification e-mail
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date();
            verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // Valide 24h

            // Gestion du parrainage (Referral)
            let referredBy = null;
            let parrain = null;
            if (referralCode) {
                parrain = await User.findByEmailOrId(referralCode);
                
                if (!parrain) {
                    return response.error(res, 'Code de parrainage invalide.', 400);
                }
                
                referredBy = parrain.custom_id;
            }

            await User.create({
                id,
                customId,
                email,
                passwordHash,
                name,
                phone,
                role,
                companyName,
                emailVerified: false,
                verificationToken,
                verificationTokenExpires,
                referredBy
            });

            // Si parrainage fourni, on offre au moins 1 mois au Filleul (Nouveau user)
            if (parrain && referredBy) {
                const Subscription = require('../models/subscriptionModel');
                const Notification = require('../models/notificationModel');
                
                // 1. Offrir 1 mois au Parrain (Max 5)
                const parrainReferralCount = parseInt(parrain.referral_count || 0);

                if (parrainReferralCount < 5) {
                    await db.query('UPDATE users SET referral_count = referral_count + 1 WHERE id = $1', [parrain.id]);
                    await Subscription.manualUpdate(parrain.id, {
                        planName: 'PREMIUM',
                        status: 'active',
                        durationDays: 30,
                        price: 0
                    });

                    // Notification de succès pour le parrain
                    await Notification.create({
                        id: require('uuid').v4(),
                        user_id: parrain.id,
                        type: 'system',
                        title: 'Nouveau parrainage réussi !',
                        message: `Félicitations ! Un ami s'est inscrit avec votre code. Vous profitez d'un mois de plan Premium supplémentaire.`,
                        link: '/owner-dashboard?tab=subscription'
                    });
                } else {
                    // Notification "Limite atteinte" pour le parrain
                    await Notification.create({
                        id: require('uuid').v4(),
                        user_id: parrain.id,
                        type: 'system',
                        title: 'Parrainage réussi (Limite atteinte)',
                        message: `Un ami vient de s'inscrire avec votre code. Merci ! Votre quota de bonus est de 5 mois maximum, mais votre ami profite bien de son mois offert.`,
                        link: '/owner-dashboard?tab=subscription'
                    });
                }

                // 2. Offrir 1 mois au Filleul quoi qu'il arrive (Cadeau de bienvenue)
                await Subscription.manualUpdate(id, {
                    planName: 'PREMIUM',
                    status: 'active',
                    durationDays: 30,
                    price: 0
                });
            }

            // Envoi de l'e-mail de vérification (asynchrone)
            sendVerificationEmail(email, verificationToken).catch(err => {
                console.error('❌ Erreur d\'envoi de l\'e-mail de bienvenue/vérification :', err);
            });

            // On ne retourne plus le token pour empêcher la connexion automatique tant que le compte n'est pas vérifié
            return response.success(res, {
                user: { id, customId, email, name, role, emailVerified: false, referral_count: 0, referred_by: referredBy }
            }, 'Compte créé avec succès ! Un e-mail de confirmation vous a été envoyé.', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Login
     */
    async login(req, res, next) {
        try {
            let { email, password } = req.body; // email is now identifier (email or ID)
            email = email?.toLowerCase();

            const user = await User.findByEmailOrId(email);
            if (!user) {
                return response.error(res, 'Identifiants invalides', 401);
            }

            // Vérifier si l'e-mail est vérifié
            if (!user.email_verified) {
                return response.error(res, 'Veuillez confirmer votre adresse e-mail avant de vous connecter. Un e-mail de confirmation vous a été envoyé lors de votre inscription.', 403);
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

            const token = generateToken({ id: user.id, email: user.email, role: profile.role, parentId: user.parent_id });
            return response.success(res, {
                token,
                user: {
                    id: user.id,
                    customId: user.custom_id,
                    email: user.email,
                    name: profile.full_name,
                    role: profile.role,
                    parentId: user.parent_id,
                    setupRequired: !user.is_setup_complete,
                    permissions: profile.permissions,
                    referral_count: user.referral_count,
                    referred_by: user.referred_by
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
                    parentId: profile.parent_id,
                    setupRequired: !profile.is_setup_complete,
                    permissions: profile.permissions
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
            const { rows: users } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

            if (!users || users.length === 0) {
                return response.error(res, 'Utilisateur non trouvé', 404);
            }

            const user = users[0];

            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return response.error(res, 'L\'ancien mot de passe est incorrect', 401);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

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
            await db.query('UPDATE users SET password_hash = $1, is_setup_complete = TRUE WHERE id = $2', [hashedPassword, userId]);

            // Synchronize name and email in tenants table
            await db.query('UPDATE tenants SET full_name = $1, email = $2, phone = $3 WHERE user_id = $4', [name, email, phone, userId]);

            return response.success(res, null, 'Configuration terminée avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Forgot Password
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return response.error(res, 'Email est requis', 400);
            }

            const user = await User.findByEmail(email);
            if (!user) {
                // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
                return response.success(res, null, 'Si votre adresse est dans notre système, vous recevrez un lien de réinitialisation.');
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date();
            expires.setHours(expires.getHours() + 1); // Expire dans 1 heure

            await User.saveResetToken(user.id, resetToken, expires);
            
            // On envoie l'e-mail en arrière-plan pour ne pas bloquer l'utilisateur
            sendResetPasswordEmail(user.email, resetToken).catch(err => {
                console.error('❌ Erreur d\'envoi d\'e-mail en arrière-plan:', err);
            });

            return response.success(res, null, 'Si votre adresse est dans notre système, vous recevrez un lien de réinitialisation.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Reset Password
     */
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                return response.error(res, 'Token et mot de passe sont requis', 400);
            }

            if (password.length < 8) {
                return response.error(res, 'Le mot de passe doit contenir au moins 8 caractères', 400);
            }

            const user = await User.findByResetToken(token);
            if (!user) {
                return response.error(res, 'Token invalide ou expiré', 400);
            }

            const hash = await bcrypt.hash(password, 10);
            await User.updatePassword(user.id, hash);

            return response.success(res, null, 'Votre mot de passe a été réinitialisé avec succès.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify e-mail
     */
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.query;
            if (!token) {
                return response.error(res, 'Le token de vérification est requis.', 400);
            }

            const user = await User.findByVerificationToken(token);
            if (!user) {
                return response.error(res, 'Le lien est invalide ou a expiré.', 400);
            }

            await User.verifyEmail(user.id);

            return response.success(res, null, 'E-mail vérifié avec succès ! Votre compte est maintenant activé.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Resend verification e-mail
     */
    async resendVerification(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return response.error(res, 'Email est requis', 400);
            }

            const user = await User.findByEmail(email);
            if (!user) {
                // Pour des raisons de sécurité, on renvoie un succès même si l'utilisateur n'existe pas
                return response.success(res, null, 'Si votre adresse est dans notre système, un nouvel e-mail de confirmation vous a été envoyé.');
            }

            if (user.email_verified) {
                return response.error(res, 'Cet e-mail est déjà vérifié.', 400);
            }

            // Génération d'un nouveau token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date();
            verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

            const db = require('../config/db');
            await db.query(
                'UPDATE public.users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
                [verificationToken, verificationTokenExpires, user.id]
            );

            // Envoi de l'e-mail en arrière-plan
            sendVerificationEmail(user.email, verificationToken).catch(err => {
                console.error('❌ Erreur d\'envoi de l\'e-mail de vérification (renvoi) :', err);
            });

            return response.success(res, null, 'Un nouvel e-mail de confirmation vous a été envoyé.');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
