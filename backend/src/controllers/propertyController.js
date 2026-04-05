const Property = require('../models/propertyModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory cache for public properties
const propertyCache = new Map();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute pour un ressenti plus "direct"

const clearPropertyCache = () => {
    propertyCache.clear();
    console.log('[Cache] Property cache cleared');
};

const propertyController = {
    /**
     * Get all published properties
     */
    async getAllPublished(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const filters = {
                search: req.query.search || '',
                type: req.query.type || 'all'
            };

            // Check cache
            const cacheKey = `published_${limit}_${page}_${filters.search}_${filters.type}`;
            const cachedData = propertyCache.get(cacheKey);
            
            if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
                console.log(`[Cache] Returning cached data for ${cacheKey}`);
                return response.success(res, cachedData.data);
            }

            const total = await Property.countAllPublished(filters);
            const properties = await Property.findAllPublished(limit, offset, filters);

            const result = {
                properties,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    current_page: page,
                    limit
                }
            };

            // Save to cache
            propertyCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return response.success(res, result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get owner properties
     */
    async getOwnerProperties(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const properties = await Property.findByOwnerId(ownerId);
            return response.success(res, properties);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get property details
     */
    async getPropertyById(req, res, next) {
        try {
            const { id } = req.params;
            const property = await Property.findById(id);
            if (!property) {
                return response.error(res, 'Property not found', 404);
            }
            return response.success(res, property);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Create property
     */
    async createProperty(req, res, next) {
        try {
            const ownerId = req.ownerId;

            // --- Vérification du quota de LOGEMENTS (unités) ---
            const Subscription = require('../models/subscriptionModel');
            const PLANS = require('../config/plans');
            const activeSub = await Subscription.findActiveByUserId(ownerId);
            let planKey = activeSub ? (activeSub.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE') : 'FREE';
            if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
            const planConfig = PLANS[planKey] || PLANS.FREE;

            const maxUnits = planConfig.limits.max_properties; // On réutilise le champ max_properties pour les logements

            if (maxUnits !== Infinity && maxUnits !== -1) {
                const db = require('../config/db');
                const { rows: countRows } = await db.query(`
                    SELECT (
                        (SELECT COUNT(*) FROM property_units pu 
                         JOIN properties p ON pu.property_id = p.id 
                         WHERE p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                        +
                        (SELECT COUNT(*) FROM properties p 
                         WHERE (p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                         AND NOT EXISTS (SELECT 1 FROM property_units pu WHERE pu.property_id = p.id))
                    ) as total_units
                `, [ownerId]);
                
                const currentUnits = parseInt(countRows[0].total_units);
                
                if (currentUnits >= maxUnits) {
                    return res.status(403).json({
                        status: 'error',
                        message: `Vous avez atteint votre limite de ${maxUnits} logements pour le plan ${planConfig.name}. Veuillez passer au plan supérieur pour ajouter de nouveaux biens.`
                    });
                }
            }
            // ----------------------------------------------------

            const propertyData = {
                id: uuidv4(),
                owner_id: ownerId,
                ...req.body
            };

            const newProperty = await Property.create(propertyData);
            clearPropertyCache();
            return response.success(res, newProperty, 'Property created successfully', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Toggle publication
     */
    async togglePublication(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const propertyId = req.params.id;

            const result = await Property.updatePublication(propertyId, ownerId);
            if (!result) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

            clearPropertyCache();
            return response.success(res, result, 'Publication status updated');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Add units
     */
    async addUnits(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { property_id, units } = req.body;

            // --- Vérification du quota de LOGEMENTS (unités) ---
            const Subscription = require('../models/subscriptionModel');
            const PLANS = require('../config/plans');
            const activeSub = await Subscription.findActiveByUserId(ownerId);
            let planKey = activeSub ? (activeSub.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE') : 'FREE';
            if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
            const planConfig = PLANS[planKey] || PLANS.FREE;

            const maxUnits = planConfig.limits.max_properties;

            if (maxUnits !== Infinity && maxUnits !== -1) {
                const db = require('../config/db');
                const { rows: countRows } = await db.query(`
                    SELECT (
                        (SELECT COUNT(*) FROM property_units pu 
                         JOIN properties p ON pu.property_id = p.id 
                         WHERE p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                        +
                        (SELECT COUNT(*) FROM properties p 
                         WHERE (p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                         AND NOT EXISTS (SELECT 1 FROM property_units pu WHERE pu.property_id = p.id))
                    ) as total_units
                `, [ownerId]);
                
                const currentUnits = parseInt(countRows[0].total_units);
                const unitsToAdd = Array.isArray(units) ? units.length : 0;
                
                if (currentUnits + unitsToAdd > maxUnits) {
                    return res.status(403).json({
                        status: 'error',
                        message: `L'ajout de ces ${unitsToAdd} logements dépasserait votre limite de ${maxUnits} pour le plan ${planConfig.name}.`
                    });
                }
            }
            // ----------------------------------------------------

            const success = await Property.addUnits(property_id, ownerId, units);
            if (!success) {
                return response.error(res, 'Forbidden or property not found', 403);
            }

            clearPropertyCache();
            return response.success(res, null, 'Units added successfully', 201);
        } catch (error) {
            next(error);
        }
    },
    /**
     * Delete property
     */
    async deleteProperty(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const propertyId = req.params.id;

            const success = await Property.delete(propertyId, ownerId);
            if (!success) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

            clearPropertyCache();
            return response.success(res, null, 'Property deleted successfully');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update property
     */
    async updateProperty(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const propertyId = req.params.id;
            const updateData = req.body;

            const updatedProperty = await Property.update(propertyId, ownerId, updateData);
            if (!updatedProperty) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

            clearPropertyCache();
            return response.success(res, updatedProperty, 'Property updated successfully');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Run database migration for coordinates
     */
    async runMigration(req, res, next) {
        try {
            await Property.migrate();
            return response.success(res, null, 'Migration successful (latitude, longitude, equipments added)');
        } catch (error) {
            console.error('Migration error:', error);
            return response.error(res, 'Migration failed: ' + error.message, 500);
        }
    },

    /**
     * Get similar properties
     */
    async getSimilarProperties(req, res, next) {
        try {
            const { id } = req.params;
            const property = await Property.findById(id);

            if (!property) {
                return response.error(res, 'Property not found', 404);
            }

            const similar = await Property.findSimilar(
                id,
                property.property_type,
                property.address
            );

            return response.success(res, similar);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = propertyController;
