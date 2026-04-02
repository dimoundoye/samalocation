const { verifyToken } = require('../utils/auth');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        console.log('[authMiddleware] Invalid token provided');
        return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    // Récupérer le profil complet de l'utilisateur (permissions + statut blocage)
    const userProfile = await User.findProfileById(decoded.id);
    if (!userProfile) {
        return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (userProfile.is_blocked) {
        console.log(`[authMiddleware] User ID ${decoded.id} is blocked`);
        return res.status(403).json({
            status: 'error',
            message: 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.'
        });
    }

    // Normaliser parentId pour qu'il soit accessible de façon consistante
    const effectiveParentId = userProfile.parent_id || decoded.parentId;
    
    req.user = { 
        ...decoded, 
        ...userProfile,
        parentId: effectiveParentId, // Standardiser en camelCase
        parent_id: effectiveParentId // Garder snake_case pour compatibilité
    };
    
    console.log(`[authMiddleware] User authenticated: ${decoded.id}, role: ${decoded.role}, parentId: ${effectiveParentId}`);

    // Resolve effective owner ID for data access
    req.ownerId = decoded.id; // Par défaut, l'utilisateur voit son propre espace
    
    const activeContext = req.headers['x-active-context'];
    if (activeContext) {
        console.log(`[authMiddleware] x-active-context header found: ${activeContext}`);
        // If user is a collaborator, they can switch to their parent's context
        if (effectiveParentId === activeContext) {
            // CRITICAL: Check if the owner still has a subscription allowing multi-user
            const Subscription = require('../models/subscriptionModel');
            const hasMultiUserAccess = await Subscription.hasAccessToFeature(activeContext, 'multi_user');
            
            if (hasMultiUserAccess) {
                req.ownerId = activeContext;
                console.log(`[authMiddleware] User is collaborator, switching ownerId to parent: ${req.ownerId}`);
            } else {
                console.log(`[authMiddleware] Collaborator blocked: Parent account (${activeContext}) does not have multi_user feature enabled.`);
            }
        }
    } else if (effectiveParentId) {
        // Optionnel: On peut choisir de basculer automatiquement sur le contexte du propriétaire 
        // si l'agent n'a rien à lui. Pour l'instant on reste sur l'espace perso par défaut.
        console.log(`[authMiddleware] No active context, but user has parentId: ${effectiveParentId}. Defaulting to personal space.`);
    }

    console.log(`[AUTH] Resolved ownerId context: ${req.ownerId} (User: ${decoded.id})`);

    next();
};

module.exports = authMiddleware;
