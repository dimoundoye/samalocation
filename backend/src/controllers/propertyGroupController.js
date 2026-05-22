const PropertyGroup = require('../models/propertyGroupModel');
const response = require('../utils/response');

const propertyGroupController = {
    async getGroups(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const groups = await PropertyGroup.findAllByOwnerId(ownerId);
            return response.success(res, groups);
        } catch (error) {
            next(error);
        }
    },

    async syncGroups(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const { groups } = req.body;
            
            if (!Array.isArray(groups)) {
                return response.error(res, 'Groups must be an array', 400);
            }

            const updatedGroups = await PropertyGroup.bulkSync(ownerId, groups);
            return response.success(res, updatedGroups, 'Groups synchronized successfully');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = propertyGroupController;
