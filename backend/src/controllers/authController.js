const User = require('../models/userModel');
const response = require('../utils/response');
const { listWorkspacesForUser } = require('../utils/workspaces');
const { generateToken, verifyToken, generateVerificationToken, hashToken, isSessionRevoked } = require('../utils/auth');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../config/db');
const { SIGNUP_ROLES, ACCOUNT_TYPES } = require('../config/roles');
const { CUSTOM_ID_LETTERS, CUSTOM_ID_LETTER_COUNT, CUSTOM_ID_MIN_DIGITS, CUSTOM_ID_MAX_DIGITS } = require('../config/customId');

// Au-delà de 72 octets, bcrypt ignore la fin du mot de passe
const MAX_PASSWORD_LENGTH = 72;

// Comparaison factice quand l'identifiant n'existe pas : le temps de réponse
// ne révèle plus si un compte existe.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

/**
 * Identifiant Samalocation : 2 lettres + 7 chiffres au départ (ex. DV6544361, ~5,8 milliards de combinaisons).
 * Il sert à retrouver un locataire lors de l'affectation : il doit être imprévisible (tirage cryptographique)
 * et facile à dicter (pas de I ni de O, confondus avec 1 et 0). Voir config/customId.js.
 * Si la base se remplit, la génération passe d'elle-même à 8, 9… chiffres, dans la limite de la colonne.
 * Les identifiants déjà attribués ne changent pas (anciens formats à 5 ou 6 chiffres conservés).
 */
const ATTEMPTS_PER_LENGTH = 10;

const randomCustomId = (digitCount) => {
    let id = '';
    for (let i = 0; i < CUSTOM_ID_LETTER_COUNT; i++) id += CUSTOM_ID_LETTERS[crypto.randomInt(CUSTOM_ID_LETTERS.length)];
    for (let i = 0; i < digitCount; i++) id += crypto.randomInt(10);
    return id;
};

// Nombre maximal de chiffres permis par la colonne réellement en base (protège si la migration n'a pas encore tourné)
let maxDigitsCache = null;
const getMaxDigits = async () => {
    if (maxDigitsCache !== null) return maxDigitsCache;
    try {
        const { rows } = await db.query(
            `SELECT MIN(character_maximum_length) AS len FROM information_schema.columns
             WHERE table_schema = 'public' AND column_name = 'custom_id' AND table_name IN ('users', 'user_profiles')`
        );
        const len = Number(rows[0]?.len) || 10;
        maxDigitsCache = Math.min(CUSTOM_ID_MAX_DIGITS, len - CUSTOM_ID_LETTER_COUNT);
    } catch {
        return 10 - CUSTOM_ID_LETTER_COUNT; // ancienne taille de colonne, sans mise en cache
    }
    return maxDigitsCache;
};

const generateCustomId = async () => {
    const maxDigits = await getMaxDigits();
    // 10 essais par longueur : 7 chiffres, puis 8, 9… si les identifiants tirés sont déjà pris
    for (let digits = CUSTOM_ID_MIN_DIGITS; digits <= maxDigits; digits++) {
        for (let attempt = 0; attempt < ATTEMPTS_PER_LENGTH; attempt++) {
            const customId = randomCustomId(digits);
            const { rows } = await db.query('SELECT 1 FROM users WHERE custom_id = $1', [customId]);
            if (rows.length === 0) return customId;
        }
        console.warn(`[ID-GEN] ${ATTEMPTS_PER_LENGTH} identifiants à ${digits} chiffres déjà pris : passage à ${digits + 1} chiffres.`);
    }
    throw new Error("Impossible de générer un identifiant unique");
};

const authController = {
    /**
     * Signup
     */
    async signup(req, res, next) {
        try {
            let { email, password, name, phone, role, accountType, companyName, referralCode } = req.body;
            email = email?.toLowerCase();

            // Seuls les rôles publics sont autorisés à l'inscription (jamais 'admin')
            if (!SIGNUP_ROLES.includes(role)) {
                return response.error(res, 'Rôle invalide.', 400);
            }

            // Type de compte : les anciens clients n'envoient que le rôle
            const account = ACCOUNT_TYPES[accountType || role];
            if (!account || account.role !== role) {
                return response.error(res, 'Type de compte invalide.', 400);
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return response.error(res, 'Cet e-mail est déjà utilisé.', 400);
            }

            if (password.length < 8 || Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) {
                return response.error(res, `Le mot de passe doit contenir entre 8 et ${MAX_PASSWORD_LENGTH} caractères.`, 400);
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
                companyName: companyName?.trim() || null,
                orgType: account.orgType || undefined,
                emailVerified: false,
                verificationToken: hashToken(verificationToken), // seul le lien e-mail contient le jeton en clair
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

                    // Trouver le plan actuel du parrain pour l'étendre plutôt que de forcer du "PREMIUM"
                    const currentParrainSub = await Subscription.findActiveByUserId(parrain.id);
                    const planToExtend = currentParrainSub?.plan_name || 'PREMIUM';

                    await Subscription.manualUpdate(parrain.id, {
                        planName: planToExtend,
                        status: 'active',
                        durationDays: 30,
                        price: 0
                    });

                    // Notification de succès pour le parrain
                    await Notification.create({
                        id: uuidv4(),
                        user_id: parrain.id,
                        type: 'system',
                        title: 'Nouveau parrainage réussi !',
                        message: `Félicitations ! Un ami s'est inscrit avec votre code. Vous profitez d'un mois de plan ${planToExtend === 'PROFESSIONAL' ? 'Professionnel' : 'Premium'} supplémentaire.`,
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

            // Mot de passe vérifié en premier, avec une comparaison factice si le compte n'existe pas :
            // ni le message ni le temps de réponse ne révèlent l'existence ou l'état d'un compte.
            const isMatch = await bcrypt.compare(String(password || ''), user?.password_hash || DUMMY_PASSWORD_HASH);
            if (!user || !isMatch) {
                return response.error(res, 'Identifiants invalides', 401);
            }

            // Ces informations ne sont données qu'au titulaire du bon mot de passe
            if (!user.email_verified) {
                return response.error(res, 'Veuillez confirmer votre adresse e-mail avant de vous connecter. Un e-mail de confirmation vous a été envoyé lors de votre inscription.', 403);
            }

            const isBlocked = await User.isBlocked(user.id);
            if (isBlocked) {
                return response.error(res, 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.', 403);
            }

            const profile = await User.findProfileById(user.id);
            if (!profile) {
                return response.error(res, 'Profil non trouvé', 404);
            }

            const token = generateToken({ id: user.id, email: user.email, role: profile.role, parentId: user.parent_id });
            const organizations = await listWorkspacesForUser(user.id);
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
                    currency: profile.currency,
                    referral_count: user.referral_count,
                    referred_by: user.referred_by,
                    organizations
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
            if (isSessionRevoked(decoded, profile)) {
                return response.error(res, 'Session expirée suite à un changement de mot de passe. Veuillez vous reconnecter.', 401);
            }
            if (profile.is_blocked) {
                return response.error(res, 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.', 403);
            }

            const organizations = await listWorkspacesForUser(profile.id);

            return response.success(res, {
                user: {
                    id: profile.id,
                    customId: profile.custom_id,
                    email: profile.email,
                    name: profile.full_name,
                    phone: profile.phone || '',
                    address: profile.address || '',
                    role: profile.role,
                    parentId: profile.parent_id,
                    setupRequired: !profile.is_setup_complete,
                    permissions: profile.permissions,
                    currency: profile.currency,
                    referral_count: profile.referral_count,
                    referred_by: profile.referred_by,
                    organizations
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Recherche d'un locataire ayant déjà un compte, pour l'affecter (route réservée à tenant.write,
     * limitée à 20 recherches par minute et par compte).
     * Uniquement par identifiant Samalocation exact, que le locataire communique lui-même : impossible de
     * lister les comptes. Seuls le nom et l'identifiant sont renvoyés ; l'email et le téléphone sont repris
     * côté serveur lors de l'affectation (tenantController.assignTenant).
     */
    async searchUsers(req, res, next) {
        try {
            // Tolère majuscules/minuscules et espaces saisis par erreur (« dv 654 4361 » → « DV6544361 »)
            const customId = String(req.query.q || '').replace(/\s+/g, '').toUpperCase();
            if (!/^[A-Z0-9]{4,20}$/.test(customId)) {
                return response.success(res, []);
            }

            const tenant = await User.findTenantByCustomId(customId);
            return response.success(res, tenant
                ? [{ id: tenant.id, custom_id: tenant.custom_id, full_name: tenant.full_name }]
                : []);
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

            if (newPassword.length < 8 || Buffer.byteLength(newPassword) > MAX_PASSWORD_LENGTH) {
                return response.error(res, `Le nouveau mot de passe doit contenir entre 8 et ${MAX_PASSWORD_LENGTH} caractères`, 400);
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

            // Horloge du serveur Node (comme le iat des JWT), pas celle de la base
            await db.query('UPDATE users SET password_hash = $1, password_changed_at = $3 WHERE id = $2', [hashedPassword, userId, new Date()]);

            // Les autres sessions sont révoquées ; cet appareil reçoit une nouvelle session
            const token = generateToken({ id: userId, email: user.email, role: req.user.role, parentId: user.parent_id });
            return response.success(res, { token }, 'Mot de passe modifié avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update my personal profile (name, phone) — accessible to all authenticated users
     */
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { name, phone } = req.body;

            if (!name || !name.trim()) {
                return response.error(res, 'Le nom est obligatoire', 400);
            }

            const db = require('../config/db');
            await db.query(
                'UPDATE user_profiles SET full_name = $1, phone = $2 WHERE id = $3',
                [name.trim(), phone || '', userId]
            );

            return response.success(res, null, 'Profil mis à jour avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Create a tenant account (Owner action)
     */
    async createTenantAccount(req, res, next) {
        try {
            const { name, phone } = req.body;
            const email = req.body.email?.trim().toLowerCase() || null;
            const finalName = name || 'Nouveau Locataire';

            // La personne a déjà un compte (locataire ailleurs, propriétaire...) : on le relie au bail
            // au lieu de créer un doublon. Elle garde ses identifiants, rien à lui transmettre.
            if (email) {
                const existing = await User.findByEmail(email);
                if (existing) {
                    const profile = await User.findProfileById(existing.id);
                    return response.success(res, {
                        id: existing.id,
                        customId: existing.custom_id,
                        name: profile?.full_name || finalName,
                        linkedExisting: true
                    }, 'Un compte existe déjà avec cet e-mail : il sera relié au bail.');
                }
            }

            // Mot de passe temporaire lisible (sans 0/O/1/I), généré de façon cryptographique
            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const tempPassword = Array.from({ length: 10 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const id = uuidv4();
            const customId = await generateCustomId();

            // Default email if none provided (placeholder)
            const userEmail = email || `${customId.toLowerCase()}@samalocation.com`;

            await User.create({
                id,
                customId,
                email: userEmail,
                passwordHash,
                name: finalName,
                phone: phone || '',
                role: 'tenant',
                isSetupComplete: false,
                // Le compte est créé par le propriétaire, l'e-mail est déjà connu :
                // on marque directement comme vérifié pour que le locataire puisse se connecter
                emailVerified: true
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

            if (newPassword.length < 8 || Buffer.byteLength(newPassword) > MAX_PASSWORD_LENGTH) {
                return response.error(res, `Le mot de passe doit contenir entre 8 et ${MAX_PASSWORD_LENGTH} caractères`, 400);
            }

            const cleanEmail = email.trim().toLowerCase();

            // Vérifier si cette adresse email est déjà utilisée par un autre compte
            const { rows: existingUsers } = await db.query(
                'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2',
                [cleanEmail, userId]
            );

            if (existingUsers.length > 0) {
                return response.error(
                    res,
                    'Cette adresse e-mail est déjà associée à un compte SamaLocation existant.',
                    400
                );
            }

            // Update profile info
            await User.finalizeProfile(userId, { name: name.trim(), email: cleanEmail, phone: phone.trim() });

            // Générer un token de vérification d'email (même mécanisme que l'inscription normale)
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date();
            verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

            // Update password + mark setup complete + reset email_verified to false.
            // password_changed_at révoque les sessions ouvertes avec le mot de passe temporaire
            // (que le propriétaire connaît).
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query(
                `UPDATE users
                 SET password_hash = $1,
                     is_setup_complete = TRUE,
                     email_verified = FALSE,
                     verification_token = $2,
                     verification_token_expires = $3,
                     password_changed_at = $5
                 WHERE id = $4`,
                [hashedPassword, hashToken(verificationToken), verificationTokenExpires, userId, new Date()]
            );

            // Synchronize name and email in tenants table
            await db.query('UPDATE tenants SET full_name = $1, email = $2, phone = $3 WHERE user_id = $4', [name, email, phone, userId]);

            // Envoyer l'email de vérification (asynchrone, ne bloque pas la réponse)
            console.log(`📧 [completeSetup] Envoi email vérification à : ${email}`);
            sendVerificationEmail(email, verificationToken).catch(err => {
                console.error('❌ Erreur envoi e-mail vérification (completeSetup) :', err);
            });

            return response.success(res, null, 'Configuration terminée ! Un e-mail de confirmation vous a été envoyé.');
        } catch (error) {
            if (error.code === '23505' && (error.constraint?.includes('email') || error.message?.includes('email'))) {
                return response.error(
                    res,
                    'Cette adresse e-mail est déjà associée à un compte SamaLocation existant.',
                    400
                );
            }
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

            await User.saveResetToken(user.id, hashToken(resetToken), expires);

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

            if (password.length < 8 || Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) {
                return response.error(res, `Le mot de passe doit contenir entre 8 et ${MAX_PASSWORD_LENGTH} caractères`, 400);
            }

            const user = await User.findByResetToken(hashToken(token));
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

            const user = await User.findByVerificationToken(hashToken(token));
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

            // Même réponse dans tous les cas : on ne révèle ni l'existence ni l'état d'un compte
            const genericMessage = 'Si votre adresse est dans notre système et n\'est pas encore confirmée, un nouvel e-mail de confirmation vous a été envoyé.';
            const user = await User.findByEmail(email);
            if (!user || user.email_verified) {
                return response.success(res, null, genericMessage);
            }

            // Génération d'un nouveau token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date();
            verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

            const db = require('../config/db');
            await db.query(
                'UPDATE public.users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
                [hashToken(verificationToken), verificationTokenExpires, user.id]
            );

            // Envoi de l'e-mail en arrière-plan
            sendVerificationEmail(user.email, verificationToken).catch(err => {
                console.error('❌ Erreur d\'envoi de l\'e-mail de vérification (renvoi) :', err);
            });

            return response.success(res, null, genericMessage);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
