const Property = require('../models/propertyModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const logActivity = require('../utils/logActivity');
const { deleteMultipleFromCloudinary } = require('../utils/cloudinaryHelper');
const { emitToWorkspace } = require('../utils/socket');

// Simple in-memory cache for public properties
const propertyCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes pour un meilleur équilibre performance/fraîcheur

const clearPropertyCache = () => {
    propertyCache.clear();
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
                type: req.query.type || 'all',
                minPrice: req.query.minPrice || null,
                maxPrice: req.query.maxPrice || null,
                minArea: req.query.minArea || null,
                maxArea: req.query.maxArea || null,
                minRooms: req.query.minRooms || null,
                maxRooms: req.query.maxRooms || null,
                minBedrooms: req.query.minBedrooms || null,
                maxBedrooms: req.query.maxBedrooms || null,
                listingType: req.query.listingType || 'all'
            };

            // Check cache
            const cacheKey = `published_${limit}_${page}_${JSON.stringify(filters)}`;
            const cachedData = propertyCache.get(cacheKey);
            
            if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
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
            const propertyData = {
                id: uuidv4(),
                owner_id: ownerId,
                ...req.body
            };

            const newProperty = await Property.create(propertyData);
            clearPropertyCache();
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'properties', action: 'create', id: newProperty.id });

            // Journal d'activité
            await logActivity(req, {
                action: 'CREATE',
                entityType: 'property',
                entityId: newProperty.id,
                entityLabel: `Bien ajouté : ${req.body.name || 'Nouveau bien'}`,
                metadata: { property_type: req.body.property_type, address: req.body.address }
            });

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
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'properties', action: 'update', id: propertyId });

            // Journal d'activité
            await logActivity(req, {
                action: 'UPDATE',
                entityType: 'property',
                entityId: propertyId,
                entityLabel: `Publication du bien ${result.name || propertyId} ${result.is_published ? 'activée' : 'désactivée'}`,
                metadata: { is_published: result.is_published }
            });

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
            const ownerId = req.ownerId;
            const { property_id, units } = req.body;

            const success = await Property.addUnits(property_id, ownerId, units);
            if (!success) {
                return response.error(res, 'Forbidden or property not found', 403);
            }

            clearPropertyCache();
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'properties', action: 'update', id: property_id });
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

            // 1. Récupérer les informations du bien avant suppression pour extraire ses photos
            const property = await Property.findById(propertyId);

            // 2. Extraire toutes les photos associées
            const photosToDelete = [];
            if (property) {
                if (property.photos && Array.isArray(property.photos)) {
                    photosToDelete.push(...property.photos);
                }
                if (property.photo_url) {
                    photosToDelete.push(property.photo_url);
                }
            }

            // 3. Supprimer le bien de la base de données
            const success = await Property.delete(propertyId, ownerId);
            if (!success) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

            // 4. Nettoyer automatiquement les fichiers photos sur Cloudinary
            await deleteMultipleFromCloudinary(photosToDelete);

            clearPropertyCache();
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'properties', action: 'delete', id: propertyId });

            // Journal d'activité
            await logActivity(req, {
                action: 'DELETE',
                entityType: 'property',
                entityId: propertyId,
                entityLabel: `Bien "${property?.name || propertyId}" supprimé avec ses photos`,
                metadata: { photosCount: photosToDelete.length }
            });

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
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'properties', action: 'update', id: propertyId });

            // Journal d'activité
            await logActivity(req, {
                action: 'UPDATE',
                entityType: 'property',
                entityId: propertyId,
                entityLabel: `Bien modifié : ${updatedProperty.name || propertyId}`,
                metadata: {}
            });

            return response.success(res, updatedProperty, 'Property updated successfully');
        } catch (error) {
            next(error);
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
