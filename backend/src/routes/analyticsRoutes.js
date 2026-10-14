const express = require('express');
const rateLimit = require('express-rate-limit');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Large (beaucoup d'abonnés mobiles partagent la même IP au Sénégal), mais empêche de gonfler les chiffres en masse
const hitLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 600,
    validate: false,
    keyGenerator: (req) => rateLimit.ipKeyGenerator(req.ip),
    handler: (req, res) => res.status(204).end()
});

router.post('/hit', hitLimiter, analyticsController.recordHit);

module.exports = router;
