const PlatformSettings = require('../models/settingsModel');
const response = require('../utils/response');

/**
 * Middleware pour bloquer l'accès au site en mode maintenance
 */
const maintenanceMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        let isAdmin = false;

        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                // On essaie de d'extraire le role du token
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_jwt_secret_ici');
                if (decoded && (decoded.role === 'admin' || decoded.user?.role === 'admin')) {
                    isAdmin = true;
                }
            } catch (e) {}
        }

        const isCriticalRoute = req.originalUrl.startsWith('/api/admin') || 
                                req.originalUrl.includes('/api/auth/login');

        if (isAdmin || isCriticalRoute) {
            return next();
        }

        const maintenanceMode = await PlatformSettings.get('maintenance_mode');

        if (maintenanceMode === true || maintenanceMode === 'true') {
            return response.error(res, "Le site est actuellement en maintenance.", 503);
        }

        next();
    } catch (error) {
        console.error('Maintenance middleware error:', error);
        next(); // On laisse passer en cas d'erreur de config pour éviter de tout casser
    }
};

module.exports = { maintenanceMiddleware };
