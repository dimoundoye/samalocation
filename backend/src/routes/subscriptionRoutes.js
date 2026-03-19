const express = require('express');
const router = express.Router();
const subController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/my-subscription', subController.getMySubscription);
router.post('/notify-payment', subController.notifyPayment);

module.exports = router;
