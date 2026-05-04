const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payment/request
 * @desc    Initialise une demande de paiement PayDunya
 * @access  Private (Owner/User)
 */
router.post('/request', authMiddleware, paymentController.initializePayment);

/**
 * @route   POST /api/payment/callback
 * @desc    Notification instantanée de paiement (WebHook PayDunya)
 * @access  Public (Appelé par PayDunya)
 */
router.post('/callback', paymentController.handleCallback);

// Alias pour rétro-compatibilité ou erreur de config
router.post('/ipn', paymentController.handleCallback);

module.exports = router;
