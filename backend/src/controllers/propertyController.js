const Property = require('../models/propertyModel');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

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

            const total = await Property.countAllPublished(filters);
            const properties = await Property.findAllPublished(limit, offset, filters);

            return response.success(res, {
                properties,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    current_page: page,
                    limit
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get owner properties
     */
    async getOwnerProperties(req, res, next) {
        try {
            const ownerId = req.user.id;
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
            const ownerId = req.user.id;
            const propertyData = {
                id: uuidv4(),
                owner_id: ownerId,
                ...req.body
            };

            const newProperty = await Property.create(propertyData);
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
            const ownerId = req.user.id;
            const propertyId = req.params.id;

            const result = await Property.updatePublication(propertyId, ownerId);
            if (!result) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

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

            const success = await Property.addUnits(property_id, ownerId, units);
            if (!success) {
                return response.error(res, 'Forbidden or property not found', 403);
            }

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
            const ownerId = req.user.id;
            const propertyId = req.params.id;

            const success = await Property.delete(propertyId, ownerId);
            if (!success) {
                return response.error(res, 'Property not found or not owned by you', 404);
            }

            return response.success(res, null, 'Property deleted successfully');
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
