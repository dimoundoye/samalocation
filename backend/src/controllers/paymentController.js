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
                env: process.env.PAYTECH_ENV || (process.env.NODE_ENV === 'production' ? 'prod' : 'test'),
                success_url: `${frontendUrl}/owner-dashboard?payment=success`,
                cancel_url: `${frontendUrl}/pricing?payment=cancel`,
                ipn_url: `${backendUrl}/api/payment/ipn`,
                custom_field: JSON.stringify({
                    userId: userId,
                    planId: planId,
                    durationDays: durationDays,
                    price: price
                })
            };

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
                return response.success(res, {
                    redirect_url: paytechResponse.data.redirect_url,
                    token: paytechResponse.data.token
                }, 'Lien de paiement généré');
            } else {
                console.error('PayTech API Error:', paytechResponse.data);
                return response.error(res, paytechResponse.data.message || 'Erreur lors de la génération du lien de paiement', 400);
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
            } = req.body;

            if (type_event !== 'sale_complete') {
                return res.status(200).send('Event ignored');
            }

            let userData = {};
            try {
                userData = JSON.parse(custom_field);
            } catch (e) {
                console.error('Error parsing custom_field:', e);
                return res.status(400).send('Invalid custom_field');
            }

            const { userId, planId, durationDays, price } = userData;

            await Subscription.createSubscription(userId, {
                planName: planId.toUpperCase(),
                price: price,
                paymentMethod: 'paytech',
                transactionId: token || ref_command,
                durationDays: durationDays
            });

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
