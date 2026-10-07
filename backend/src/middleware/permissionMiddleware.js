const response = require('../utils/response');

/**
 * Exige que l'utilisateur ait toutes les permissions données dans son organisation active.
 * À placer après authMiddleware (qui remplit req.org et req.permissions).
 *
 * Exemple : router.get('/analytics', can('finance.read'), controller.getAnalytics)
 */
const can = (...permissions) => (req, res, next) => {
    if (!req.org) {
        return response.error(res, "Cette action nécessite un espace propriétaire ou agence.", 403);
    }

    const missing = permissions.filter(p => !req.permissions.has(p));
    if (missing.length > 0) {
        return response.error(res, "Vous n'avez pas la permission d'effectuer cette action dans cet espace.", 403);
    }

    next();
};

module.exports = { can };
