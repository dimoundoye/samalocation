const ActivityLog = require('../models/activityLogModel');
const response = require('../utils/response');
const logActivity = require('../utils/logActivity');

const activityLogController = {
    /**
     * Récupérer le journal d'activité de l'agence (patron uniquement)
     */
    async getActivityLog(req, res, next) {
        try {
            const agencyId = req.ownerId;
            const limit = parseInt(req.query.limit) || 50;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const filters = {
                actorId: req.query.actor_id || null,
                entityType: req.query.entity_type || null,
                action: req.query.action || null,
                limit,
                offset
            };

            const result = await ActivityLog.findByAgencyId(agencyId, filters);

            return response.success(res, {
                logs: result.logs,
                pagination: {
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                    current_page: page,
                    limit
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Enregistrer une action frontend (export Excel, création de groupe, etc.)
     * Utilisé pour les actions qui n'ont pas de requête API dédiée
     */
    async createActivityLog(req, res, next) {
        try {
            const { action, entityType, entityId, entityLabel, metadata } = req.body;

            if (!action || !entityType || !entityLabel) {
                return response.error(res, 'action, entityType et entityLabel sont requis', 400);
            }

            await logActivity(req, { action, entityType, entityId, entityLabel, metadata });
            return response.success(res, null, 'Activité enregistrée');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = activityLogController;
