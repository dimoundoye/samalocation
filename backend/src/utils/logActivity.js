const ActivityLog = require('../models/activityLogModel');

/**
 * Helper pour enregistrer une activité dans le journal.
 * Ne lève JAMAIS d'erreur — un échec de logging ne doit jamais interrompre le flux principal.
 *
 * @param {object} req - La requête Express (fournit req.user, req.ownerId)
 * @param {object} options
 * @param {string} options.action       - 'CREATE' | 'UPDATE' | 'DELETE' | 'GENERATE' | 'EXPORT' | 'VIEW' | 'SEND' | 'INVITE' | 'REMOVE'
 * @param {string} options.entityType   - 'receipt' | 'contract' | 'tenant' | 'property' | 'maintenance' | 'message' | 'dossier' | 'settings' | 'team' | 'profile'
 * @param {string} [options.entityId]   - ID de l'entité concernée
 * @param {string} options.entityLabel  - Description lisible (ex: "Reçu de 150 000 F CFA pour Moussa Diop (juin/2026)")
 * @param {object} [options.metadata]   - Données JSON supplémentaires
 */
const logActivity = async (req, { action, entityType, entityId, entityLabel, metadata = {} }) => {
    try {
        // Organisation active résolue par authMiddleware
        const agencyId = req.org?.id || req.ownerId;
        const actorId = req.user?.id;        // Qui a réellement fait l'action
        const actorName = req.user?.full_name || req.user?.email || 'Inconnu';
        const actorRole = req.org?.role || 'owner';

        if (!agencyId || !actorId) return;

        await ActivityLog.create({
            agencyId,
            actorId,
            actorName,
            actorRole,
            action,
            entityType,
            entityId,
            entityLabel,
            metadata
        });
    } catch (err) {
        // Logging silencieux — ne jamais bloquer le flux principal
        console.error('[logActivity] Erreur silencieuse:', err.message);
    }
};

module.exports = logActivity;
