/**
 * Fonctionnalités activables par variable d'environnement.
 */

// Paiement du loyer en ligne + portefeuille propriétaire + retraits.
// Désactivé par défaut : la plateforme ne doit pas détenir l'argent des loyers.
const RENT_ONLINE_PAYMENT_ENABLED = process.env.RENT_ONLINE_PAYMENT_ENABLED === 'true';

const response = require('../utils/response');

/**
 * Middleware : bloque la route si le paiement de loyer en ligne est désactivé.
 */
const requireRentOnlinePayment = (req, res, next) => {
    if (!RENT_ONLINE_PAYMENT_ENABLED) {
        return response.error(res, 'Le paiement du loyer en ligne est momentanément indisponible.', 403);
    }
    next();
};

module.exports = { RENT_ONLINE_PAYMENT_ENABLED, requireRentOnlinePayment };
