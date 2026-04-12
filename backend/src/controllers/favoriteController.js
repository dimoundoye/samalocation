const Favorite = require('../models/favoriteModel');

const favoriteController = {
    async addFavorite(req, res) {
        try {
            const { propertyId } = req.body;
            const userId = req.user.id;

            if (!propertyId) {
                return res.status(400).json({ message: 'Property ID is required' });
            }

            await Favorite.add(userId, propertyId);
            res.status(200).json({ message: 'Property added to favorites' });
        } catch (error) {
            res.status(500).json({ message: 'Error adding favorite', error: error.message });
        }
    },

    async removeFavorite(req, res) {
        try {
            const { propertyId } = req.params;
            const userId = req.user.id;

            await Favorite.remove(userId, propertyId);
            res.status(200).json({ message: 'Property removed from favorites' });
        } catch (error) {
            res.status(500).json({ message: 'Error removing favorite', error: error.message });
        }
    },

    async getFavorites(req, res) {
        try {
            const userId = req.user.id;
            const favorites = await Favorite.findByUser(userId);
            res.status(200).json(favorites);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching favorites', error: error.message });
        }
    },

    async checkFavorite(req, res) {
        try {
            const { propertyId } = req.params;
            const userId = req.user.id;
            const isFavorite = await Favorite.isFavorite(userId, propertyId);
            res.status(200).json({ isFavorite });
        } catch (error) {
            res.status(500).json({ message: 'Error checking favorite status', error: error.message });
        }
    }
};

module.exports = favoriteController;
