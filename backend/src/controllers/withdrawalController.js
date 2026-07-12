const db = require('../config/db');
const Withdrawal = require('../models/withdrawalModel');
const Ledger = require('../models/ledgerModel');
const Owner = require('../models/ownerModel');
const response = require('../utils/response');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const FEE_RATE_USER = parseFloat(process.env.PAYMENT_FEE_CLIENT || '0.025'); // 2.5% par défaut
const FEE_RATE_PAYDUNYA = parseFloat(process.env.PAYDUNYA_REAL_FEE_RATE || '0.02'); // 2.0% par défaut

const withdrawalController = {
    /**
     * Demande de retrait par le propriétaire
     */
    async requestWithdrawal(req, res, next) {
        const client = await db.connect();
        try {
            const { amount, provider, recipientDetails, password } = req.body;
            const userId = req.user.id; // L'ID utilisateur correspond à l'ID propriétaire

            // 1. Validation de base
            if (!amount || !provider || !recipientDetails || !password) {
                return response.error(res, 'Tous les champs (montant, fournisseur, détails de réception, mot de passe) sont requis.', 400);
            }

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return response.error(res, 'Montant invalide.', 400);
            }

            // 1.1 Validation du numéro de téléphone sénégalais (Wave, OM, Free Money)
            const cleanPhone = recipientDetails.replace(/\s+/g, '');
            const senegalPhoneRegex = /^(77|78|76|75|70)\d{7}$/;
            if (!senegalPhoneRegex.test(cleanPhone)) {
                return response.error(res, 'Numéro de téléphone invalide. Il doit faire 9 chiffres et commencer par 77, 78, 76, 75 ou 70.', 400);
            }

            // 1.2 Validation du montant minimal
            const MIN_WITHDRAWAL = 1000;
            if (parsedAmount < MIN_WITHDRAWAL) {
                return response.error(res, `Le montant minimum de retrait est de ${MIN_WITHDRAWAL} F CFA.`, 400);
            }

            // 1.3 Validation de la limite quotidienne cumulée (2 000 000 F CFA)
            const LIMIT_DAILY = 2000000;
            const { rows: dailySum } = await client.query(
                `SELECT COALESCE(SUM(amount), 0) as total_today 
                 FROM withdrawals 
                 WHERE owner_id = $1 
                   AND status IN ('pending', 'completed') 
                   AND created_at >= NOW() - INTERVAL '24 hours'`,
                [userId]
            );
            const totalWithdrawnToday = parseFloat(dailySum[0].total_today);
            if (totalWithdrawnToday + parsedAmount > LIMIT_DAILY) {
                return response.error(res, `Limite de retrait quotidienne dépassée. Vous ne pouvez pas retirer plus de ${LIMIT_DAILY} F CFA par tranche de 24h. Vous avez déjà retiré ${totalWithdrawnToday} F CFA aujourd'hui.`, 400);
            }

            // 2. Vérification du mot de passe
            const { rows: users } = await client.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (users.length === 0) {
                return response.error(res, 'Utilisateur non trouvé.', 404);
            }

            const isValidPassword = await bcrypt.compare(password, users[0].password_hash);
            if (!isValidPassword) {
                return response.error(res, 'Mot de passe de confirmation incorrect.', 401);
            }

            // 3. Vérification du solde du propriétaire
            const { rows: profiles } = await client.query('SELECT balance, currency FROM owner_profiles WHERE id = $1', [userId]);
            if (profiles.length === 0) {
                return response.error(res, 'Profil propriétaire non trouvé.', 404);
            }

            const ownerProfile = profiles[0];
            const currentBalance = parseFloat(ownerProfile.balance);

            if (currentBalance < parsedAmount) {
                return response.error(res, 'Solde insuffisant pour effectuer ce retrait.', 400);
            }

            // 4. Calculs des frais (2.5% utilisateur, 2% PayDunya)
            const fee = parsedAmount * FEE_RATE_USER;
            const netAmount = parsedAmount - fee;

            // Début de la transaction en base de données
            await client.query('BEGIN');

            // 5. Créer la demande de retrait en statut 'pending'
            const withdrawal = await Withdrawal.create({
                owner_id: userId,
                amount: parsedAmount,
                fee: fee,
                net_amount: netAmount,
                provider: provider,
                recipient_details: recipientDetails,
                status: 'pending'
            }, client);

            // 6. Déduire le montant du solde du propriétaire
            await Owner.updateBalance(userId, -parsedAmount, client);

            // 7. Enregistrer la transaction dans le grand livre (ledger) en statut 'pending'
            // Le surplus estimé est calculé sur le taux réel PayDunya
            const expectedPayDunyaFee = netAmount * FEE_RATE_PAYDUNYA;
            const estimatedSurplus = fee - expectedPayDunyaFee;

            const ledgerTx = await Ledger.create({
                owner_id: userId,
                type: 'withdraw',
                amount: parsedAmount,
                fee: fee,
                net_amount: netAmount,
                platform_surplus: estimatedSurplus,
                status: 'pending',
                description: `Demande de retrait vers ${provider.toUpperCase()} (${recipientDetails})`,
                reference_id: withdrawal.id
            }, client);

            await client.query('COMMIT');

            // 8. Appel API PayDunya (Disbursement / Transfert)
            const isTestMode = process.env.PAYDUNYA_MODE === 'test';
            let pdProvider = provider.toLowerCase();
            if (pdProvider === 'orange_money') pdProvider = 'orange-money-senegal';
            if (pdProvider === 'free_money') pdProvider = 'free-money-senegal';
            if (pdProvider === 'wave') pdProvider = 'wave-senegal';

            if (isTestMode) {
                // Mode simulation (Sandbox / Test)
                console.log(`[SIMULATION] Transfert de ${netAmount} F CFA vers ${recipientDetails} via ${pdProvider}`);
                
                await db.query('BEGIN');
                // Confirmer le retrait
                await Withdrawal.updateStatus(withdrawal.id, 'completed', { transaction_id: `SIM-TX-${Date.now()}` });
                // Confirmer la transaction du ledger
                await db.query("UPDATE ledger_transactions SET status = 'completed' WHERE reference_id = $1", [withdrawal.id]);
                await db.query('COMMIT');

                return response.success(res, {
                    withdrawal_id: withdrawal.id,
                    status: 'completed',
                    amount: parsedAmount,
                    net_amount: netAmount,
                    message: 'Retrait simulé avec succès.'
                });
            } else {
                // Mode Production (Live API PayDunya v2 - flux en 2 étapes)
                const disburseBaseUrl = 'https://app.paydunya.com/api/v2/disburse';
                const backendUrl = process.env.BACKEND_URL || process.env.URL_BACKEND || process.env.API_URL || `https://${process.env.APP_DOMAIN || 'samalocation.com'}`;
                const callbackUrl = `${backendUrl}/api/payment/callback`;
                
                try {
                    // Étape 1 : Obtenir le jeton de virement (get-invoice)
                    const getInvoiceRes = await axios.post(`${disburseBaseUrl}/get-invoice`, {
                        amount: netAmount,
                        account_alias: recipientDetails,
                        withdraw_mode: pdProvider,
                        callback_url: callbackUrl
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                            'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                            'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                        }
                    });

                    if (getInvoiceRes.data.response_code !== "00") {
                        throw new Error(getInvoiceRes.data.response_text || 'Échec de la création de la facture de virement.');
                    }

                    const disburseToken = getInvoiceRes.data.disburse_token;

                    // Étape 2 : Confirmer et soumettre le virement (submit-invoice)
                    const submitInvoiceRes = await axios.post(`${disburseBaseUrl}/submit-invoice`, {
                        disburse_invoice: disburseToken,
                        disburse_id: String(withdrawal.id)
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
                            'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
                            'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
                        }
                    });

                    if (submitInvoiceRes.data.response_code === "00" || submitInvoiceRes.data.status === "success") {
                        const transactionId = submitInvoiceRes.data.transaction_id || `PD-${Date.now()}`;
                        
                        await db.query('BEGIN');
                        await Withdrawal.updateStatus(withdrawal.id, 'completed', { transaction_id: transactionId });
                        await db.query("UPDATE ledger_transactions SET status = 'completed' WHERE reference_id = $1", [withdrawal.id]);
                        await db.query('COMMIT');

                        return response.success(res, {
                            withdrawal_id: withdrawal.id,
                            status: 'completed',
                            transaction_id: transactionId,
                            message: 'Votre retrait a été envoyé avec succès.'
                        });
                    } else {
                        throw new Error(submitInvoiceRes.data.response_text || 'Échec de la soumission du virement.');
                    }
                } catch (apiError) {
                    console.error('PayDunya Transfer API Error:', apiError.message);
                    if (apiError.response && apiError.response.data) {
                        console.error('PayDunya Transfer API Response:', JSON.stringify(apiError.response.data));
                    }
                    
                    // En cas d'erreur de l'API, on annule et on recrédite le propriétaire
                    await db.query('BEGIN');
                    await Withdrawal.updateStatus(withdrawal.id, 'failed', { error_message: apiError.message });
                    await db.query("UPDATE ledger_transactions SET status = 'failed' WHERE reference_id = $1", [withdrawal.id]);
                    await Owner.updateBalance(userId, parsedAmount); // Recréditer le solde
                    await db.query('COMMIT');

                    return response.error(res, `Le transfert a échoué : ${apiError.message}. Votre solde a été recrédité.`, 400);
                }
            }

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in requestWithdrawal:', error);
            next(error);
        } finally {
            client.release();
        }
    },

    /**
     * Récupérer l'historique des retraits et du portefeuille pour le propriétaire connecté
     */
    async getMyWalletData(req, res, next) {
        try {
            const userId = req.user.id;

            // 1. Récupérer le solde et les paramètres
            const { rows: profiles } = await db.query(
                'SELECT balance, currency, online_payment_enabled FROM owner_profiles WHERE id = $1',
                [userId]
            );

            if (profiles.length === 0) {
                return response.error(res, 'Profil propriétaire non trouvé.', 404);
            }

            const profile = profiles[0];

            // 2. Récupérer l'historique des transactions (ledger)
            const transactions = await Ledger.findByOwnerId(userId);

            // 3. Récupérer l'historique des retraits
            const withdrawals = await Withdrawal.findByOwnerId(userId);

            return response.success(res, {
                balance: parseFloat(profile.balance),
                currency: profile.currency || 'XOF',
                online_payment_enabled: profile.online_payment_enabled,
                transactions,
                withdrawals
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Activer/Désactiver le paiement en ligne pour ses locataires
     */
    async toggleOnlinePayment(req, res, next) {
        try {
            const userId = req.user.id;
            const { enabled } = req.body;

            if (enabled === undefined) {
                return response.error(res, "Le paramètre 'enabled' est requis.", 400);
            }

            const online_payment_enabled = await Owner.updatePaymentSettings(userId, enabled === true);
            
            return response.success(res, { online_payment_enabled }, `Paiements en ligne ${online_payment_enabled ? 'activés' : 'désactivés'} avec succès.`);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = withdrawalController;
