const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les locataires
router.post('/', reportController.createReport);

// Routes pour les admins
router.get('/', adminMiddleware, reportController.getAllReports);
router.get('/stats', adminMiddleware, reportController.getStatistics);
router.patch('/:id', adminMiddleware, reportController.updateReport);

module.exports = router;
