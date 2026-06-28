const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // limit to 10MB for safety
});

// Toutes les routes nécessitent l'authentification ET le rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Statistiques générales
router.get('/statistics', adminController.getStatistics);

// Derniers utilisateurs
router.get('/users/recent', adminController.getRecentUsers);

// Croissance des utilisateurs
router.get('/users/growth', adminController.getUserGrowth);

// Vue d'ensemble des propriétés
router.get('/properties/overview', adminController.getPropertiesOverview);

// Toutes les propriétés
router.get('/properties', adminController.getAllProperties);

// Vérifications d'identité
router.get('/verifications/pending', adminController.getPendingVerifications);
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/:ownerId/status', adminController.updateVerificationStatus);
router.patch('/users/:userId/subscription', adminController.updateUserSubscription);

// Transactions et revenus
router.get('/revenue-stats', adminController.getRevenueStats);
router.get('/transactions', adminController.getRecentTransactions);

// Activité en temps réel (flux d'événements)
router.get('/events', adminController.getEvents);

// Analytics en direct
router.get('/analytics/live', adminController.getLiveAnalytics);

// Paramètres de la plateforme
router.get('/platform/settings', adminController.getPlatformSettings);
router.patch('/platform/settings', adminController.updatePlatformSettings);

// Outil d'audit et vérification de documents PDF (Anti-fraude)
router.post('/verify-document', upload.single('file'), adminController.verifyDocument);

module.exports = router;
