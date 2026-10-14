const Analytics = require('../models/analyticsModel');
const { parseUserAgent } = require('../utils/userAgent');
const { verifyToken } = require('../utils/auth');

const VISITOR_ID = /^[a-zA-Z0-9-]{8,64}$/;
const OWN_HOSTS = /(^|\.)samalocation\.com$|^localhost$|^127\.0\.0\.1$/i;

// Chemin de page seulement (sans paramètres), longueur bornée
const cleanPath = (value) => {
    if (typeof value !== 'string' || !value.startsWith('/')) return null;
    return value.split(/[?#]/)[0].slice(0, 200) || '/';
};

// Site de provenance : nom de domaine seulement, et jamais notre propre site
const cleanReferrer = (value) => {
    if (typeof value !== 'string' || !value) return null;
    try {
        const host = new URL(value).hostname.replace(/^www\./, '').slice(0, 255);
        return host && !OWN_HOSTS.test(host) ? host : null;
    } catch {
        return null;
    }
};

const analyticsController = {
    /**
     * Page vue ou signal de présence envoyé par l'application (route publique, toujours 204).
     */
    async recordHit(req, res) {
        const kind = req.body?.kind === 'ping' ? 'ping' : 'pageview';
        const path = cleanPath(req.body?.path);
        const visitorId = typeof req.body?.visitorId === 'string' && VISITOR_ID.test(req.body.visitorId) ? req.body.visitorId : null;
        if (!path || !visitorId || path.startsWith('/admin')) return res.status(204).end();

        // Rôle du visiteur connecté (propriétaire / locataire) ; l'identité n'est pas enregistrée
        const auth = req.headers.authorization;
        const decoded = auth?.startsWith('Bearer ') ? verifyToken(auth.slice(7)) : null;
        if (decoded?.role === 'admin') return res.status(204).end();

        const userAgent = req.headers['user-agent'] || '';
        const { device, browser, os, isBot } = parseUserAgent(userAgent);

        try {
            await Analytics.recordHit({
                kind,
                path,
                visitorId,
                visitorRole: ['owner', 'tenant'].includes(decoded?.role) ? decoded.role : null,
                device, browser, os,
                referrerHost: kind === 'pageview' ? cleanReferrer(req.body?.referrer) : null,
                isBot,
                userAgent: userAgent.slice(0, 300)
            });
        } catch (err) {
            console.error('[ANALYTICS] Page vue non enregistrée :', err.message);
        }
        return res.status(204).end();
    }
};

module.exports = analyticsController;
