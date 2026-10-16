const axios = require('axios');
const PLANS = require('../config/plans');
const Subscription = require('../models/subscriptionModel');
const response = require('../utils/response');
const Ledger = require('../models/ledgerModel');
const Owner = require('../models/ownerModel');
const Receipt = require('../models/receiptModel');
const db = require('../config/db');
const crypto = require('crypto');
const Organization = require('../models/organizationModel');
const { isProfessionalPlan, AGENT_PRO_MESSAGE } = require('../utils/workspaces');

/**
 * Vérifie le hash envoyé par PayDunya (SHA-512 de la MASTER KEY), en temps constant.
 */
const isValidPaydunyaHash = (receivedHash) => {
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    if (!masterKey || typeof receivedHash !== 'string') return false;
    const expected = Buffer.from(crypto.createHash('sha512').update(masterKey).digest('hex'));
    const received = Buffer.from(receivedHash.toLowerCase());
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

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

            if (isProfessionalPlan(planKey) && await Organization.isTeamMember(userId)) {
                return response.error(res, AGENT_PRO_MESSAGE, 403);
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
                    tagline: "Votre partenaire de gestion immobilière",
                    postal_address: "Siège Social, Samalocation",
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
     * Initialise une demande de paiement de loyer auprès de PayDunya
     */
    async initializeRentPayment(req, res, next) {
        try {
            const { tenantId, propertyId, unitId, month, year } = req.body;
            const userId = req.user.id; // ID du locataire connecté

            // 1. Vérifier que la location/bail existe et récupérer les détails
            const { rows: leases } = await db.query(
                `SELECT t.*, p.owner_id, pu.monthly_rent, own_op.online_payment_enabled
                 FROM tenants t
                 JOIN property_units pu ON t.unit_id = pu.id
                 JOIN properties p ON pu.property_id = p.id
                 LEFT JOIN owner_profiles own_op ON p.owner_id = own_op.user_profile_id OR p.owner_id = own_op.id
                 WHERE t.user_id = $1 AND p.id = $2 AND pu.id = $3 AND t.status = 'active'`,
                [userId, propertyId, unitId]
            );

            if (leases.length === 0) {
                return response.error(res, 'Aucune location active trouvée pour ce logement.', 404);
            }

            const lease = leases[0];
            const ownerId = lease.owner_id;

            // 2. Vérifier si le propriétaire a activé les paiements en ligne
            if (!lease.online_payment_enabled) {
                return response.error(res, "Votre bailleur n'a pas activé l'option de paiement en ligne.", 403);
            }

            // 3. Montant à payer : le reste dû du mois (loyer de la fiche locataire, sinon du logement,
            //    moins les versements déjà enregistrés). Un mois entièrement réglé ne peut plus être payé.
            const balance = await Receipt.getPeriodBalance({
                tenant_id: tenantId || lease.id,
                property_id: propertyId,
                unit_id: unitId,
                month,
                year
            });
            const rentDue = balance.rent_due ?? (parseFloat(lease.monthly_rent) || null);
            const rentAmount = rentDue === null ? 0 : Math.round((rentDue - balance.paid) * 100) / 100;

            if (rentAmount <= 0) {
                return response.error(res, 'Le loyer pour cette période a déjà été payé.', 400);
            }

            const feeRateUser = 0.025; // 2.5% Mobile Money
            const feeAmount = rentAmount * feeRateUser;
            const totalAmount = rentAmount + feeAmount;
            const isPartialBalance = balance.paid > 0;

            const backendUrl = process.env.BACKEND_URL || process.env.URL_BACKEND || process.env.API_URL || `https://${process.env.APP_DOMAIN}`;
            const frontendUrl = process.env.FRONTEND_URL || process.env.URL_FRONTEND || `https://${process.env.APP_DOMAIN}`;

            // 4. Préparer les données pour PayDunya avec les frais
            const payload = {
                invoice: {
                    items: [
                        {
                            name: isPartialBalance ? `Reste du loyer - Mois de ${month}/${year}` : `Loyer - Mois de ${month}/${year}`,
                            quantity: 1,
                            unit_price: rentAmount,
                            total_price: rentAmount,
                            description: `Paiement de loyer de ${rentAmount} F CFA`
                        },
                        {
                            name: `Frais de service en ligne (2.5%)`,
                            quantity: 1,
                            unit_price: feeAmount,
                            total_price: feeAmount,
                            description: `Frais de traitement SamaLocation`
                        }
                    ],
                    total_amount: totalAmount,
                    description: `Paiement de loyer et frais - Mois de ${month}/${year}`
                },
                store: {
                    name: "SamaLocation",
                    tagline: "Votre partenaire de gestion immobilière",
                    postal_address: "Siège Social, Samalocation",
                    phone: "761629529",
                    logo_url: `${frontendUrl}/logo.png`
                },
                actions: {
                    cancel_url: `${frontendUrl}/tenant-dashboard?payment=cancel`,
                    return_url: `${frontendUrl}/tenant-dashboard?payment=success`,
                    callback_url: `${backendUrl}/api/payment/callback`
                },
                custom_data: {
                    paymentType: 'rent',
                    tenantId,
                    propertyId,
                    unitId,
                    month,
                    year,
                    amount: rentAmount,
                    rentDue,
                    ownerId
                }
            };

            // 5. Appeler PayDunya
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
                const redirectUrl = paydunyaResponse.data.response_url ||
                    (paydunyaResponse.data.response_text.startsWith('http') ? paydunyaResponse.data.response_text : `https://paydunya.com/checkout/invoice/${token}`);

                return response.success(res, {
                    redirect_url: redirectUrl,
                    token: token
                }, 'Lien de paiement de loyer PayDunya généré');
            } else {
                console.error('PayDunya Rent API Error:', paydunyaResponse.data);
                return response.error(res, paydunyaResponse.data.response_text || 'Erreur PayDunya lors de la création de la facture', 400);
            }

        } catch (error) {
            console.error('Rent Payment Error:', error.response?.data || error.message);
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
            
            // Si PayDunya envoie les infos dans un champ "data" (Objet ou String)
            if (req.body.data) {
                if (typeof req.body.data === 'string') {
                    try {
                        payload = JSON.parse(req.body.data);
                    } catch (e) {
                        console.error('Failed to parse PayDunya data string:', e.message);
                    }
                } else if (typeof req.body.data === 'object') {
                    payload = req.body.data;
                }
            }

            console.log('Working Payload:', JSON.stringify(payload));

            // Si c'est un callback de déboursement / virement
            if (payload.withdraw_mode || payload.disburse_tx_id || payload.disburse_id) {
                console.log('--- PAYDUNYA DISBURSEMENT CALLBACK RECEIVED ---');

                // Sécurité : ce callback modifie des soldes, il doit provenir de PayDunya.
                // PayDunya signe ses notifications avec hash = SHA-512(MASTER_KEY).
                if (!isValidPaydunyaHash(payload.hash || req.body.hash)) {
                    console.warn('[SECURITY] Disbursement callback rejeté : hash PayDunya absent ou invalide.');
                    return res.status(403).send('Invalid signature');
                }
                const disburseId = payload.disburse_id;
                const status = payload.status;
                const errorDescription = payload.description || payload.response_text || 'Échec du virement';
                const transactionId = payload.transaction_id || payload.token || null;

                if (disburseId) {
                    const Withdrawal = require('../models/withdrawalModel');
                    try {
                        const withdrawal = await Withdrawal.findById(disburseId);
                        if (withdrawal) {
                            console.log(`Disbursement Callback: withdrawalId=${disburseId}, payloadStatus=${status}, currentDbStatus=${withdrawal.status}, amount=${withdrawal.amount}`);
                            
                            if (status === 'failed') {
                                if (withdrawal.status === 'completed' || withdrawal.status === 'pending') {
                                    const client = await db.connect();
                                    try {
                                        await client.query('BEGIN');

                                        // Passage à 'failed' conditionnel et atomique : un seul callback peut déclencher le remboursement
                                        const markedFailed = await Withdrawal.markFailed(disburseId, errorDescription, ['completed', 'pending'], client);
                                        if (!markedFailed) {
                                            await client.query('ROLLBACK');
                                            return res.status(200).send('Disbursement already processed');
                                        }

                                        // Mettre à jour la transaction correspondante dans le ledger à échoué
                                        await client.query("UPDATE ledger_transactions SET status = 'failed' WHERE reference_id = $1", [disburseId]);
                                        
                                        // Recréditer le solde du propriétaire (montant brut initial du retrait)
                                        await Owner.updateBalance(withdrawal.owner_id, withdrawal.amount, client);
                                        
                                        await client.query('COMMIT');
                                        console.log(`[CALLBACK SUCCESS] Refunded failed withdrawal ${disburseId} of amount ${withdrawal.amount} to owner ${withdrawal.owner_id}`);
                                    } catch (txError) {
                                        await client.query('ROLLBACK');
                                        console.error('Transaction Error while processing failed disburse callback:', txError.message);
                                    } finally {
                                        client.release();
                                    }
                                }
                            } else if (status === 'success' || status === 'completed') {
                                if (withdrawal.status === 'pending') {
                                    const client = await db.connect();
                                    try {
                                        await client.query('BEGIN');
                                        await Withdrawal.updateStatus(disburseId, 'completed', { transaction_id: transactionId }, client);
                                        await client.query("UPDATE ledger_transactions SET status = 'completed' WHERE reference_id = $1", [disburseId]);
                                        await client.query('COMMIT');
                                        console.log(`[CALLBACK SUCCESS] Completed withdrawal ${disburseId}`);
                                    } catch (txError) {
                                        await client.query('ROLLBACK');
                                        console.error('Transaction Error while processing success disburse callback:', txError.message);
                                    } finally {
                                        client.release();
                                    }
                                }
                            }
                        } else {
                            console.warn(`Withdrawal not found for disburse_id: ${disburseId}`);
                        }
                    } catch (err) {
                        console.error('Error during disbursement callback handling:', err.message);
                    }
                }

                return res.status(200).send('Disbursement callback processed');
            }

            // Chercher le token partout (racine, invoice, ou query)
            const token = payload.token || 
                          (payload.invoice && payload.invoice.token) || 
                          req.body.token || 
                          req.query.token;

            if (!token) {
                console.warn('PayDunya Callback Warning: Token not found (ping or validation request)');
                return res.status(200).send('Callback reachable');
            }

            // Vérifier le statut du paiement auprès de PayDunya (Sécurité)
            const confirmBaseUrl = process.env.PAYDUNYA_MODE === 'test'
                ? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/'
                : 'https://app.paydunya.com/api/v1/checkout-invoice/confirm/';
            
            const verifyUrl = `${confirmBaseUrl}${token}`;
            console.log('Verifying with PayDunya:', verifyUrl);
            
            const verifyRes = await axios.get(verifyUrl, {
                headers: {
                    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                    'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY,
                    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                }
            });

            const result = verifyRes.data;
            console.log('PayDunya Verification Result:', result.status);

            if (result.status === 'completed') {
                const finalToken = result.token || result.invoice?.token || token;
                const customData = result.custom_data || payload.custom_data || {};
                const { paymentType } = customData;

                if (paymentType === 'rent') {
                    const { tenantId, propertyId, unitId, month, year, amount, ownerId, rentDue } = customData;
                    
                    // 1. Idempotency Check: Verify if receipt already exists
                    const { rows: existing } = await db.query(
                        "SELECT id FROM receipts WHERE tenant_id = $1 AND property_id = $2 AND month = $3 AND year = $4 AND COALESCE(status, 'valid') <> 'cancelled' AND receipt_type <> 'deposit'",
                        [tenantId, propertyId, month, year]
                    );

                    if (existing.length > 0) {
                        console.log(`Receipt already created for ${tenantId} - ${propertyId} (${month}/${year})`);
                        return res.status(200).send('OK');
                    }

                    // 2. Identify payment channel and calculate fee & surplus
                    const method = (result.payment_method || result.invoice?.payment_method || 'wave').toLowerCase();
                    let feeRateUser = 0.025; // 2.5% Mobile Money
                    if (method.includes('card') || method.includes('visa') || method.includes('mastercard') || method.includes('cb')) {
                        feeRateUser = 0.035; // 3.5% Card
                    }
                    const feeRatePayDunya = parseFloat(process.env.PAYDUNYA_REAL_FEE_RATE || '0.02');
                    
                    const grossAmountPaidByCustomer = amount * (1 + feeRateUser);
                    const realPayDunyaFee = grossAmountPaidByCustomer * feeRatePayDunya;
                    const netAmountDeposited = grossAmountPaidByCustomer - realPayDunyaFee;
                    const surplus = netAmountDeposited - amount;

                    console.log(`Rent Payment Completed: Gross paid=${grossAmountPaidByCustomer}, PayDunya fee=${realPayDunyaFee}, Net deposited=${netAmountDeposited}, Owner credited=${amount}, Platform surplus=${surplus}`);

                    // Use client transaction for db updates
                    const client = await db.connect();
                    try {
                        await client.query('BEGIN');

                        // 3. Create Ledger Transaction
                        await Ledger.create({
                            owner_id: ownerId,
                            type: 'pay_rent',
                            amount: amount,
                            fee: realPayDunyaFee,
                            net_amount: amount,
                            platform_surplus: surplus,
                            status: 'completed',
                            description: `Encaissement loyer ${month}/${year} en ligne`,
                            reference_id: finalToken
                        }, client);

                        // 4. Update Owner Balance
                        await Owner.updateBalance(ownerId, amount, client);

                        // 5. Create Receipt
                        const cleanMethodName = `En ligne (${method.includes('card') || method.includes('visa') || method.includes('mastercard') || method.includes('cb') ? 'Carte' : method.toUpperCase()})`;
                        // Déjà versé recalculé au moment du paiement (un autre versement a pu être enregistré entre-temps)
                        const balanceAtPayment = await Receipt.getPeriodBalance({
                            tenant_id: tenantId, property_id: propertyId, unit_id: unitId, month, year
                        });
                        await Receipt.create({
                            tenant_id: tenantId,
                            property_id: propertyId,
                            unit_id: unitId,
                            month: month,
                            year: year,
                            amount: amount,
                            payment_date: new Date(),
                            payment_method: cleanMethodName,
                            notes: 'Paiement effectué en ligne via SamaLocation/PayDunya.',
                            rent_due: rentDue ?? balanceAtPayment.rent_due,
                            paid_before: balanceAtPayment.paid
                        });

                        await client.query('COMMIT');
                    } catch (txError) {
                        await client.query('ROLLBACK');
                        console.error('Transaction Error in callback:', txError.message);
                        throw txError;
                    } finally {
                        client.release();
                    }

                    // 6. Create Notification for Tenant and Owner
                    try {
                        const Notification = require('../models/notificationModel');
                        const uuid = require('uuid');
                        
                        // Récupérer le nom du locataire
                        let tenantName = 'Un locataire';
                        try {
                            const { rows: tenantProfile } = await db.query(
                                'SELECT full_name FROM user_profiles WHERE id = $1',
                                [tenantId]
                            );
                            if (tenantProfile.length > 0 && tenantProfile[0].full_name) {
                                tenantName = tenantProfile[0].full_name;
                            }
                        } catch (dbErr) {
                            console.error('Failed to fetch tenant name for notification:', dbErr.message);
                        }

                        // Notify Tenant
                        await Notification.create({
                            id: uuid.v4(),
                            user_id: tenantId,
                            type: 'receipt',
                            title: 'Paiement de loyer réussi',
                            message: `Votre loyer de ${amount} F CFA pour ${month}/${year} a été payé avec succès.`,
                            link: '/tenant-dashboard'
                        });

                        // Notify Owner
                        await Notification.create({
                            id: uuid.v4(),
                            user_id: ownerId,
                            type: 'payment',
                            title: 'Loyer encaissé',
                            message: `Le locataire ${tenantName} a payé son loyer de ${amount} F CFA en ligne pour le mois de ${month}/${year}.`,
                            link: '/owner-dashboard'
                        });
                    } catch (notifErr) {
                        console.error('Notification failed:', notifErr.message);
                    }

                    console.log('--- SUCCESS: Rent Payment Processed ---');
                    return res.status(200).send('OK');
                }

                // Sinon c'est un abonnement standard
                const { userId, planId, durationDays, price } = customData;
                
                if (!userId) {
                    console.error('PayDunya Error: No userId in custom_data');
                    return res.status(400).send('Incomplete custom_data');
                }

                // Idempotence : un même token PayDunya ne peut activer qu'un seul abonnement (anti-rejeu)
                const { rows: alreadyProcessed } = await db.query(
                    'SELECT id FROM subscriptions WHERE transaction_id = $1 LIMIT 1',
                    [finalToken]
                );
                if (alreadyProcessed.length > 0) {
                    console.log(`Subscription already activated for token ${finalToken}, callback ignored.`);
                    return res.status(200).send('OK');
                }

                const subPlan = (planId || 'PREMIUM').toUpperCase();
                const receiptUrl = result.receipt_url || payload.receipt_url;
                console.log(`Activating ${subPlan} for User ${userId}. Receipt: ${receiptUrl}`);

                try {
                    await Subscription.createSubscription(userId, {
                        planName: subPlan,
                        price: price || (result.invoice && result.invoice.total_amount) || 0,
                        paymentMethod: 'paydunya',
                        transactionId: finalToken,
                        durationDays: durationDays || 30,
                        receiptUrl: receiptUrl
                    });
                } catch (subError) {
                    // Index unique : un callback simultané a déjà activé cet abonnement
                    if (subError.code === '23505') {
                        console.log(`Subscription already activated for token ${finalToken} (concurrent callback), ignored.`);
                        return res.status(200).send('OK');
                    }
                    throw subError;
                }

                // Envoyer un mail de confirmation avec le lien du reçu
                try {
                    const emailService = require('../utils/emailService');
                    const User = require('../models/userModel');
                    const user = await User.findProfileById(userId);
                    if (user && user.email) {
                        const receiptHtml = receiptUrl 
                            ? `<p>Vous pouvez télécharger votre reçu ici : <a href="${receiptUrl}">${receiptUrl}</a></p>`
                            : '';
                        
                        await emailService.sendEmail(
                            user.email, 
                            'Abonnement activé - SamaLocation', 
                            `<div style="font-family: sans-serif;">
                                <h2>Félicitations !</h2>
                                <p>Votre abonnement <strong>${subPlan}</strong> est désormais actif sur SamaLocation.</p>
                                <p>Durée : ${durationDays || 30} jours</p>
                                ${receiptHtml}
                                <p>Merci de votre confiance !</p>
                             </div>`
                        );
                    }
                } catch (emailError) {
                    console.error('Email notification failed:', emailError.message);
                }

                console.log('--- SUCCESS: Subscription Activated ---');
                return res.status(200).send('OK');
            }

            console.log('Payment not completed. Status:', result.status);
            return res.status(200).send('Payment pending');

        } catch (error) {
            console.error('PayDunya Callback Global Error:', error.message);
            res.status(500).send('Error');
        }
    }
};

module.exports = paymentController;
