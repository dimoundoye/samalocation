const response = require('../utils/response');

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
const adminMiddleware = async (req, res, next) => {
    try {
        // L'authMiddleware doit être appelé avant ce middleware
        if (!req.user || !req.user.id) {
            return response.error(res, 'Not authenticated', 401);
        }

        // Vérifier le rôle
        const db = require('../config/db');
        const [users] = await db.query(
            'SELECT role FROM user_profiles WHERE id = ?',
            [req.user.id]
        );

        if (!users || users.length === 0) {
            return response.error(res, 'User not found', 404);
        }

        if (users[0].role !== 'admin') {
            return response.error(res, 'Access denied. Admin role required.', 403);
        }

        // L'utilisateur est admin, continuer
        next();
    } catch (error) {
        console.error('Error in admin middleware:', error);
        return response.error(res, 'Internal server error', 500);
    }
};

module.exports = adminMiddleware;
