const webpush = require('web-push');
const PushSubscription = require('../models/pushSubscriptionModel');

// Notifications push (Web Push). Sans clés VAPID dans l'environnement, l'envoi est simplement désactivé.
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
const enabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (enabled) {
    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:contact@samalocation.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
    console.warn('[PUSH] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY absentes : notifications push désactivées.');
}

const truncate = (text, max) => {
    const value = String(text || '');
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const pushService = {
    isEnabled: () => enabled,

    getPublicKey: () => VAPID_PUBLIC_KEY || null,

    /**
     * Envoie une notification push sur tous les appareils abonnés du destinataire.
     * Ne lève jamais d'erreur : un échec de push ne doit pas faire échouer l'action métier.
     */
    async sendToUser(recipientId, { title, body, link, tag }) {
        if (!enabled || !recipientId) return;
        try {
            const subscriptions = await PushSubscription.findForRecipient(recipientId);
            if (subscriptions.length === 0) return;

            const payload = JSON.stringify({
                title: truncate(title, 120),
                body: truncate(body, 300),
                link: link || '/',
                tag: tag || undefined,
            });

            await Promise.all(subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        payload,
                        { TTL: 60 * 60 * 24 } // conservé 24 h si l'appareil est hors ligne
                    );
                } catch (err) {
                    // 404/410 : l'abonnement n'existe plus (désinstallation, autorisation retirée…)
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await PushSubscription.removeByEndpoint(sub.endpoint);
                    } else {
                        console.error('[PUSH] Échec d\'envoi :', err.statusCode || '', err.body || err.message);
                    }
                }
            }));
        } catch (err) {
            console.error('[PUSH] Erreur :', err.message);
        }
    }
};

module.exports = pushService;
