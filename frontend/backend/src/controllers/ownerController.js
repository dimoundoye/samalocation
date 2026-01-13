const Owner = require('../models/ownerModel');
const response = require('../utils/response');

const ownerController = {
    /**
     * Get owner profile
     */
    async getProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await Owner.findProfileById(userId);
            return response.success(res, profile);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update owner profile
     */
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await Owner.updateProfile(userId, req.body);
            return response.success(res, profile, 'Profile updated');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ownerController;
