const axios = require('axios');
const PLANS = require('../config/plans');
const Subscription = require('../models/subscriptionModel');
const response = require('../utils/response');

const IS_TEST_MODE = process.env.PAYDUNYA_MODE === 'test';
const PAYDUNYA_BASE_URL = IS_TEST_MODE 
    ? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create'
    : 'https://app.paydunya.com/api/v1/checkout-invoice/create';

const paymentController = {
    /**
     * Initialise une demande de paiement auprès de PayDunya
     */
    async initializePayment(req, res, next) {
        try {
            const { planId, period } = req.body;
            const userId = req.user.id;

            // 1. Trouver le plan et calculer le prix
            const planKey = planId.toUpperCase();
            const plan = PLANS[planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL' ? 'PROFESSIONAL' : planKey];

            const backendUrl = process.env.BACKEND_URL || process.env.URL_BACKEND || process.env.API_URL || `https://${process.env.APP_DOMAIN}`;
            const frontendUrl = process.env.FRONTEND_URL || process.env.URL_FRONTEND || `https://${process.env.APP_DOMAIN}`;

            if (!plan || planId.toLowerCase() === 'free') {
                return response.error(res, 'Plan invalide', 400);
            }

            const price = period === 'annual' ? plan.price_annual : plan.price_monthly;
            const durationDays = period === 'annual' ? 365 : 30;

            // 2. Préparer les données pour PayDunya
            const payload = {
                invoice: {
                    items: [
                        {
                            name: `Abonnement ${plan.name} (${period === 'annual' ? 'Annuel' : 'Mensuel'})`,
                            quantity: 1,
                            unit_price: price,
                            total_price: price,
                            description: `Accès complet au plan ${plan.name} Samalocation`
                        }
                    ],
                    total_amount: price,
                    description: `Paiement abonnement ${plan.name} Samalocation`
                },
                store: {
                    name: "SamaLocation",
                    tagline: "Votre partenaire immobilier au Sénégal",
                    postal_address: "Dakar, Sénégal",
                    phone: "761629529",
                    logo_url: `${frontendUrl}/logo.png`
                },
                actions: {
                    cancel_url: `${frontendUrl}/pricing?payment=cancel`,
                    return_url: `${frontendUrl}/owner-dashboard?payment=success`,
                    callback_url: `${backendUrl}/api/payment/callback`
                },
                custom_data: {
                    userId: userId,
                    planId: planId,
                    durationDays: durationDays,
                    price: price
                }
            };

            // 3. Appeler PayDunya
            const paydunyaResponse = await axios.post(PAYDUNYA_BASE_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                    'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY,
                    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                }
            });

            if (paydunyaResponse.data.response_code === "00") {
                const token = paydunyaResponse.data.token;
                // Selon les logs, PayDunya met l'URL dans response_text
                const redirectUrl = paydunyaResponse.data.response_url ||
                    (paydunyaResponse.data.response_text.startsWith('http') ? paydunyaResponse.data.response_text : `https://paydunya.com/checkout/invoice/${token}`);

                return response.success(res, {
                    redirect_url: redirectUrl,
                    token: token
                }, 'Lien de paiement PayDunya généré');
            } else {
                console.error('PayDunya API Error:', paydunyaResponse.data);
                return response.error(res, paydunyaResponse.data.response_text || 'Erreur PayDunya', 400);
            }

        } catch (error) {
            console.error('Payment Error:', error.response?.data || error.message);
            next(error);
        }
    },

    /**
     * Reçoit la notification de PayDunya (Callback/IPN)
     */
    async handleCallback(req, res, next) {
        try {
            console.log('--- PAYDUNYA CALLBACK RECEIVED ---');
            
            let payload = req.body;
            
            // PayDunya envoie souvent les données dans un champ "data" sous forme de string JSON
            if (req.body.data && typeof req.body.data === 'string') {
                try {
                    payload = JSON.parse(req.body.data);
                    console.log('Parsed PayDunya Payload:', JSON.stringify(payload));
                } catch (e) {
                    console.error('Failed to parse PayDunya data field:', e.message);
                }
            }

            // Le token peut être à la racine ou dans invoice.token
            const token = payload.token || (payload.invoice && payload.invoice.token) || req.query.token;

            if (!token) {
                console.error('PayDunya Callback Error: Token missing in payload', JSON.stringify(req.body));
                return res.status(400).send('Token missing');
            }

            // Vérifier le statut du paiement auprès de PayDunya (Sécurité)
            const confirmBaseUrl = process.env.PAYDUNYA_MODE === 'test'
                ? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/'
                : 'https://app.paydunya.com/api/v1/checkout-invoice/confirm/';
            
            const verifyUrl = `${confirmBaseUrl}${token}`;
            console.log('Verifying payment with URL:', verifyUrl);
            
            const verifyRes = await axios.get(verifyUrl, {
                headers: {
                    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                    'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY,
                    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                }
            });

            const result = verifyRes.data;
            console.log('PayDunya Verification Response:', JSON.stringify(result));

            if (result.status === 'completed') {
                // Les données peuvent être dans result.custom_data ou payload.custom_data
                const customData = result.custom_data || payload.custom_data || {};
                const { userId, planId, durationDays, price } = customData;
                
                if (!userId) {
                    console.error('PayDunya Callback Error: userId missing in custom_data', JSON.stringify(customData));
                    return res.status(400).send('Incomplete custom_data');
                }

                console.log(`Activating subscription for User: ${userId}, Plan: ${planId}`);

                await Subscription.createSubscription(userId, {
                    planName: planId.toUpperCase(),
                    price: price || (result.invoice && result.invoice.total_amount),
                    paymentMethod: 'paydunya',
                    transactionId: token,
                    durationDays: durationDays || 30
                });

                console.log('Subscription activated successfully');
                return res.status(200).send('OK');
            }

            console.log(`Payment status is not completed: ${result.status}`);
            return res.status(200).send('Payment not completed');

        } catch (error) {
            console.error('PayDunya Callback Error:', error.message);
            if (error.response) {
                console.error('Error Details:', JSON.stringify(error.response.data));
            }
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = paymentController;
