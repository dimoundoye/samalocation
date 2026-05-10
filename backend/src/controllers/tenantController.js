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
            const ownerId = req.ownerId;
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
            const ownerId = req.ownerId;
            const { full_name, email, phone, unit_id, monthly_rent, move_in_date, status, user_id } = req.body;

            // --- NOUVEAU QUOTA D'AFFECTATION (GÉRANCE) ---
            const Subscription = require('../models/subscriptionModel');
            const PLANS = require('../config/plans');
            const activeSub = await Subscription.findActiveByUserId(ownerId);
            let planKey = activeSub ? (activeSub.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE') : 'FREE';
            if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
            const planConfig = PLANS[planKey] || PLANS.FREE;

            const maxAssignments = planConfig.limits.max_properties;

            // On compte les affectations ACTIVES (tenants déjà assignés)
            const db = require('../config/db');
            const { rows: countRows } = await db.query(`
                SELECT COUNT(*) as active_assignments 
                FROM tenants t
                JOIN property_units pu ON t.unit_id = pu.id
                JOIN properties p ON pu.property_id = p.id
                WHERE p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1)
            `, [ownerId]);

            const activeAssignments = parseInt(countRows[0].active_assignments);

            // On vérifie si on n'est pas déjà en train de remplacer un locataire sur CETTE unité spécifique
            const existingInUnit = await Tenant.findActiveByUnitId(unit_id);

            // Si l'unité n'a pas de locataire et qu'on veut en ajouter un nouveau, on vérifie le quota global
            if (!existingInUnit && maxAssignments !== Infinity && maxAssignments !== -1 && activeAssignments >= maxAssignments) {
                return res.status(403).json({
                    status: 'error',
                    message: `Votre plan ${planConfig.name} limite la gérance à ${maxAssignments} logements affectés. Veuillez passer au plan supérieur pour gérer plus de locataires (affectations).`
                });
            }
            // ----------------------------------------------

            if (!unit_id) {
                return response.error(res, 'Unit ID is required', 400);
            }

            // Verify unit ownership
            const property = await Property.findByUnitId(unit_id);
            if (!property || property.owner_id !== ownerId) {
                return response.error(res, 'Forbidden: You do not own this unit', 403);
            }

            // check if unit is already occupied and replace if necessary
            const existingTenant = await Tenant.findActiveByUnitId(unit_id);
            if (existingTenant) {
                console.log(`Soft-deleting existing tenant ${existingTenant.id} for unit ${unit_id}`);
                // Soft delete : marquer l'ancien comme inactif pour garder l'historique
                await Tenant.update(existingTenant.id, { status: 'inactive' });
                await db.query('UPDATE property_units SET is_available = true WHERE id = $1', [unit_id]);
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
            const ownerId = req.ownerId;
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
            const ownerId = req.ownerId;

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
     * Update current tenant's own profile (name, phone, address)
     */
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { name, phone, address } = req.body;

            // 1. Mettre à jour user_profiles (source de vérité pour le profil)
            const updates = [];
            const values = [];
            let idx = 1;

            if (name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(name); }
            if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
            if (address !== undefined) { updates.push(`address = $${idx++}`); values.push(address); }

            if (updates.length > 0) {
                values.push(userId);
                const db = require('../config/db');
                await db.query(
                    `UPDATE user_profiles SET ${updates.join(', ')} WHERE id = $${idx}`,
                    values
                );
            }

            // 2. Synchroniser aussi dans la table 'tenants' si une location est active
            const leases = await Tenant.findActiveLeasesByUserId(userId);
            if (leases.length > 0) {
                const tenantUpdate = {};
                if (name !== undefined) tenantUpdate.full_name = name;
                if (phone !== undefined) tenantUpdate.phone = phone;

                for (const lease of leases) {
                    if (Object.keys(tenantUpdate).length > 0) {
                        await Tenant.update(lease.id, tenantUpdate);
                    }
                }
            }

            return response.success(res, null, 'Profil mis à jour avec succès');
        } catch (error) {
            console.error('Error in updateMyProfile:', error);
            next(error);
        }
    },
    /**
     * Get all leases (active + inactive) for the current tenant
     */
    async getMyAllLeases(req, res, next) {
        try {
            const userId = req.user.id;
            const leases = await Tenant.findAllLeasesByUserId(userId);
            return response.success(res, leases);
        } catch (error) {
            console.error('Error in getMyAllLeases:', error);
            next(error);
        }
    }
};

module.exports = tenantController;
