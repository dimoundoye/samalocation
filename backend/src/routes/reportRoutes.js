const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les locataires
router.post('/', reportController.createReport);

// Routes pour les admins
router.get('/', reportController.getAllReports);
router.get('/stats', reportController.getStatistics);
router.patch('/:id', reportController.updateReport);

module.exports = router;
