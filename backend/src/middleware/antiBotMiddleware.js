const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const verifyTurnstile = async (req, res, next) => {
    // Commenté temporairement pour le développement local
    return next();

    /*
    const turnstileToken = req.body.turnstileToken;
    ...
    */
};

module.exports = verifyTurnstile;
