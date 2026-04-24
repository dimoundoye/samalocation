const Subscription = require('../models/subscriptionModel');
const PLANS = require('../config/plans');
const response = require('../utils/response');

/**
 * Middleware pour limiter l'accès aux fonctionnalités selon l'abonnement
 * @param {string} featureName - Le nom de la fonctionnalité à vérifier
 */
const checkFeatureAccess = (featureName) => {
    return async (req, res, next) => {
        try {
            const ownerId = req.ownerId;
            const hasAccess = await Subscription.hasAccessToFeature(ownerId, featureName);

            if (!hasAccess) {
                return response.error(res, "Cette fonctionnalité n'est pas disponible avec votre abonnement actuel.", 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware pour limiter le nombre de propriétés
 */
const checkPropertyLimit = async (req, res, next) => {
    try {
        const ownerId = req.ownerId;
        const activeSub = await Subscription.findActiveByUserId(ownerId);

        // Obtenir le plan configuré (ou FREE par défaut)
        let planKey = activeSub ? activeSub.plan_name.toUpperCase() : 'FREE';
        
        // Normalisation pour Professionnel -> PROFESSIONAL
        if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
        
        const planConfig = PLANS[planKey];

        const db = require('../config/db');
        const { rows } = await db.query('SELECT COUNT(*) FROM properties WHERE owner_id = $1', [ownerId]);
        const currentCount = parseInt(rows[0].count);

        if (currentCount >= planConfig.limits.max_properties) {
            return response.error(res, `Vous avez atteint la limite de ${planConfig.limits.max_properties} propriétés pour votre plan ${planConfig.name}. Passez au plan supérieur pour en ajouter plus.`, 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware pour limiter le nombre de locataires
 */
const checkTenantLimit = async (req, res, next) => {
    try {
        const ownerId = req.ownerId;
        const activeSub = await Subscription.findActiveByUserId(ownerId);
        let planKey = activeSub ? activeSub.plan_name.toUpperCase() : 'FREE';

        // Normalisation pour Professionnel -> PROFESSIONAL
        if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';

        const planConfig = PLANS[planKey];

        // Pour l'instant, la limite de locataires n'est pas explicitement dans plans.js
        // mais on peut la déduire ou l'ajouter. 
        // Si max_properties est limité, on limite souvent aussi les locataires.
        // On va utiliser max_properties comme proxy ou autoriser selon le plan.

        const db = require('../config/db');
        const { rows } = await db.query(`
            SELECT COUNT(*) FROM tenants t
            JOIN property_units pu ON t.unit_id = pu.id
            JOIN properties p ON pu.property_id = p.id
            WHERE p.owner_id = $1
        `, [ownerId]);
        const currentCount = parseInt(rows[0].count);

        const maxTenants = planConfig.limits.max_tenants;

        if (currentCount >= maxTenants && maxTenants !== Infinity) {
            return response.error(res, `Vous avez atteint la limite de ${maxTenants} locataires pour votre plan ${planConfig.name}. Passez au plan supérieur pour en ajouter plus.`, 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware pour limiter les reçus mensuels
 */
const checkReceiptLimit = async (req, res, next) => {
    try {
        const ownerId = req.ownerId;
        const activeSub = await Subscription.findActiveByUserId(ownerId);
        let planKey = activeSub ? activeSub.plan_name.toUpperCase() : 'FREE';

        // Normalisation pour Professionnel -> PROFESSIONAL
        if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';

        const planConfig = PLANS[planKey];

        if (planConfig.limits.max_receipts_per_month === Infinity) {
            return next();
        }

        const db = require('../config/db');
        const { rows } = await db.query(`
            SELECT COUNT(*) FROM receipts r
            JOIN properties p ON r.property_id = p.id
            WHERE p.owner_id = $1 
            AND EXTRACT(MONTH FROM r.created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR FROM r.created_at) = EXTRACT(YEAR FROM NOW())
        `, [ownerId]);

        const currentMonthCount = parseInt(rows[0].count);

        if (currentMonthCount >= planConfig.limits.max_receipts_per_month) {
            return response.error(res, `Limite de ${planConfig.limits.max_receipts_per_month} reçus par mois atteinte pour le plan ${planConfig.name}.`, 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkFeatureAccess,
    checkPropertyLimit,
    checkTenantLimit,
    checkReceiptLimit
};
