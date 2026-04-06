const axios = require('axios');
const PLANS = require('../config/plans');
const Subscription = require('../models/subscriptionModel');
const response = require('../utils/response');
const db = require('../config/db');

const PAYTECH_BASE_URL = 'https://paytech.sn/api/payment/request-payment';

const paymentController = {
    /**
     * Initialise une demande de paiement auprès de PayTech
     */
    async initializePayment(req, res, next) {
        try {
            const { planId, period } = req.body; // period: 'monthly' or 'annual'
            const userId = req.user.id;

            // 1. Trouver le plan et calculer le prix
            const planKey = planId.toUpperCase();
            const plan = PLANS[planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL' ? 'PROFESSIONAL' : planKey];

            const backendUrl = process.env.BACKEND_URL || process.env.URL_BACKEND || process.env.API_URL;
            const frontendUrl = process.env.FRONTEND_URL || process.env.URL_FRONTEND;

            console.log('--- Debug Environnement ---');
            console.log('BACKEND_URL env:', process.env.BACKEND_URL);
            console.log('URL_BACKEND env:', process.env.URL_BACKEND);
            console.log('Final Backend URL selected:', backendUrl);
            console.log('---------------------------');

            if (!plan || planId.toLowerCase() === 'free') {
                return response.error(res, 'Plan invalide', 400);
            }

            const price = period === 'annual' ? plan.price_annual : plan.price_monthly;
            const durationDays = period === 'annual' ? 365 : 30;
            
            // 2. Générer une référence unique
            const refCommand = `SUB-${Date.now()}-${userId}`;

            // 3. Préparer les données
            const payload = {
                item_name: `Abonnement ${plan.name} (${period === 'annual' ? 'Annuel' : 'Mensuel'})`,
                item_price: price,
                currency: 'XOF',
                ref_command: refCommand,
                command_name: `Paiement abonnement ${plan.name} SamaLocation`,
                env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
                success_url: `${frontendUrl}/dashboard?payment=success`,
                cancel_url: `${frontendUrl}/pricing?payment=cancel`,
                ipn_url: `${backendUrl}/api/payment/ipn`,
                custom_field: JSON.stringify({
                    userId: userId,
                    planId: planId,
                    durationDays: durationDays,
                    price: price
                })
            };

            console.log('Payload to PayTech:', JSON.stringify(payload, null, 2));

            // 4. Appeler PayTech
            const paytechResponse = await axios.post(PAYTECH_BASE_URL, payload, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'API_KEY': process.env.PAYTECH_API_KEY,
                    'API_SECRET': process.env.PAYTECH_API_SECRET
                }
            });

            if (paytechResponse.data.success === 1) {
                // On enregistre la tentative en base de données
                await db.query(`
                    INSERT INTO subscriptions (
                        user_id, plan_name, status, price, 
                        payment_method, transaction_id, created_at
                    ) 
                    VALUES ($1, $2, 'pending', $3, 'paytech', $4, NOW())
                `, [userId, planKey, price, refCommand]);

                return response.success(res, {
                    redirect_url: paytechResponse.data.redirect_url,
                    token: paytechResponse.data.token
                }, 'Lien de paiement généré');
            } else {
                console.error('PayTech Error:', paytechResponse.data);
                return response.error(res, 'Erreur lors de la génération du lien de paiement', 500);
            }

        } catch (error) {
            console.error('Payment Error:', error.response?.data || error.message);
            next(error);
        }
    },

    /**
     * Reçoit la notification de PayTech (IPN)
     */
    async handleIPN(req, res, next) {
        try {
            const {
                type_event,
                ref_command,
                item_price,
                custom_field,
                token,
                api_key_sha256,
                api_secret_sha256
            } = req.body;

            console.log('🔔 Received IPN from PayTech:', { ref_command, type_event });

            // 1. Vérification de sécurité (facultatif mais recommandé si PayTech envoie les hash)
            // Note: PayTech envoie le corps de la requête. On peut vérifier que c'est bien valide.
            if (type_event !== 'sale_complete') {
                return res.status(200).send('Event ignored');
            }

            // 2. Extraire les données du custom_field
            let userData = {};
            try {
                userData = JSON.parse(custom_field);
            } catch (e) {
                console.error('Error parsing custom_field:', e);
                return res.status(400).send('Invalid custom_field');
            }

            const { userId, planId, durationDays, price } = userData;

            // 3. Valider l'abonnement en base de données
            // On utilise la méthode existante du modèle Subscription
            await Subscription.createSubscription(userId, {
                planName: planId.toUpperCase(),
                price: price,
                paymentMethod: 'paytech',
                transactionId: token || ref_command,
                durationDays: durationDays
            });

            console.log(`✅ Subscription activated for user ${userId} (${planId})`);

            // 4. Répondre à PayTech 200 OK
            return res.status(200).json({ success: 1 });

        } catch (error) {
            console.error('IPN Error:', error.message);
            // On renvoie quand même 200 ou 500 selon si on veut que PayTech réessaye
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = paymentController;
