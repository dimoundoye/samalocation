const { verifyToken } = require('../utils/auth');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    // Vérifier si l'utilisateur est bloqué
    try {
        const isBlocked = await User.isBlocked(decoded.id);
        if (isBlocked) {
            return res.status(403).json({
                status: 'error',
                message: 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.'
            });
        }
    } catch (error) {
        console.error('Error checking user block status:', error);
    }

    req.user = decoded;
    next();
};

module.exports = authMiddleware;
