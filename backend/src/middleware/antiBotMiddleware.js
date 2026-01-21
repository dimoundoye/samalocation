const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const verifyTurnstile = async (req, res, next) => {
    const turnstileToken = req.body.turnstileToken;
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // Skip verification in development if no secret is provided
    if (!secretKey && process.env.NODE_ENV !== 'production') {
        return next();
    }

    if (!turnstileToken) {
        return res.status(400).json({ status: 'error', message: 'Vérification anti-robot manquante.' });
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: secretKey,
                response: turnstileToken,
                remoteip: req.ip,
            }),
        });

        const outcome = await response.json();

        if (outcome.success) {
            next();
        } else {
            console.error('Turnstile verification failed:', outcome['error-codes']);
            res.status(403).json({ status: 'error', message: 'Échec de la vérification anti-robot.' });
        }
    } catch (error) {
        console.error('Turnstile connection error:', error);
        res.status(500).json({ status: 'error', message: 'Erreur lors de la vérification anti-robot.' });
    }
};

module.exports = verifyTurnstile;
