const response = require('../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Toujours logger l'erreur réelle côté serveur pour le débogage
    console.error(`[Error] ${err.stack || err.message}`);

    const statusCode = err.statusCode || 500;

    // Si c'est une erreur 500, on utilise un message générique
    // Sinon on peut garder le message (ex: 400 Bad Request, 401 Unauthorized) car ils sont souvent fonctionnels
    const message = statusCode === 500 ? 'Une erreur interne est survenue' : (err.message || 'Une erreur est survenue');

    return response.error(res, message, statusCode, null);
};

module.exports = errorHandler;
