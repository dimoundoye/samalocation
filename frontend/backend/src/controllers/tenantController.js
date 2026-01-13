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
            const lease = await Tenant.findActiveLeaseByUserId(userId);

            // Format the response to match frontend expectations
            const responseData = {
                tenant: lease,
                profile: lease?.profile || null,
                owner: lease?.ownerProfile || null,
                ownerUserProfile: lease ? {
                    full_name: lease.owner_name,
                    email: lease.owner_email,
                    phone: lease.owner_phone
                } : null
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

            console.log('Assigning tenant:', {
                ownerId,
                full_name,
                email,
                phone,
                unit_id,
                user_id: user_id || 'NULL',
                monthly_rent,
                move_in_date,
                status
            });

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

            // Trouver le locataire associé à cet utilisateur
            const tenant = await Tenant.findActiveLeaseByUserId(userId);
            if (!tenant) {
                return response.error(res, 'No active lease found for this user', 404);
            }

            // Mettre à jour les informations du locataire
            const updateData = {};
            if (full_name !== undefined) updateData.full_name = full_name;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;

            await Tenant.update(tenant.id, updateData);

            // Récupérer les données mises à jour
            const updatedTenant = await Tenant.findById(tenant.id);

            return response.success(res, updatedTenant, 'Profile updated successfully');
        } catch (error) {
            console.error('Error in updateMyProfile:', error);
            next(error);
        }
    }
};

module.exports = tenantController;
