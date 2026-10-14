const User = require('../models/userModel');
const db = require('../config/db');
const { logAdminAction } = require('../utils/adminAudit');

/**
 * Garde-fou des actions sur un compte : jamais sur soi-même ni sur un autre administrateur
 * (évite de bloquer ou supprimer le dernier admin et de perdre l'accès à la plateforme).
 * Renvoie le profil ciblé, ou null après avoir répondu par une erreur.
 */
async function protectedTarget(req, res, verb) {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
        res.status(400).json({ status: 'error', message: `Vous ne pouvez pas ${verb} votre propre compte.` });
        return null;
    }
    const { rows: [target] } = await db.query('SELECT id, full_name, email, role FROM user_profiles WHERE id = $1', [id]);
    if (!target) {
        res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
        return null;
    }
    if (target.role === 'admin') {
        res.status(403).json({ status: 'error', message: `Impossible de ${verb} un compte administrateur depuis le tableau de bord.` });
        return null;
    }
    return target;
}

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

            const target = await protectedTarget(req, res, 'bloquer');
            if (!target) return;

            // Bloquer l'utilisateur
            await User.blockUser(id, adminId, reason.trim());

            // Dépublier tous les biens de l'utilisateur
            await db.query(
                'UPDATE properties SET is_published = false WHERE owner_id = $1',
                [id]
            );

            await logAdminAction(req, { action: 'user_block', targetType: 'user', targetId: id, targetLabel: target.full_name || target.email, details: { reason: reason.trim() } });

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
            const target = await protectedTarget(req, res, 'débloquer');
            if (!target) return;

            await User.unblockUser(id);
            await logAdminAction(req, { action: 'user_unblock', targetType: 'user', targetId: id, targetLabel: target.full_name || target.email });

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
    },
    /**
     * Supprimer un utilisateur (admin seulement)
     */
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const target = await protectedTarget(req, res, 'supprimer');
            if (!target) return;

            const success = await User.delete(id);
            if (!success) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Utilisateur non trouvé'
                });
            }

            await logAdminAction(req, { action: 'user_delete', targetType: 'user', targetId: id, targetLabel: target.full_name || target.email, details: { email: target.email, role: target.role } });

            res.json({
                status: 'success',
                message: 'Utilisateur et toutes ses données ont été supprimés'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;
