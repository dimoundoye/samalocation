const MaintenanceRequest = require('../models/maintenanceModel');
const Tenant = require('../models/tenantModel');
const Notification = require('../models/notificationModel');
const response = require('../utils/response');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const maintenanceController = {
    /**
     * Create a maintenance request (Tenant Only)
     */
    async create(req, res, next) {
        console.log('[MAINTENANCE] Creating request...');
        try {
            const { title, description, priority, photos } = req.body;
            const userId = req.user.id; // From authMiddleware

            // Ensure user is an active tenant
            const leases = await Tenant.findActiveLeasesByUserId(userId);
            if (!leases || leases.length === 0) {
                return response.error(res, 'Vous devez avoir un contrat de location actif pour signaler un incident.', 403);
            }

            // Find the specific lease if tenant_id is provided, otherwise default to the first one
            const { tenant_id } = req.body;
            let lease = null;

            if (tenant_id) {
                lease = leases.find(l => l.id === tenant_id);
                if (!lease) {
                    return response.error(res, 'Contrat de location non trouvé ou invalide.', 400);
                }
            } else {
                lease = leases[0];
            }

            const newRequest = {
                id: uuidv4(),
                tenant_id: lease.id,
                property_id: lease.property_id,
                unit_id: lease.unit_id,
                title,
                description,
                priority: priority || 'medium',
                photos: photos || []
            };

            const request = await MaintenanceRequest.create(newRequest);

            console.log(`[MAINTENANCE] Notifying owner ${lease.owner_id} for request ${request.id}`);
            try {
                if (!lease.owner_id) {
                    console.warn(`[MAINTENANCE] No owner_id found for lease ${lease.id}. Notification skipped.`);
                } else {
                    await Notification.create({
                        id: uuidv4(),
                        user_id: lease.owner_id,
                        type: 'maintenance',
                        title: 'Nouveau signalement de maintenance',
                        message: `Un incident (${title}) a été signalé pour l'unité ${lease.unit_number} de ${lease.property_name}.`,
                        link: '/owner-dashboard?tab=maintenance'
                    });
                    console.log('[MAINTENANCE] Notification sent to owner:', lease.owner_id);
                }
            } catch (notifError) {
                console.error('Failed to send maintenance notification to owner:', notifError);
            }

            return response.success(res, request, `Signalement enregistré [V3.2] (Owner: ${lease.owner_id || 'NULL'}).`);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get tenant's maintenance requests
     */
    async getTenantRequests(req, res, next) {
        console.log('[MAINTENANCE] Getting tenant requests...');
        try {
            const userId = req.user.id;
            const leases = await Tenant.findActiveLeasesByUserId(userId);

            if (!leases || leases.length === 0) {
                return response.success(res, [], 'Aucun contrat actif.');
            }

            // Collect all requests for all leases of this user
            let allRequests = [];
            for (const lease of leases) {
                const requests = await MaintenanceRequest.findByTenantId(lease.id);
                allRequests = [...allRequests, ...requests];
            }

            return response.success(res, allRequests, 'Signalements récupérés [V3].');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get owner's maintenance requests
     */
    async getOwnerRequests(req, res, next) {
        try {
            const ownerId = req.user.id;
            const requests = await MaintenanceRequest.findByOwnerId(ownerId);
            return response.success(res, requests, 'Signalements reçus.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update request status (Owner Only)
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const ownerId = req.user.id;

            // Verify the request belongs to one of the owner's properties
            const request = await MaintenanceRequest.findById(id);
            if (!request) {
                return response.error(res, 'Signalement non trouvé.', 404);
            }

            // Check if user is the owner of the property
            // Handle both user_profile_id and owner_profile_id
            const [rows] = await db.query(`
                SELECT p.owner_id, op.user_profile_id 
                FROM properties p 
                LEFT JOIN owner_profiles op ON p.owner_id = op.id 
                WHERE p.id = ?
            `, [request.property_id]);

            const prop = rows[0];
            if (!prop || (prop.owner_id !== ownerId && prop.user_profile_id !== ownerId)) {
                return response.error(res, 'Vous n\'êtes pas autorisé à modifier ce signalement.', 403);
            }

            const updatedRequest = await MaintenanceRequest.updateStatus(id, status);

            // Notify Tenant
            try {
                const [tenantUser] = await db.query('SELECT user_id FROM tenants WHERE id = ?', [request.tenant_id]);
                if (tenantUser[0] && tenantUser[0].user_id) {
                    await Notification.create({
                        id: uuidv4(),
                        user_id: tenantUser[0].user_id,
                        type: 'maintenance',
                        title: 'Mise à jour maintenance',
                        message: `Le statut de votre signalement "${request.title}" est passé à : ${status}.`,
                        link: '/dashboard?tab=maintenance'
                    });
                }
            } catch (notifError) {
                console.error('Failed to send maintenance status update notification to tenant:', notifError);
            }

            return response.success(res, updatedRequest, 'Statut mis à jour.');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = maintenanceController;
