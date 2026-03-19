const db = require('../config/db');

/**
 * Middleware pour logger les visites sur le site
 */
const trackVisit = async (req, res, next) => {
    // On ne loggue pas les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    // On ne loggue pas les requêtes pour les assets statiques (images, uploads)
    if (req.url.startsWith('/uploads') || req.url.includes('.')) {
        return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Identification basique des robots
    const botPatterns = [
        'bot', 'spider', 'crawler', 'googlebot', 'bingbot', 'yandexbot', 
        'slurp', 'duckduckbot', 'baiduspider', 'adsbot', 'twitterbot', 
        'facebookexternalhit', 'linkedinbot'
    ];
    
    const isBot = botPatterns.some(pattern => 
        userAgent.toLowerCase().includes(pattern)
    );

    // On utilise try-catch pour ne pas bloquer la requête en cas d'erreur de logging
    try {
        // Log asynchrone sans attendre (ne pas ralentir la réponse)
        db.query(`
            INSERT INTO site_visits (ip_address, user_agent, is_bot, path, method)
            VALUES ($1, $2, $3, $4, $5)
        `, [ipAddress, userAgent, isBot, req.path, req.method]).catch(err => {
            console.error('Error logging visit:', err);
        });
    } catch (error) {
        console.error('Visit logging error:', error);
    }

    next();
};

module.exports = { trackVisit };
