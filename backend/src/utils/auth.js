const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Secret JWT obligatoire partout, sauf en développement ou test déclarés explicitement.
// (Avant : un secret connu était utilisé dès que NODE_ENV n'était pas exactement 'production'.)
const EXAMPLE_SECRET = 'generer_une_cle_secrete_tres_longue_et_aleatoire';
const isExplicitDev = ['development', 'test'].includes(process.env.NODE_ENV);
const configuredSecret = process.env.JWT_SECRET;
if (!isExplicitDev && (!configuredSecret || configuredSecret === EXAMPLE_SECRET || configuredSecret.length < 32)) {
    console.error('FATAL ERROR: JWT_SECRET manquant, trop court (< 32 caractères) ou égal à la valeur d\'exemple.');
    process.exit(1);
}
const JWT_SECRET = configuredSecret || 'dev_secret_samalocation_123';

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            parentId: user.parentId || null
        },
        JWT_SECRET,
        // Session admin plus courte : un appareil oublié ouvert donne moins longtemps accès au tableau de bord
        { expiresIn: user.role === 'admin' ? (process.env.JWT_ADMIN_EXPIRES_IN || '12h') : (process.env.JWT_EXPIRES_IN || '7d') }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Empreinte d'un jeton envoyé par e-mail (vérification, réinitialisation).
 * Seule l'empreinte est stockée en base : une fuite de la base ne donne pas de liens utilisables.
 */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/**
 * Session émise avant le dernier changement de mot de passe : elle n'est plus valable.
 * (Comparaison à la seconde près, comme le champ iat du JWT.)
 */
const isSessionRevoked = (decoded, profile) => {
    if (!profile?.password_changed_at || !decoded?.iat) return false;
    return decoded.iat < Math.floor(new Date(profile.password_changed_at).getTime() / 1000);
};

module.exports = {
    generateToken,
    verifyToken,
    generateVerificationToken,
    hashToken,
    isSessionRevoked
};
