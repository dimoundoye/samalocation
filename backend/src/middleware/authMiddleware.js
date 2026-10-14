const { verifyToken, isSessionRevoked } = require('../utils/auth');
const User = require('../models/userModel');
const Organization = require('../models/organizationModel');
const Subscription = require('../models/subscriptionModel');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    // Récupérer le profil complet de l'utilisateur (permissions + statut blocage)
    const userProfile = await User.findProfileById(decoded.id);
    if (!userProfile) {
        return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (isSessionRevoked(decoded, userProfile)) {
        return res.status(401).json({ status: 'error', message: 'Session expirée suite à un changement de mot de passe. Veuillez vous reconnecter.' });
    }

    if (userProfile.is_blocked) {
        return res.status(403).json({
            status: 'error',
            message: 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.'
        });
    }

    // Les droits viennent uniquement des adhésions lues en base à chaque requête,
    // jamais du jeton (un parentId ancien dans un JWT ne donne aucun accès).
    req.user = {
        ...decoded,
        ...userProfile
    };

    // Organisation active : celle demandée via x-active-context si l'utilisateur en est membre,
    // sinon son espace perso (org dont l'id = son id utilisateur), sinon aucune (ex. locataire).
    // req.ownerId = id de l'org active : même valeur que l'ancien "owner id", les contrôleurs n'ont pas à changer.
    const organizations = await Organization.findForUser(userProfile.id);
    const personalOrg = organizations.find(o => o.id === userProfile.id) || null;
    const requestedId = req.headers['x-active-context'];

    let activeOrg = personalOrg;
    if (requestedId && requestedId !== userProfile.id) {
        const requested = organizations.find(o => o.id === requestedId);
        // Travailler dans l'org de quelqu'un d'autre nécessite que cette org ait toujours l'option multi-utilisateur
        if (requested && (requested.role === 'owner' || await Subscription.hasAccessToFeature(requested.id, 'multi_user'))) {
            activeOrg = requested;
        }
    }

    req.organizations = organizations;
    req.org = activeOrg;
    req.permissions = new Set(activeOrg ? activeOrg.permissions : []);
    req.ownerId = activeOrg ? activeOrg.id : decoded.id;

    next();
};

module.exports = authMiddleware;
