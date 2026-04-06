const Subscription = require('../models/subscriptionModel');
const response = require('../utils/response');
const Notification = require('../models/notificationModel');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const subscriptionController = {
    /**
     * Get user's active subscription
     */
    async getMySubscription(req, res, next) {
        try {
            const userId = req.user.id;
            const activeSub = await Subscription.findActiveByUserId(userId);
            const latestSub = await Subscription.findLatestByUserId(userId);
            
            // Compter les affectations actives (gérance de locataires)
            const { rows: countRows } = await db.query(`
                SELECT COUNT(*) as active_assignments 
                FROM tenants t
                JOIN property_units pu ON t.unit_id = pu.id
                JOIN properties p ON pu.property_id = p.id
                WHERE p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1)
            `, [userId]);
            const unitsCount = parseInt(countRows[0].active_assignments);

            // Get monthly receipts count
            const { rows: receiptRows } = await db.query(`
                SELECT COUNT(*) FROM receipts r
                JOIN properties p ON r.property_id = p.id
                WHERE (p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                AND EXTRACT(MONTH FROM r.created_at) = EXTRACT(MONTH FROM NOW())
                AND EXTRACT(YEAR FROM r.created_at) = EXTRACT(YEAR FROM NOW())
            `, [userId]);
            const receiptsThisMonth = parseInt(receiptRows[0].count);

            // Get referral count
            const { rows: userRows } = await db.query('SELECT referral_count FROM users WHERE id = $1', [userId]);
            const referralCount = userRows[0]?.referral_count || 0;

            // Get plan limits
            const PLANS = require('../config/plans');
            // Si on a un abonnement actif, on l'utilise. Sinon, si on a un en attente, on donne un accès provisoire.
            let planKey = 'FREE';
            if (activeSub) {
                planKey = activeSub.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE';
            } else if (latestSub && latestSub.status === 'pending') {
                planKey = latestSub.plan_name ? latestSub.plan_name.toUpperCase() : 'FREE';
            }
            
            // Normalisation pour Professionnel -> PROFESSIONAL
            if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
            
            const planConfig = PLANS[planKey] || PLANS.FREE;

            const sanitize = (val) => val === Infinity ? -1 : val;

            const subscriptionData = {
                // Show latest sub info (even if pending) for status tracking
                ...(latestSub || { plan_name: 'gratuit', status: 'active' }),
                properties_count: unitsCount, // On garde le nom de clé pour la compatibilité frontend temporaire
                properties_limit: sanitize(planConfig.limits.max_properties),
                receipts_this_month: receiptsThisMonth,
                receipts_limit: sanitize(planConfig.limits.max_receipts_per_month),
                referral_count: referralCount,
                limits: {
                    ...planConfig.limits,
                    max_properties: sanitize(planConfig.limits.max_properties),
                    max_receipts_per_month: sanitize(planConfig.limits.max_receipts_per_month),
                    ai_descriptions_per_month: sanitize(planConfig.limits.ai_descriptions_per_month)
                }
            };

            return response.success(res, subscriptionData);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Submit a payment notification (Wave)
     */
    async notifyPayment(req, res, next) {
        try {
            const userId = req.user.id;
            const { planName, price, transactionId, senderPhone } = req.body;

            if (!transactionId || transactionId.trim().length < 5) {
                return response.error(res, "L'ID de transaction est requis et doit être valide.", 400);
            }

            if (!senderPhone || senderPhone.trim().length < 7) {
                return response.error(res, "Le numéro de téléphone du transfert est requis.", 400);
            }

            const sub = await Subscription.createPending(userId, {
                planName: planName || 'PREMIUM',
                price: price || 5000,
                transactionId,
                senderPhone
            });

            // Admin notification (try-catch to avoid breaking the main process if system_admin doesn't exist)
            try {
                // Find first admin to notify
                const { rows } = await require('../config/db').query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
                const adminId = rows[0]?.id;

                if (adminId) {
                    const PlatformSettings = require('../models/settingsModel');
                    const adminPrefs = await PlatformSettings.get('admin_notifications');
                    
                    if (adminPrefs?.payments !== false) {
                        await Notification.create({
                            id: uuidv4(),
                            user_id: adminId,
                            type: 'admin_alert',
                            title: 'Nouveau Paiement à valider',
                            message: `L'utilisateur ${req.user.full_name || req.user.email} a soumis un paiement Wave (${planName}) pour validation.`,
                            link: '/admin-dashboard?tab=finances'
                        });
                    }
                }
            } catch (notifyError) {
                console.error("Failed to send admin notification:", notifyError);
            }

            return response.success(res, sub, 'Notification de paiement soumise. Votre compte sera activé sous 24h.');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = subscriptionController;
