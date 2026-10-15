const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

router.use(authMiddleware);

// Propriétaire : coordonnées de paiement du loyer (Wave, Orange Money, virement)
router.get('/methods', can('org.settings'), paymentMethodController.getMyMethods);
router.put('/methods', can('org.settings'), paymentMethodController.updateMyMethods);

// Locataire : coordonnées de son bailleur, pendant un bail actif
router.get('/lease/:leaseId', paymentMethodController.getLeasePaymentInfo);

module.exports = router;
