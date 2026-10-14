const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { verifyToken } = require('../utils/auth');

// Connexion facultative : un visiteur connecté est reconnu, sinon le signalement est anonyme
// (un jeton expiré ou invalide ne bloque pas le signalement, il est simplement ignoré)
const optionalAuthenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ') && verifyToken(auth.slice(7))) {
        return authenticate(req, res, next);
    }
    return next();
};

// Signalements sans compte : limite par connexion (large, beaucoup d'abonnés mobiles partagent la même IP)
const propertyReportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    validate: false,
    keyGenerator: (req) => rateLimit.ipKeyGenerator(req.ip),
    handler: (req, res) => res.status(429).json({ status: 'error', message: 'Trop de signalements envoyés. Réessayez dans une heure.' })
});

// Signaler une annonce publiée : ouvert à tous, avec ou sans compte
router.post('/property', propertyReportLimiter, optionalAuthenticate, reportController.createPropertyReport);

// Toutes les autres routes nécessitent une authentification
router.use(authenticate);

// Routes pour les locataires
router.post('/', reportController.createReport);

// Routes pour les admins
router.get('/', adminMiddleware, reportController.getAllReports);
router.get('/stats', adminMiddleware, reportController.getStatistics);
router.patch('/:id', adminMiddleware, reportController.updateReport);

module.exports = router;
