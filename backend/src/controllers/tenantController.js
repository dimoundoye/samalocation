const Tenant = require('../models/tenantModel');
const Property = require('../models/propertyModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const tenantController = {
    /**
     * Get current tenant lease info
     */
    async getMyLease(req, res, next) {
        try {
            const userId = req.user.id;
            const leases = await Tenant.findActiveLeasesByUserId(userId);

            // Format the response: return the list of leases
            // We keep a 'tenant' (first lease) and 'profile' for basic backward compatibility if needed, 
            // but the main data is now 'leases'
            const responseData = {
                leases: leases,
                profile: leases.length > 0 ? leases[0].profile : null,
                // These are for the primary lease
                tenant: leases.length > 0 ? leases[0] : null,
                owner: leases.length > 0 ? leases[0].ownerProfile : null,
            };

            return response.success(res, responseData);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get owner's tenants
     */
    async getOwnerTenants(req, res, next) {
        try {
            const ownerId = req.user.id;
            const tenants = await Tenant.findByOwnerId(ownerId);
            return response.success(res, tenants);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Assign tenant to unit
     */
    async assignTenant(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id } = req.body;

            if (!unit_id) {
                return response.error(res, 'Unit ID is required', 400);
            }

            // Verify unit ownership
            const property = await Property.findByUnitId(unit_id);
            if (!property || property.owner_id !== ownerId) {
                return response.error(res, 'Forbidden: You do not own this unit', 403);
            }

            const tenantId = uuidv4();
            const newTenant = await Tenant.create({
                id: tenantId,
                full_name,
                email,
                phone,
                unit_id,
                monthly_rent,
                move_in_date,
                status,
                user_id: user_id || null
            });

            console.log('Tenant created:', newTenant);

            return response.success(res, newTenant, 'Tenant assigned', 201);
        } catch (error) {
            console.error('Error in assignTenant:', error);
            next(error);
        }
    },

    /**
     * Update tenant
     */
    async updateTenant(req, res, next) {
        try {
            const { id } = req.params;
            const ownerId = req.user.id;
            const data = req.body;

            // Verify tenant exists and ownership
            const tenant = await Tenant.findById(id);
            if (!tenant) {
                return response.error(res, 'Tenant not found', 404);
            }

            if (tenant.owner_id !== ownerId) {
                return response.error(res, 'Forbidden: You do not own this tenant', 403);
            }

            const updated = await Tenant.update(id, data);
            return response.success(res, updated, 'Tenant updated');
        } catch (error) {
            console.error('Error in updateTenant:', error);
            next(error);
        }
    },

    /**
     * Delete tenant
     */
    async deleteTenant(req, res, next) {
        try {
            const { id } = req.params;
            const ownerId = req.user.id;

            // Verify tenant exists and ownership
            const tenant = await Tenant.findById(id);
            if (!tenant) {
                return response.error(res, 'Tenant not found', 404);
            }

            if (tenant.owner_id !== ownerId) {
                return response.error(res, 'Forbidden: You do not own this tenant', 403);
            }

            await Tenant.delete(id);
            return response.success(res, null, 'Tenant deleted');
        } catch (error) {
            console.error('Error in deleteTenant:', error);
            next(error);
        }
    },

    /**
     * Update current tenant's own profile
     */
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { full_name, email, phone } = req.body;

            // Trouver les locations associées à cet utilisateur
            const leases = await Tenant.findActiveLeasesByUserId(userId);
            if (leases.length === 0) {
                return response.error(res, 'No active lease found for this user', 404);
            }

            // Mettre à jour les informations du locataire (on met à jour le premier trouvé ou tous?)
            // En général le profil est lié au user_id, donc on met à jour tous les records 'tenants' liés?
            // Le but ici est surtout de synchroniser le nom/email dans la table 'tenants'
            const updateData = {};
            if (full_name !== undefined) updateData.full_name = full_name;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;

            for (const lease of leases) {
                await Tenant.update(lease.id, updateData);
            }

            return response.success(res, null, 'Profile updated successfully for all leases');
        } catch (error) {
            console.error('Error in updateMyProfile:', error);
            next(error);
        }
    }
};

module.exports = tenantController;
