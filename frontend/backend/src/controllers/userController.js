const User = require('../models/userModel');

const userController = {
    /**
     * Bloquer un utilisateur (admin seulement)
     */
    async blockUser(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.user.id;

            if (!reason || reason.trim().length < 5) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La raison du blocage doit contenir au moins 5 caractères'
                });
            }

            // Bloquer l'utilisateur
            await User.blockUser(id, adminId, reason.trim());

            // Dépublier tous les biens de l'utilisateur
            const db = require('../config/db');
            await db.query(
                'UPDATE properties SET is_published = false WHERE owner_id = ?',
                [id]
            );

            console.log(`User ${id} blocked and all properties unpublished`);

            res.json({
                status: 'success',
                message: 'Utilisateur bloqué et biens dépubliés'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Débloquer un utilisateur (admin seulement)
     */
    async unblockUser(req, res, next) {
        try {
            const { id } = req.params;

            await User.unblockUser(id);

            res.json({
                status: 'success',
                message: 'Utilisateur débloqué avec succès'
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Obtenir tous les utilisateurs (admin seulement)
     */
    async getAllUsers(req, res, next) {
        try {
            const users = await User.findAllWithBlockInfo();

            res.json({
                status: 'success',
                data: users
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;
