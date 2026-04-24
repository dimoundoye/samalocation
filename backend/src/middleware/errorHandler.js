const response = require('../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Toujours logger l'erreur réelle côté serveur pour le débogage
    console.error(`[Error] ${err.name || 'Internal'}: ${err.message}`);
    
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Une erreur interne est survenue';

    // Gestion spécifique des erreurs JWT
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Session invalide. Veuillez vous reconnecter.';
    } else if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Le fichier est trop volumineux (max 15MB).';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Nombre maximum de fichiers dépassé.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Nombre de photos maximum dépassé ou champ invalide.';
        } else {
            message = `Erreur de téléchargement: ${err.message}`;
        }
    }

    // Protection contre la fuite d'informations DB en production
    if (statusCode === 500) {
        message = 'Une erreur interne est survenue';
    }

    return response.error(res, message, statusCode, null);
};

module.exports = errorHandler;
