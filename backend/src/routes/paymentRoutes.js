const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payment/request
 * @desc    Initialise une demande de paiement PayTech
 * @access  Private (Owner/User)
 */
router.post('/request', authMiddleware, paymentController.initializePayment);

/**
 * @route   POST /api/payment/ipn
 * @desc    Notification instantanée de paiement (WebHook PayTech)
 * @access  Public (Appelé par PayTech)
 */
router.post('/ipn', paymentController.handleIPN);

module.exports = router;
