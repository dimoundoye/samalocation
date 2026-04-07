const db = require('../config/db');

const Subscription = {
    /**
     * Récupère l'abonnement ACTIF d'un utilisateur (validé et non expiré)
     */
    async findActiveByUserId(userId) {
        const { rows } = await db.query(`
            SELECT * FROM subscriptions 
            WHERE user_id = $1 
            AND status = 'active'
            AND (expires_at > (NOW() - INTERVAL '3 days') OR expires_at IS NULL)
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId]);
        return rows[0] || null;
    },

    /**
     * Récupère la demande d'abonnement la plus récente (active ou en attente)
     */
    async findLatestByUserId(userId) {
        const { rows } = await db.query(`
            SELECT * FROM subscriptions 
            WHERE user_id = $1 
            AND status IN ('active', 'pending')
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId]);
        return rows[0] || null;
    },

    /**
     * Crée une demande d'abonnement en attente de validation manuelle
     */
    async createPending(userId, data) {
        const { planName, price, transactionId, senderPhone } = data;

        // On peut avoir plusieurs demandes en attente, mais on ne garde que la dernière active
        const { rows } = await db.query(`
            INSERT INTO subscriptions (
                user_id, plan_name, status, price, 
                payment_method, transaction_id, sender_phone, created_at
            ) 
            VALUES ($1, $2, 'pending', $3, 'wave_manual', $4, $5, NOW()) 
            RETURNING *
        `, [
            userId,
            planName,
            price,
            transactionId,
            senderPhone
        ]);

        return rows[0];
    },

    /**
     * Récupère tout l'historique des abonnements d'un utilisateur
     */
    async findAllByUserId(userId) {
        const { rows } = await db.query(
            'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    /**
     * Récupère les dernières transactions (dernière entrée par utilisateur pour éviter les doublons visuels)
     */
    async findRecentTransactions(limit = 20) {
        const { rows } = await db.query(`
            SELECT 
                s.*, 
                up.full_name as user_name, 
                up.email as user_email, 
                up.phone as user_phone
            FROM subscriptions s
            JOIN user_profiles up ON s.user_id = up.id
            ORDER BY s.created_at DESC
            LIMIT $1
        `, [limit]);

        return rows;
    },

    /**
     * Crée (ou renouvelle) un abonnement suite à un paiement réussi
     */
    async createSubscription(userId, data) {
        const {
            planName,
            price,
            paymentMethod,
            transactionId,
            durationDays
        } = data;

        // On cherche la date d'expiration la plus lointaine parmi TOUS les abonnements actifs
        const { rows: maxRows } = await db.query(`
            SELECT MAX(expires_at) as max_expiration 
            FROM subscriptions 
            WHERE user_id = $1 AND status = 'active'
            AND (expires_at > NOW() OR expires_at IS NULL)
        `, [userId]);
        
        let startDate = new Date();
        const maxExpiration = maxRows[0]?.max_expiration;
        
        // Si on a déjà une date d'expiration dans le futur, on cumule à partir de là
        if (maxExpiration && new Date(maxExpiration) > new Date()) {
            startDate = new Date(maxExpiration);
        }

        // On expire l'ancien abonnement s'il y en a un
        await db.query(`
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        // On crée le nouvel abonnement
        const expiresAt = new Date(startDate);
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        const { rows } = await db.query(`
            INSERT INTO subscriptions (
                user_id, plan_name, status, price, 
                payment_method, transaction_id, expires_at
            ) 
            VALUES ($1, $2, 'active', $3, $4, $5, $6) 
            RETURNING *
        `, [
            userId,
            planName,
            price,
            paymentMethod,
            transactionId,
            expiresAt
        ]);

        return rows[0];
    },

    /**
     * Mise à jour manuelle d'un abonnement par l'administrateur
     */
    async manualUpdate(userId, data) {
        const { planName, status, durationDays, price, subscriptionId, reason } = data;
        const PLANS = require('../config/plans');

        // 1. Déterminer la date de début (Upgrade = Immédiat, Downgrade/Renouvellement = Cumulé)
        const { rows: maxRows } = await db.query(`
            SELECT MAX(expires_at) as max_expiration 
            FROM subscriptions 
            WHERE user_id = $1 AND status = 'active'
            AND (expires_at > NOW() OR expires_at IS NULL)
        `, [userId]);
        
        let startDate = new Date();
        const maxExpiration = maxRows[0]?.max_expiration;
        
        if (status === 'active' && maxExpiration && new Date(maxExpiration) > new Date()) {
            const activeSub = await this.findActiveByUserId(userId); // Juste pour connaître l'ancien plan
            const oldPlanKey = activeSub?.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE';
            const newPlanKey = planName ? planName.toUpperCase() : 'FREE';
            
            const oldPlan = PLANS[oldPlanKey === 'PROFESSIONNEL' || oldPlanKey === 'PROFESSIONEL' ? 'PROFESSIONAL' : oldPlanKey] || PLANS.FREE;
            const newPlan = PLANS[newPlanKey === 'PROFESSIONNEL' || newPlanKey === 'PROFESSIONEL' ? 'PROFESSIONAL' : newPlanKey] || PLANS.FREE;
 
            // Si c'est un upgrade (nouveau plan plus cher), on commence AUJOURD'HUI
            // Si c'est le même plan ou un downgrade (moins cher), on CUMULE à la fin
            if (newPlan.price_monthly <= oldPlan.price_monthly) {
                startDate = new Date(maxExpiration);
            }
        }

        // On expire l'ancien abonnement ACTIF s'il y en a un (indispensable si upgrade immédiat)
        if (status === 'active') {
            await db.query(`
                UPDATE subscriptions 
                SET status = 'expired' 
                WHERE user_id = $1 AND status = 'active'
                ${subscriptionId ? 'AND id != $2' : ''}
            `, subscriptionId ? [userId, subscriptionId] : [userId]);
        }

        if (status === 'rejected' || status === 'expired' || status === 'inactive') {
            const targetStatus = status === 'rejected' ? 'rejected' : 'expired';
            
            // Si un ID spécifique est fourni, on ne met à jour que celui-là
            if (subscriptionId) {
                await db.query(`
                    UPDATE subscriptions SET status = $1, admin_notes = $2, updated_at = NOW() 
                    WHERE id = $3 AND user_id = $4
                `, [targetStatus, reason || null, subscriptionId, userId]);
            } else {
                // Sinon on rejette toutes les demandes en attente
                await db.query(`
                    UPDATE subscriptions 
                    SET status = $1, admin_notes = $2, updated_at = NOW() 
                    WHERE user_id = $3 AND status = 'pending'
                `, [targetStatus, reason || null, userId]);
            }
            return { status: targetStatus };
        }

        // Préparer la date d'expiration finale
        const expiresAt = new Date(startDate);
        expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

        // 2. Vérifier s'il existe un abonnement 'pending' pour cet utilisateur
        // Priorité à l'ID spécifique s'il est fourni
        let pendingSubId = subscriptionId;
        
        if (!pendingSubId) {
            const { rows: pendingSubs } = await db.query(`
                SELECT id FROM subscriptions 
                WHERE user_id = $1 AND status = 'pending' 
                ORDER BY created_at DESC LIMIT 1
            `, [userId]);
            if (pendingSubs.length > 0) {
                pendingSubId = pendingSubs[0].id;
            }
        }

        if (pendingSubId) {
            console.log(`✅ Approving subscription ${pendingSubId} for user ${userId}`);
            const { rows } = await db.query(`
                UPDATE subscriptions 
                SET 
                    plan_name = $1,
                    status = 'active',
                    price = $2,
                    expires_at = $3,
                    admin_notes = NULL,
                    updated_at = NOW()
                WHERE id = $4 AND user_id = $5
                RETURNING *
            `, [
                planName || 'PREMIUM',
                price || 0,
                expiresAt,
                pendingSubId,
                userId
            ]);
            
            if (rows.length > 0) return rows[0];
        }

        // 3. Si aucun abonnement en attente n'est trouvé, on crée un nouvel abonnement 'manuel'
        console.log(`📝 Creating new manual subscription for user ${userId}`);
        const { rows } = await db.query(`
            INSERT INTO subscriptions (
                user_id, plan_name, status, price, 
                payment_method, transaction_id, expires_at, created_at
            ) 
            VALUES ($1, $2, 'active', $3, 'manual_admin', 'ADMIN_MANUAL', $4, NOW()) 
            RETURNING *
        `, [
            userId,
            planName || 'PREMIUM',
            price || 0,
            expiresAt
        ]);

        return rows[0];
    },

    /**
     * Vérifie si un utilisateur a le droit d'effectuer une action (ex: générer un PDF)
     * en fonction de son abonnement actuel.
     */
    async hasAccessToFeature(userId, featureName) {
        const PLANS = require('../config/plans');
        const activeSub = await this.findActiveByUserId(userId);

        // Obtenir la config du plan actuel (ou FREE)
        let planKey = activeSub ? activeSub.plan_name.toUpperCase() : 'FREE';
        
        // Normalisation pour Professionnel -> PROFESSIONAL
        if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
        
        const planConfig = PLANS[planKey];

        if (!planConfig) return false;

        // Vérification par fonctionnalité
        switch (featureName) {
            case 'ai_description': {
                if (planConfig.limits.ai_descriptions_per_month === Infinity) return true;
                if (planConfig.limits.ai_descriptions_per_month === 0) return false;

                // Compter les utilisations ce mois-ci
                const AIUsage = require('./aiUsageModel');
                const { rows } = await db.query(`
                    SELECT COUNT(*) FROM ai_usage_logs 
                    WHERE user_id = $1 
                    AND action = 'description_generation'
                    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                `, [userId]);
                const count = parseInt(rows[0].count);
                return count < planConfig.limits.ai_descriptions_per_month;
            }
            case 'custom_branding':
                return planConfig.limits.custom_branding;
            case 'excel_reports':
                return planConfig.limits.excel_reports;
            case 'unlimited_receipts':
                return planConfig.limits.max_receipts_per_month === Infinity;
            case 'multi_user':
                return planConfig.limits.multi_user;
            case 'inventory_contract':
                return planConfig.limits.inventory_contract;
            default:
                return true;
        }
    },

    async migrate() {
        try {
            await db.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL");
            console.log('✅ Migration: admin_notes column added to subscriptions table');
        } catch (err) {
            console.error('Migration error (subscriptions):', err.message);
        }
    }
};

module.exports = Subscription;
