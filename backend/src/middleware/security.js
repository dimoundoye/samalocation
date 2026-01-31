/**
 * Middleware de sécurité personnalisé
 */

const securityMiddleware = {
    /**
     * Empêche la pollution des paramètres HTTP (HPP)
     * Très basique: si un paramètre est un tableau alors qu'il devrait être une chaîne, on prend la dernière valeur
     */
    preventHPP: (req, res, next) => {
        if (req.query) {
            for (const key in req.query) {
                if (Array.isArray(req.query[key])) {
                    req.query[key] = req.query[key][req.query[key].length - 1];
                }
            }
        }
        next();
    },

    /**
     * Nettoyage basique contre les injections XSS dans le body
     */
    sanitizeInput: (req, res, next) => {
        const sanitize = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    // Supprime les balises <script> et évite les injections basiques
                    obj[key] = obj[key].replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
                    obj[key] = obj[key].replace(/on\w+="[^"]*"/gim, "");
                    obj[key] = obj[key].replace(/javascript:[^"]*/gim, "");
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
        };

        if (req.body) sanitize(req.body);
        if (req.query) sanitize(req.query);
        if (req.params) sanitize(req.params);

        next();
    }
};

module.exports = securityMiddleware;
