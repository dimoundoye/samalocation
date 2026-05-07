const axios = require('axios');
const PLANS = require('../config/plans');
const Subscription = require('../models/subscriptionModel');
const response = require('../utils/response');

const PAYDUNYA_BASE_URL = 'https://app.paydunya.com/api/v1/checkout-invoice/create';

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
            const { token } = req.body;

            if (!token) {
                return res.status(400).send('Token missing');
            }

            // Vérifier le statut du paiement auprès de PayDunya (Sécurité)
            const verifyUrl = `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`;
            const verifyRes = await axios.get(verifyUrl, {
                headers: {
                    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                    'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY,
                    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                }
            });

            if (verifyRes.data.status === 'completed') {
                const { userId, planId, durationDays, price } = verifyRes.data.custom_data;

                await Subscription.createSubscription(userId, {
                    planName: planId.toUpperCase(),
                    price: price,
                    paymentMethod: 'paydunya',
                    transactionId: token,
                    durationDays: durationDays
                });

                return res.status(200).send('OK');
            }

            return res.status(200).send('Payment not completed');

        } catch (error) {
            console.error('PayDunya Callback Error:', error.message);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = paymentController;
