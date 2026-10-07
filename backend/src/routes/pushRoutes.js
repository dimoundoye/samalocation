const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const PushSubscription = require('../models/pushSubscriptionModel');
const pushService = require('../utils/pushService');
const response = require('../utils/response');

// Un endpoint Web Push est toujours une URL https fournie par le service push du navigateur
const isValidSubscription = (sub) =>
    sub && typeof sub.endpoint === 'string' && sub.endpoint.startsWith('https://') && sub.endpoint.length <= 2048
    && sub.keys && typeof sub.keys.p256dh === 'string' && typeof sub.keys.auth === 'string'
    && sub.keys.p256dh.length <= 256 && sub.keys.auth.length <= 256;

// Clé publique VAPID nécessaire au navigateur pour s'abonner
router.get('/public-key', (req, res) => {
    if (!pushService.isEnabled()) {
        return response.error(res, 'Notifications push non configurées', 503);
    }
    return response.success(res, { publicKey: pushService.getPublicKey() });
});

// Abonne l'appareil courant au compte connecté
router.post('/subscribe', authMiddleware, async (req, res, next) => {
    try {
        const { subscription } = req.body;
        if (!isValidSubscription(subscription)) {
            return response.error(res, 'Abonnement invalide', 400);
        }
        const userAgent = String(req.headers['user-agent'] || '').slice(0, 255) || null;
        await PushSubscription.upsert(req.user.id, subscription, userAgent);
        return response.success(res, null, 'Notifications activées', 201);
    } catch (error) {
        next(error);
    }
});

// Désabonne l'appareil courant (désactivation ou déconnexion)
router.post('/unsubscribe', authMiddleware, async (req, res, next) => {
    try {
        const { endpoint } = req.body;
        if (typeof endpoint !== 'string' || !endpoint) {
            return response.error(res, 'endpoint requis', 400);
        }
        await PushSubscription.removeForUser(req.user.id, endpoint);
        return response.success(res, null, 'Notifications désactivées');
    } catch (error) {
        next(error);
    }
});

module.exports = router;
