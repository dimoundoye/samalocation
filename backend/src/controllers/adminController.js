const db = require('../config/db');
const response = require('../utils/response');

const adminController = {
    /**
     * Obtenir les statistiques générales
     */
    async getStatistics(req, res, next) {
        try {
            // Total utilisateurs par rôle
            const { rows: roleCounts } = await db.query(`
                SELECT role, COUNT(*) as count 
                FROM user_profiles 
                GROUP BY role
            `);

            // Total propriétés
            const { rows: propertiesCount } = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published
                FROM properties
            `);

            const lastUsersCheck = req.query.lastUsersCheck || '1970-01-01';
            const lastPropertiesCheck = req.query.lastPropertiesCheck || '1970-01-01';

            // Nouveaux utilisateurs depuis la dernière vérification (ou 7 derniers jours par défaut pour le calcul initial)
            const { rows: newUsers } = await db.query(`
                SELECT COUNT(*) as count
                FROM user_profiles up
                JOIN users u ON up.id = u.id
                WHERE u.created_at >= $1
            `, [lastUsersCheck]);

            // Nouvelles propriétés depuis la dernière vérification
            const { rows: newProperties } = await db.query(`
                SELECT COUNT(*) as count
                FROM properties
                WHERE created_at >= $1
            `, [lastPropertiesCheck]);

            // Signalements en attente (toujours basés sur le statut, pas la date)
            const { rows: pendingReports } = await db.query(`
                SELECT COUNT(*) as count
                FROM reports
                WHERE status = 'pending'
            `);

            // Vérifications en attente
            const { rows: pendingVerifications } = await db.query(`
                SELECT COUNT(*) as count
                FROM owner_profiles
                WHERE verification_status = 'pending'
            `);

            // Paiements en attente
            const { rows: pendingPayments } = await db.query(`
                SELECT COUNT(*) as count
                FROM subscriptions
                WHERE status = 'pending'
            `);

            // Messages de support en attente
            const { rows: pendingContacts } = await db.query(`
                SELECT COUNT(*) as count
                FROM contact_messages
                WHERE status = 'new'
            `);

            // Statistiques d'abonnements (par plan)
            const { rows: subStats } = await db.query(`
                SELECT 
                    plan_name, 
                    COUNT(*) as count, 
                    SUM(price) as revenue
                FROM subscriptions
                WHERE status = 'active'
                  AND (DATE(expires_at) >= CURRENT_DATE - INTERVAL '3 days' OR expires_at IS NULL)
                GROUP BY plan_name
            `);

            // Revenu total (historique des paiements validés PayDunya uniquement)
            const { rows: totalRevenue } = await db.query(`
                SELECT COALESCE(SUM(price), 0) as total 
                FROM subscriptions 
                WHERE status IN ('active', 'expired')
                AND payment_method = 'paydunya'
            `);

            // Revenu du mois en cours (paiements PayDunya effectués ce mois-ci)
            const { rows: currentMonthRevenue } = await db.query(`
                SELECT COALESCE(SUM(price), 0) as total 
                FROM subscriptions 
                WHERE status IN ('active', 'expired')
                AND payment_method = 'paydunya'
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
            `);

            // Statistiques IA
            const AIUsage = require('../models/aiUsageModel');
            const aiStats = await AIUsage.getStats();

            const owners = parseInt(roleCounts.find(r => r.role === 'owner')?.count || 0);
            const tenants = parseInt(roleCounts.find(r => r.role === 'tenant')?.count || 0);

            // Mapper les stats par plan (Premium, Professionnel)
            const subscriptions = {
                premium: subStats.find(s => s.plan_name.toLowerCase() === 'premium')?.count || 0,
                professionnel: subStats.find(s => s.plan_name.toLowerCase() === 'professionnel')?.count || 0,
                free: owners - (subStats.reduce((acc, s) => acc + parseInt(s.count), 0))
            };

            return response.success(res, {
                totalUsers: owners + tenants,
                owners,
                tenants,
                totalProperties: parseInt(propertiesCount[0]?.total || 0),
                publishedProperties: parseInt(propertiesCount[0]?.published || 0),
                newUsersCount: parseInt(newUsers[0]?.count || 0),
                newPropertiesCount: parseInt(newProperties[0]?.count || 0),
                pendingReportsCount: parseInt(pendingReports[0]?.count || 0),
                pendingVerificationsCount: parseInt(pendingVerifications[0]?.count || 0),
                pendingPaymentsCount: parseInt(pendingPayments[0]?.count || 0),
                pendingContactsCount: parseInt(pendingContacts[0]?.count || 0),
                subscriptions,
                revenue: {
                    active: parseFloat(currentMonthRevenue[0]?.total || 0),
                    total: parseFloat(totalRevenue[0]?.total || 0)
                },
                aiUsage: aiStats.map(s => ({
                    action: s.action,
                    count: parseInt(s.count),
                    last_used: s.last_used
                }))
            });
        } catch (error) {
            console.error('Error getting admin statistics:', error);
            next(error);
        }
    },

    /**
     * Obtenir les derniers utilisateurs enregistrés
     */
    async getRecentUsers(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const since = req.query.since;

            let query = `
                SELECT up.id, up.full_name, up.email, up.role, u.created_at, up.custom_id as customId
                FROM user_profiles up
                JOIN users u ON up.id = u.id
            `;
            const params = [];

            if (since) {
                query += ` WHERE u.created_at >= $1`;
                params.push(since);
            }

            query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1}`;
            params.push(limit);

            const { rows: users } = await db.query(query, params);

            return response.success(res, users);
        } catch (error) {
            console.error('Error getting recent users:', error);
            next(error);
        }
    },

    /**
     * Obtenir les données de croissance des utilisateurs
     */
    async getUserGrowth(req, res, next) {
        try {
            const period = req.query.period || (req.query.days ? 'day' : 'month');
            const selectedYear = req.query.year ? parseInt(req.query.year) : null;

            if (period === 'year') {
                const { rows } = await db.query(`
                    SELECT 
                        EXTRACT(YEAR FROM u.created_at)::int as year,
                        up.role,
                        COUNT(*)::int as count
                    FROM user_profiles up
                    JOIN users u ON up.id = u.id
                    GROUP BY year, up.role
                    ORDER BY year ASC
                `);
                return response.success(res, rows);
            }

            if (period === 'month') {
                let query = `
                    SELECT 
                        TO_CHAR(u.created_at, 'YYYY-MM') as month_key,
                        EXTRACT(YEAR FROM u.created_at)::int as year,
                        EXTRACT(MONTH FROM u.created_at)::int as month,
                        up.role,
                        COUNT(*)::int as count
                    FROM user_profiles up
                    JOIN users u ON up.id = u.id
                `;
                const params = [];
                if (selectedYear) {
                    query += ` WHERE EXTRACT(YEAR FROM u.created_at) = $1`;
                    params.push(selectedYear);
                }
                query += ` GROUP BY month_key, year, month, up.role ORDER BY month_key ASC`;

                const { rows } = await db.query(query, params);
                return response.success(res, rows);
            }

            // Mode 'day' (rétro-compatibilité)
            const days = parseInt(req.query.days) || 30;
            const { rows: growth } = await db.query(`
                SELECT 
                    DATE(u.created_at) as date,
                    up.role,
                    COUNT(*)::int as count
                FROM user_profiles up
                JOIN users u ON up.id = u.id
                WHERE u.created_at >= NOW() - ($1::text || ' days')::INTERVAL
                GROUP BY DATE(u.created_at), up.role
                ORDER BY date ASC
            `, [days]);

            return response.success(res, growth);
        } catch (error) {
            console.error('Error getting user growth:', error);
            next(error);
        }
    },

    /**
     * Obtenir la vue d'ensemble des propriétés
     */
    async getPropertiesOverview(req, res, next) {
        try {
            // Statistiques globales
            const { rows: globalStats } = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) as unpublished
                FROM properties
            `);

            // Par type
            const { rows: byType } = await db.query(`
                SELECT 
                    LOWER(TRIM(property_type)) as property_type,
                    COUNT(*) as count
                FROM properties
                WHERE property_type IS NOT NULL
                GROUP BY LOWER(TRIM(property_type))
                ORDER BY count DESC
            `);

            // Propriétés récentes
            const { rows: recent } = await db.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.property_type,
                    p.is_published,
                    p.created_at,
                    up.full_name as owner_name
                FROM properties p
                LEFT JOIN user_profiles up ON p.owner_id = up.id
                ORDER BY p.created_at DESC
                LIMIT 5
            `);

            return response.success(res, {
                global: globalStats[0],
                byType,
                recent
            });
        } catch (error) {
            console.error('Error getting properties overview:', error);
            next(error);
        }
    },

    /**
     * Obtenir toutes les propriétés (pour gestion admin)
     */
    async getAllProperties(req, res, next) {
        try {
            const { rows: properties } = await db.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.address,
                    p.description,
                    p.property_type,
                    p.is_published,
                    p.photo_url,
                    p.photos,
                    p.latitude,
                    p.longitude,
                    p.equipments,
                    p.created_at,
                    up.full_name as owner_name,
                    up.id as owner_id,
                    (SELECT SUM(bedrooms) FROM property_units WHERE property_id = p.id) as bedrooms,
                    (SELECT SUM(bathrooms) FROM property_units WHERE property_id = p.id) as bathrooms,
                    (SELECT SUM(area_sqm) FROM property_units WHERE property_id = p.id) as area_sqm,
                    (SELECT MIN(monthly_rent) FROM property_units WHERE property_id = p.id) as min_rent,
                    (SELECT COUNT(*) FROM property_units WHERE property_id = p.id) as units_count
                FROM properties p
                LEFT JOIN user_profiles up ON p.owner_id = up.id
                ORDER BY p.created_at DESC
            `);

            return response.success(res, properties);
        } catch (error) {
            console.error('Error getting all properties:', error);
            next(error);
        }
    },

    /**
     * Liste des demandes de vérification en attente
     */
    async getPendingVerifications(req, res, next) {
        try {
            const { rows: verifications } = await db.query(`
                SELECT 
                    op.id,
                    up.full_name,
                    up.email,
                    op.company_name,
                    op.id_card_url,
                    op.verification_status,
                    u.updated_at
                FROM owner_profiles op
                JOIN user_profiles up ON op.id = up.id
                JOIN users u ON op.id = u.id
                WHERE op.verification_status = 'pending'
                ORDER BY u.updated_at ASC
            `);

            return response.success(res, verifications);
        } catch (error) {
            console.error('Error getting pending verifications:', error);
            next(error);
        }
    },

    /**
     * Liste des propriétaires par statut de vérification
     */
    async getVerifications(req, res, next) {
        try {
            const { status } = req.query; // status: 'pending', 'verified', 'rejected'

            let query = `
                SELECT 
                    op.id,
                    up.full_name,
                    up.email,
                    op.company_name,
                    op.id_card_url,
                    op.verification_status,
                    op.is_verified,
                    op.verified_at,
                    u.updated_at
                FROM owner_profiles op
                JOIN user_profiles up ON op.id = up.id
                JOIN users u ON op.id = u.id
            `;

            const params = [];
            if (status) {
                query += ` WHERE op.verification_status = $1`;
                params.push(status);
            }

            query += ` ORDER BY u.updated_at DESC`;

            const { rows: verifications } = await db.query(query, params);

            return response.success(res, verifications);
        } catch (error) {
            console.error('Error getting verifications:', error);
            next(error);
        }
    },

    /**
     * Mettre à jour le statut de vérification d'un propriétaire
     */
    async updateVerificationStatus(req, res, next) {
        try {
            const { ownerId } = req.params;
            const { status, reason } = req.body; // status: 'verified' or 'rejected'

            if (!['verified', 'rejected'].includes(status)) {
                return response.error(res, 'Statut invalide', 400);
            }

            const isVerified = status === 'verified';

            await db.query(`
                UPDATE owner_profiles 
                SET 
                    verification_status = $1, 
                    is_verified = $2, 
                    verified_at = CASE WHEN $3 = 'verified' THEN NOW() ELSE NULL END,
                    updated_at = NOW()
                WHERE id = $4
            `, [status, isVerified, status, ownerId]);

            // Optionnel : Envoyer une notification au propriétaire ici
            return response.success(res, null, `Profil propriétaire ${isVerified ? 'vérifié' : 'rejeté'} avec succès`);
        } catch (error) {
            console.error('Error updating verification status:', error);
            next(error);
        }
    },

    /**
     * Obtenir les statistiques de revenus basées sur les reçus
     */
    async getRevenueStats(req, res, next) {
        try {
            const selectedYear = req.query.year && req.query.year !== 'all' ? parseInt(req.query.year) : null;

            // --- VOLUME DES REÇUS (Mouvements de loyers sur la plateforme) ---
            
            // Statistiques par jour (30 derniers jours)
            const { rows: daily } = await db.query(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(amount) as total
                FROM receipts
                WHERE created_at >= NOW() - INTERVAL '30 days'
                  AND COALESCE(status, 'valid') <> 'cancelled' AND receipt_type <> 'deposit'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            // Statistiques par mois (filtre par année si spécifié, sinon 12 derniers mois)
            const monthlyQuery = selectedYear 
                ? `SELECT 
                     DATE_TRUNC('month', created_at) as date,
                     SUM(amount) as total
                   FROM receipts
                   WHERE (year = $1 OR EXTRACT(YEAR FROM created_at) = $1)
                     AND COALESCE(status, 'valid') <> 'cancelled' AND receipt_type <> 'deposit'
                   GROUP BY DATE_TRUNC('month', created_at)
                   ORDER BY date ASC`
                : `SELECT 
                     DATE_TRUNC('month', created_at) as date,
                     SUM(amount) as total
                   FROM receipts
                   WHERE created_at >= NOW() - INTERVAL '12 months'
                     AND COALESCE(status, 'valid') <> 'cancelled' AND receipt_type <> 'deposit'
                   GROUP BY DATE_TRUNC('month', created_at)
                   ORDER BY date ASC`;

            const { rows: monthly } = await db.query(monthlyQuery, selectedYear ? [selectedYear] : []);

            // Statistiques par année
            const { rows: yearly } = await db.query(`
                SELECT 
                    COALESCE(year, EXTRACT(YEAR FROM created_at)::int)::text as date,
                    SUM(amount) as total
                FROM receipts
                WHERE COALESCE(status, 'valid') <> 'cancelled' AND receipt_type <> 'deposit'
                GROUP BY COALESCE(year, EXTRACT(YEAR FROM created_at)::int)
                ORDER BY date ASC
            `);

            // Années disponibles dans les reçus
            const { rows: yearsRows } = await db.query(`
                SELECT DISTINCT COALESCE(year, EXTRACT(YEAR FROM created_at)::int) as year
                FROM receipts
                WHERE year IS NOT NULL OR created_at IS NOT NULL
                ORDER BY year DESC
            `);
            const availableYears = yearsRows.map(r => r.year).filter(Boolean);

            // --- REVENUS ADMIN (Abonnements payés via PayDunya uniquement) ---

            // Revenu admin mensuel (12 derniers mois) - avec déduction des 2% de frais de PayDunya
            const { rows: adminMonthly } = await db.query(`
                SELECT 
                    DATE_TRUNC('month', created_at) as date,
                    SUM(price * 0.98) as total
                FROM subscriptions
                WHERE status IN ('active', 'expired') AND price > 0
                AND payment_method = 'paydunya'
                AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY date ASC
            `);

            // Revenu admin annuel - avec déduction des 2% de frais de PayDunya
            const { rows: adminYearly } = await db.query(`
                SELECT 
                    EXTRACT(YEAR FROM created_at)::text as date,
                    SUM(price * 0.98) as total
                FROM subscriptions
                WHERE status IN ('active', 'expired') AND price > 0
                AND payment_method = 'paydunya'
                GROUP BY EXTRACT(YEAR FROM created_at)
                ORDER BY date ASC
            `);

            return response.success(res, {
                daily,
                monthly,
                yearly,
                availableYears,
                adminMonthly,
                adminYearly
            });
        } catch (error) {
            console.error('Error getting revenue stats:', error);
            next(error);
        }
    },

    /**
     * Récupérer les soldes de tous les propriétaires
     */
    async getOwnerBalances(req, res, next) {
        try {
            const { rows: owners } = await db.query(
                `SELECT op.id, op.company_name, op.balance, op.currency, op.online_payment_enabled,
                        up.full_name, up.email, up.phone, u.is_blocked
                 FROM owner_profiles op
                 JOIN user_profiles up ON op.user_profile_id = up.id
                 JOIN users u ON up.id = u.id
                 ORDER BY op.balance DESC`
            );

            // Récupérer les stats globales de surplus du grand livre
            const { rows: stats } = await db.query(
                `SELECT 
                    COALESCE(SUM(platform_surplus), 0) as total_surplus,
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(CASE WHEN type = 'pay_rent' THEN amount ELSE 0 END), 0) as total_rent_volume
                 FROM ledger_transactions 
                 WHERE status = 'completed'`
            );

            // Récupérer les revenus des abonnements payés via PayDunya uniquement
            const { rows: subStats } = await db.query(
                `SELECT 
                    COALESCE(SUM(price), 0) as total_subscriptions_gross,
                    COALESCE(SUM(price * 0.98), 0) as total_subscriptions_net
                 FROM subscriptions 
                 WHERE status IN ('active', 'expired') AND price > 0
                 AND payment_method = 'paydunya'`
            );
            const totalSurplus = parseFloat(stats[0].total_surplus) || 0;
            const totalRentVolume = parseFloat(stats[0].total_rent_volume) || 0;
            const totalTransactions = parseInt(stats[0].total_transactions) || 0;
            const subGross = parseFloat(subStats[0].total_subscriptions_gross) || 0;
            const subNet = parseFloat(subStats[0].total_subscriptions_net) || 0;
            const cumulative = totalSurplus + subNet;
            const totalOwnerBalances = owners.reduce((sum, o) => sum + parseFloat(o.balance || 0), 0);
            const reservedFunds = totalOwnerBalances * 0.975 * 1.02; // 99.45% of virtual landlord balance (amount sent to landlord + 2% PayDunya disbursement fee)

            return response.success(res, {
                owners,
                stats: {
                    total_surplus: totalSurplus,
                    total_transactions: totalTransactions,
                    total_rent_volume: totalRentVolume,
                    total_subscriptions_gross: subGross,
                    total_subscriptions_net: subNet,
                    cumulative_revenue: cumulative,
                    total_owner_balances: totalOwnerBalances,
                    reserved_funds: reservedFunds
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Forcer le virement du solde d'un propriétaire suspendu
     */
    async forceOwnerWithdrawal(req, res, next) {
        const client = await db.connect();
        const axios = require('axios');
        const FEE_RATE_USER = parseFloat(process.env.PAYMENT_FEE_CLIENT || '0.025');
        const FEE_RATE_PAYDUNYA = parseFloat(process.env.PAYDUNYA_REAL_FEE_RATE || '0.02');
        
        try {
            const { ownerId } = req.params;
            const { customPhone, customProvider } = req.body;

            // 1. Récupérer le solde
            const { rows: profiles } = await client.query(
                'SELECT balance, currency FROM owner_profiles WHERE id = $1',
                [ownerId]
            );

            if (profiles.length === 0) {
                return response.error(res, 'Profil propriétaire non trouvé.', 404);
            }

            const ownerProfile = profiles[0];
            const amount = parseFloat(ownerProfile.balance);

            if (amount <= 0) {
                return response.error(res, 'Le solde du propriétaire est déjà nul ou négatif.', 400);
            }

            // 2. Récupérer les coordonnées
            const { rows: userProfiles } = await client.query(
                'SELECT phone, full_name FROM user_profiles WHERE id = $1',
                [ownerId]
            );
            
            const rawPhone = customPhone || userProfiles[0]?.phone || '770000000';
            const phone = rawPhone.replace(/\D/g, '').slice(-9);

            const provider = customProvider || 'wave';
            let pdProvider = provider.toLowerCase();
            if (pdProvider === 'orange_money') pdProvider = 'orange-money-senegal';
            if (pdProvider === 'free_money') pdProvider = 'free-money-senegal';
            if (pdProvider === 'wave') pdProvider = 'wave-senegal';

            // 3. Calculs des frais (2.5% utilisateur, 2% PayDunya)
            const fee = amount * FEE_RATE_USER;
            const netAmount = amount - fee;

            await client.query('BEGIN');

            // 4. Créer la demande de retrait en statut 'pending'
            const { rows: wRows } = await client.query(
                `INSERT INTO withdrawals 
                (owner_id, amount, fee, net_amount, provider, recipient_details, status) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *`,
                [ownerId, amount, fee, netAmount, provider, phone, 'pending']
            );
            const withdrawalId = wRows[0].id;

            // 5. Mettre à jour le solde à 0
            await client.query(
                'UPDATE owner_profiles SET balance = 0, updated_at = NOW() WHERE id = $1',
                [ownerId]
            );

            // 6. Créer la transaction de grand livre en statut 'pending'
            const expectedPayDunyaFee = netAmount * FEE_RATE_PAYDUNYA;
            const estimatedSurplus = fee - expectedPayDunyaFee;

            await client.query(
                `INSERT INTO ledger_transactions 
                (owner_id, type, amount, fee, net_amount, platform_surplus, status, description, reference_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    ownerId, 'force_withdrawal', amount, fee, netAmount, estimatedSurplus, 'pending',
                    `Virement fait par l'admin`, withdrawalId
                ]
            );

            await client.query('COMMIT');

            // 7. Virement réel via PayDunya
            const isTestMode = process.env.PAYDUNYA_MODE === 'test';
            if (isTestMode) {
                // Simulation
                await client.query('BEGIN');
                await client.query("UPDATE withdrawals SET status = 'completed', transaction_id = $1 WHERE id = $2", [`FORCE-SIM-${Date.now()}`, withdrawalId]);
                await client.query("UPDATE ledger_transactions SET status = 'completed' WHERE reference_id = $1", [withdrawalId]);
                await client.query('COMMIT');

                return response.success(res, {
                    withdrawal_id: withdrawalId,
                    status: 'completed',
                    message: `Retrait forcé de ${amount} F CFA simulé avec succès.`
                });
            } else {
                // Production API PayDunya v2 - flux en 2 étapes
                const disburseBaseUrl = 'https://app.paydunya.com/api/v2/disburse';
                const backendUrl = process.env.BACKEND_URL || process.env.URL_BACKEND || process.env.API_URL || `https://${process.env.APP_DOMAIN || 'samalocation.com'}`;
                const callbackUrl = `${backendUrl}/api/payment/callback`;
                
                try {
                    // Étape 1 : Obtenir le jeton de virement (get-invoice)
                    const getInvoiceRes = await axios.post(`${disburseBaseUrl}/get-invoice`, {
                        amount: netAmount,
                        account_alias: phone,
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
                        disburse_id: String(withdrawalId)
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
                        
                        await client.query('BEGIN');
                        await client.query("UPDATE withdrawals SET status = 'completed', transaction_id = $1 WHERE id = $2", [transactionId, withdrawalId]);
                        await client.query("UPDATE ledger_transactions SET status = 'completed' WHERE reference_id = $1", [withdrawalId]);
                        await client.query('COMMIT');

                        return response.success(res, {
                            withdrawal_id: withdrawalId,
                            status: 'completed',
                            transaction_id: transactionId,
                            message: `Virement forcé effectué avec succès vers ${phone}.`
                        });
                    } else {
                        throw new Error(submitInvoiceRes.data.response_text || 'Échec de la soumission du virement.');
                    }
                } catch (apiError) {
                    console.error('Force transfer fail:', apiError.message);
                    if (apiError.response && apiError.response.data) {
                        console.error('Force transfer fail details:', JSON.stringify(apiError.response.data));
                    }
                    
                    await client.query('BEGIN');
                    await client.query("UPDATE withdrawals SET status = 'failed', error_message = $1 WHERE id = $2", [apiError.message, withdrawalId]);
                    await client.query("UPDATE ledger_transactions SET status = 'failed' WHERE reference_id = $1", [withdrawalId]);
                    await client.query("UPDATE owner_profiles SET balance = balance + $1 WHERE id = $2", [amount, ownerId]);
                    await client.query('COMMIT');

                    return response.error(res, `Le virement forcé a échoué : ${apiError.message}. Le solde a été restauré.`, 400);
                }
            }

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    },

    /**
     * Mettre à jour manuelle de l'abonnement d'un utilisateur
     */
    async updateUserSubscription(req, res, next) {
        try {
            const { userId } = req.params;
            const { planName, status, durationDays, price, subscriptionId, reason } = req.body;
            const Subscription = require('../models/subscriptionModel');
            const Notification = require('../models/notificationModel');

            const result = await Subscription.manualUpdate(userId, {
                planName,
                status,
                durationDays,
                price,
                subscriptionId,
                reason
            });

            // Envoyer une notification à l'utilisateur
            let title = 'Abonnement mis à jour';
            let message = `Votre abonnement a été mis à jour par l'administrateur.`;

            if (status === 'active') {
                title = 'Abonnement activé !';
                message = `L'administrateur a validé votre paiement. Vous profitez désormais du plan ${planName || 'Premium'} pour ${durationDays || 30} jours.`;
            } else if (status === 'rejected') {
                title = 'Demande d\'abonnement refusée';
                message = reason 
                    ? `Votre demande pour le plan ${planName || 'Premium'} a été refusée pour la raison suivante : ${reason}`
                    : `Votre demande pour le plan ${planName || 'Premium'} n'a pas pu être validée. Veuillez vérifier vos informations de paiement ou contacter le support.`;
            }

            await Notification.create({
                id: require('uuid').v4(),
                user_id: userId,
                type: 'system',
                title: title,
                message: message,
                link: '/owner-dashboard?tab=subscription'
            });

            return response.success(res, result, 'Abonnement mis à jour avec succès');
        } catch (error) {
            console.error('Error updating user subscription:', error);
            next(error);
        }
    },

    /**
     * Obtenir les dernières transactions (abonnements)
     */
    async getRecentTransactions(req, res, next) {
        try {
            const Subscription = require('../models/subscriptionModel');
            const limit = parseInt(req.query.limit) || 20;
            const transactions = await Subscription.findRecentTransactions(limit);
            return response.success(res, transactions);
        } catch (error) {
            console.error('Error getting recent transactions:', error);
            next(error);
        }
    },
    /**
     * Obtenir les événements récents (activités)
     */
    async getEvents(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;

            // On récupère plusieurs types d'événements et on les fusionne
            const [users, properties, reports, transactions] = await Promise.all([
                db.query(`
                    SELECT 'user' as type, full_name as title, role as detail, u.created_at
                    FROM user_profiles up 
                    JOIN users u ON up.id = u.id 
                    ORDER BY u.created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'property' as type, name as title, property_type as detail, created_at
                    FROM properties 
                    ORDER BY created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'report' as type, reason as title, status as detail, created_at
                    FROM reports 
                    ORDER BY created_at DESC LIMIT 10
                `),
                db.query(`
                    SELECT 'payment' as type, plan_name as title, price as detail, created_at
                    FROM subscriptions 
                    ORDER BY created_at DESC LIMIT 10
                `)
            ]);

            const events = [
                ...users.rows.map(r => ({ ...r, title: `Nouvel utilisateur: ${r.title}`, detail: r.detail === 'owner' ? 'Propriétaire' : 'Locataire' })),
                ...properties.rows.map(r => ({ ...r, title: `Nouveau bien: ${r.title}`, detail: r.detail })),
                ...reports.rows.map(r => ({ ...r, title: `Signalement: ${r.title}`, detail: r.detail === 'pending' ? 'En attente' : 'Traité' })),
                ...transactions.rows.map(r => ({ ...r, title: `Nouveau paiement: ${r.title}`, detail: `${r.detail} F CFA` }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);

            return response.success(res, events);
        } catch (error) {
            console.error('Error getting admin events:', error);
            next(error);
        }
    },
    /**
     * Obtenir les statistiques de fréquentation en direct
     */
    async getLiveAnalytics(req, res, next) {
        try {
            const Analytics = require('../models/analyticsModel');
            const stats = await Analytics.getVisitStats();
            return response.success(res, stats);
        } catch (error) {
            console.error('Error getting live analytics:', error);
            next(error);
        }
    },
    /**
     * Obtenir la performance et l'utilisation de l'IA avec filtres (par mois, par an, tout)
     */
    async getAIPerformance(req, res, next) {
        try {
            const period = req.query.period || 'all';
            const year = req.query.year ? parseInt(req.query.year) : null;
            const month = req.query.month ? parseInt(req.query.month) : null;

            const AIUsage = require('../models/aiUsageModel');
            const stats = await AIUsage.getStats({ period, year, month });

            return response.success(res, stats.map(s => ({
                action: s.action,
                count: parseInt(s.count),
                last_used: s.last_used,
                total_tokens: parseInt(s.total_tokens || 0)
            })));
        } catch (error) {
            console.error('Error getting AI performance:', error);
            next(error);
        }
    },
    /**
     * Obtenir tous les paramètres de la plateforme
     */
    async getPlatformSettings(req, res, next) {
        try {
            const PlatformSettings = require('../models/settingsModel');
            const settings = await PlatformSettings.getAll();
            return response.success(res, settings);
        } catch (error) {
            console.error('Error getting platform settings:', error);
            next(error);
        }
    },
    /**
     * Mettre à jour un paramètre spécifique
     */
    async updatePlatformSettings(req, res, next) {
        try {
            const { key, value } = req.body;
            if (!key) return response.error(res, "La clé du paramètre est requise.", 400);

            const PlatformSettings = require('../models/settingsModel');
            const result = await PlatformSettings.update(key, value);
            return response.success(res, result, 'Paramètre mis à jour avec succès');
        } catch (error) {
            console.error('Error updating platform setting:', error);
            next(error);
        }
    },
    /**
     * Audit et vérification d'un fichier PDF (Contrat ou Reçu) pour détecter les falsifications.
     */
    async verifyDocument(req, res, next) {
        try {
            if (!req.file) {
                return response.error(res, "Aucun fichier téléversé.", 400);
            }

            const { PDFParse } = require('pdf-parse');
            const crypto = require('crypto');
            const Contract = require('../models/contractModel');
            const Receipt = require('../models/receiptModel');

            // 1. Parser le document PDF
            const parser = new PDFParse({ data: req.file.buffer });
            const pdfData = await parser.getText();
            const text = pdfData.text;

            // 2. Détecter le type de document
            let docType = null;
            if (text.includes("CONTRAT DE BAIL") || text.includes("DÉSIGNATION DES PARTIES") || text.includes("DESIGNATION DES PARTIES") || text.includes("DUREE ET RELOCALISATION")) {
                docType = "contract";
            } else if (text.includes("REÇU DE PAIEMENT") || text.includes("RECU DE PAIEMENT") || text.includes("OBJET DU PAIEMENT") || text.includes("Loyer mensuel") || text.includes("Loyer journalier") || text.includes("Loyer hebdomadaire")) {
                docType = "receipt";
            }

            if (!docType) {
                return response.error(res, "Le document téléversé n'est pas reconnu comme un contrat ou un reçu Sama Location.", 400);
            }

            let report = {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                docType: docType,
                verified: false,
                databaseMatch: false,
                details: {}
            };

            if (docType === "contract") {
                // 3. Extraire les identifiants pour le contrat
                const contractNumMatch = text.match(/CONT-\d{4}-\d{4}/);
                const uuidMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                
                let contract = null;
                if (uuidMatch) {
                    contract = await Contract.findById(uuidMatch[0]);
                }
                if (!contract && contractNumMatch) {
                    const { rows } = await db.query('SELECT id FROM rental_contracts WHERE contract_number = $1', [contractNumMatch[0]]);
                    if (rows[0]) {
                        contract = await Contract.findById(rows[0].id);
                    }
                }

                if (!contract) {
                    report.details = {
                        contractNumber: { status: 'failed', expected: contractNumMatch ? contractNumMatch[0] : 'Inconnu', actual: 'Non trouvé en base de données' }
                    };
                    return response.success(res, report, "Document non identifié dans la base de données.");
                }

                report.databaseMatch = true;

                // 4. Comparaison croisée des champs clés
                const cleanText = text.replace(/\s+/g, ' '); // normaliser les espaces

                // a. Numéro de contrat
                const contractNumberMatch = cleanText.includes(contract.contract_number);
                
                // b. Bailleur
                const ownerNameMatch = cleanText.toLowerCase().includes(contract.owner_name.toLowerCase());
                
                // c. Locataire
                const tenantNameMatch = cleanText.toLowerCase().includes(contract.tenant_name.toLowerCase());
                
                // d. Loyer (vérifier plusieurs formats, ex: "250 000" et "250000")
                const rentAmountStr = Math.floor(contract.rent_amount).toString();
                const rentFormatted = rentAmountStr.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // ex: 250 000
                const rentAmountMatch = cleanText.includes(rentAmountStr) || cleanText.includes(rentFormatted);

                // e. Caution
                const depositAmountStr = Math.floor(contract.deposit_amount).toString();
                const depositFormatted = depositAmountStr.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // ex: 500 000
                const depositAmountMatch = cleanText.includes(depositAmountStr) || cleanText.includes(depositFormatted);

                // f. Hash de sécurité
                const textWithoutWhitespace = text.replace(/\s+/g, '');
                const hashMatch = textWithoutWhitespace.match(/Hashdesecurite:([a-f0-9]{64})/i) || 
                                  textWithoutWhitespace.match(/Hashdesécurité:([a-f0-9]{64})/i);
                
                let hashStatus = 'not_applicable';
                let pdfHash = null;
                let expectedHash = crypto.createHash('sha256').update(`${contract.contract_number}${contract.id}`).digest('hex');

                if (hashMatch && hashMatch[1]) {
                    pdfHash = hashMatch[1];
                    if (pdfHash === expectedHash) {
                        hashStatus = 'success';
                    } else {
                        hashStatus = 'failed';
                    }
                }

                // Déterminer la conformité finale
                const allFieldsMatch = contractNumberMatch && ownerNameMatch && tenantNameMatch && rentAmountMatch && depositAmountMatch && (hashStatus !== 'failed');
                report.verified = allFieldsMatch;

                report.details = {
                    contractNumber: { status: contractNumberMatch ? 'success' : 'failed', expected: contract.contract_number, actual: contractNumMatch ? contractNumMatch[0] : 'Introuvable' },
                    ownerName: { status: ownerNameMatch ? 'success' : 'failed', expected: contract.owner_name, actual: ownerNameMatch ? contract.owner_name : 'Modifié ou absent' },
                    tenantName: { status: tenantNameMatch ? 'success' : 'failed', expected: contract.tenant_name, actual: tenantNameMatch ? contract.tenant_name : 'Modifié ou absent' },
                    rentAmount: { status: rentAmountMatch ? 'success' : 'failed', expected: `${rentFormatted} FCFA`, actual: rentAmountMatch ? `${rentFormatted} FCFA` : 'Modifié ou absent' },
                    depositAmount: { status: depositAmountMatch ? 'success' : 'failed', expected: `${depositFormatted} FCFA`, actual: depositAmountMatch ? `${depositFormatted} FCFA` : 'Modifié ou absent' },
                    securityHash: { status: hashStatus, expected: expectedHash, actual: pdfHash || (hashStatus === 'failed' ? 'Invalide' : 'Absent dans le PDF') }
                };

            } else if (docType === "receipt") {
                // 3. Extraire les identifiants pour le reçu
                const receiptNumMatch = text.match(/REC-\d{6}-\d{4}/);
                const uuidMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

                let receipt = null;
                if (uuidMatch) {
                    receipt = await Receipt.findById(uuidMatch[0]);
                }
                if (!receipt && receiptNumMatch) {
                    const { rows } = await db.query('SELECT id FROM receipts WHERE receipt_number = $1', [receiptNumMatch[0]]);
                    if (rows[0]) {
                        receipt = await Receipt.findById(rows[0].id);
                    }
                }

                if (!receipt) {
                    report.details = {
                        receiptNumber: { status: 'failed', expected: receiptNumMatch ? receiptNumMatch[0] : 'Inconnu', actual: 'Non trouvé en base de données' }
                    };
                    return response.success(res, report, "Document non identifié dans la base de données.");
                }

                report.databaseMatch = true;

                // 4. Comparaison croisée des champs clés
                const cleanText = text.replace(/\s+/g, ' ');

                // a. Numéro de reçu
                const receiptNumberMatch = cleanText.includes(receipt.receipt_number);

                // b. Propriétaire (Bailleur)
                const ownerNameMatch = cleanText.toLowerCase().includes(receipt.owner_name.toLowerCase());

                // c. Locataire
                const tenantNameMatch = cleanText.toLowerCase().includes(receipt.tenant_name.toLowerCase());

                // d. Montant payé (ex: 250000 et 250 000)
                const amountStr = Math.floor(receipt.amount).toString();
                const amountFormatted = amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                const amountMatch = cleanText.includes(amountStr) || cleanText.includes(amountFormatted);

                // e. Période / Date de paiement
                const paymentDateFormatted = new Date(receipt.payment_date).toLocaleDateString('fr-FR');
                const paymentDateMatch = cleanText.includes(paymentDateFormatted) || cleanText.includes(new Date(receipt.payment_date).getFullYear().toString());

                // f. Hash de sécurité (optionnel pour les anciens reçus)
                const textWithoutWhitespace = text.replace(/\s+/g, '');
                const hashMatch = textWithoutWhitespace.match(/Hashdesecurite:([a-f0-9]{64})/i) || 
                                  textWithoutWhitespace.match(/Hashdesécurité:([a-f0-9]{64})/i);

                let hashStatus = 'not_applicable';
                let pdfHash = null;
                let expectedHash = crypto.createHash('sha256').update(`${receipt.receipt_number}${receipt.id}${receipt.amount}`).digest('hex');

                if (hashMatch && hashMatch[1]) {
                    pdfHash = hashMatch[1];
                    if (pdfHash === expectedHash) {
                        hashStatus = 'success';
                    } else {
                        hashStatus = 'failed';
                    }
                }

                // Déterminer la conformité finale
                const allFieldsMatch = receiptNumberMatch && ownerNameMatch && tenantNameMatch && amountMatch && (hashStatus !== 'failed');
                report.verified = allFieldsMatch;

                report.details = {
                    receiptNumber: { status: receiptNumberMatch ? 'success' : 'failed', expected: receipt.receipt_number, actual: receiptNumMatch ? receiptNumMatch[0] : 'Introuvable' },
                    ownerName: { status: ownerNameMatch ? 'success' : 'failed', expected: receipt.owner_name, actual: ownerNameMatch ? receipt.owner_name : 'Modifié ou absent' },
                    tenantName: { status: tenantNameMatch ? 'success' : 'failed', expected: receipt.tenant_name, actual: tenantNameMatch ? receipt.tenant_name : 'Modifié ou absent' },
                    amount: { status: amountMatch ? 'success' : 'failed', expected: `${amountFormatted} FCFA`, actual: amountMatch ? `${amountFormatted} FCFA` : 'Modifié ou absent' },
                    paymentDate: { status: paymentDateMatch ? 'success' : 'failed', expected: paymentDateFormatted, actual: paymentDateMatch ? 'Vérifiée dans le document' : 'Non détectée' },
                    securityHash: { status: hashStatus, expected: expectedHash, actual: pdfHash || (hashStatus === 'failed' ? 'Invalide' : 'Absent dans le PDF') }
                };
            }

            return response.success(res, report, "Vérification du document effectuée.");
        } catch (error) {
            console.error('Error verifying document:', error);
            next(error);
        }
    },

    /**
     * Récupérer tous les reçus de loyer (admin uniquement)
     */
    async getAllReceipts(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';
            const year = req.query.year && req.query.year !== 'all' ? parseInt(req.query.year) : null;

            let query = `
                SELECT r.id, r.receipt_number, r.amount, r.payment_date, r.payment_method, r.month, r.year, r.currency,
                       r.tenant_name, r.owner_name, p.name as property_name, lt.reference_id as paydunya_token
                FROM receipts r
                LEFT JOIN properties p ON r.property_id = p.id
                LEFT JOIN ledger_transactions lt ON lt.owner_id = p.owner_id 
                   AND ABS(EXTRACT(EPOCH FROM (lt.created_at - r.created_at))) < 10
                   AND lt.amount = r.amount 
                   AND lt.type = 'pay_rent'
            `;
            const conditions = [];
            const params = [];

            if (search) {
                params.push(`%${search}%`);
                conditions.push(`(r.receipt_number ILIKE $${params.length} 
                    OR r.tenant_name ILIKE $${params.length} 
                    OR r.owner_name ILIKE $${params.length} 
                    OR p.name ILIKE $${params.length})`);
            }

            if (year) {
                params.push(year);
                conditions.push(`(r.year = $${params.length} OR EXTRACT(YEAR FROM r.created_at) = $${params.length})`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            query += ` ${whereClause}`;

            let countQuery = `SELECT COUNT(*) FROM receipts r LEFT JOIN properties p ON r.property_id = p.id ${whereClause}`;
            const { rows: countRows } = await db.query(countQuery, params);
            const total = parseInt(countRows[0]?.count || 0);

            query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const { rows: receipts } = await db.query(query, params);

            return response.success(res, {
                receipts,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    current_page: page,
                    limit
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = adminController;
