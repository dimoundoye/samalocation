const fetch = require('node-fetch');

/**
 * Vérifier un jeton Cloudflare Turnstile
 * @param {string} token - Le jeton envoyé par le frontend
 * @param {string} remoteIp - L'adresse IP de l'utilisateur (optionnel)
 * @returns {Promise<boolean>} - True si le jeton est valide
 */
async function verifyTurnstileToken(token, remoteIp = null) {
    // 🧪 Auto-bypass en développement/test pour faciliter les tests locaux
    if (process.env.NODE_ENV !== 'production') {
        // console.log('🛡️ Turnstile bypass actif (Mode Dévelopement)');
        return true;
    }

    if (!token) return false;
    if (!secretKey) {
        console.warn('⚠️ TURNSTILE_SECRET_KEY non configuré dans le backend.');
        return true; // Ne pas bloquer si la clé est absente (mode dégradé)
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        if (outcome.success) {
            return true;
        }

        console.error('❌ Échec de la vérification Turnstile:', outcome['error-codes']);
        return false;
    } catch (error) {
        console.error('❌ Erreur lors de la requête Turnstile:', error);
        return false;
    }
}

module.exports = { verifyTurnstileToken };
