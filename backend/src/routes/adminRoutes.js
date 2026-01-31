const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

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

module.exports = router;
