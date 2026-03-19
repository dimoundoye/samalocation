const Owner = require('../models/ownerModel');
const User = require('../models/userModel');
const response = require('../utils/response');
const { sendTeamInvitationEmail, sendTeamAdditionEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const ownerController = {
    /**
     * Get owner profile
     */
    async getProfile(req, res, next) {
        try {
            const userId = req.ownerId;
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
            const userId = req.ownerId;
            const profile = await Owner.updateProfile(userId, req.body);
            return response.success(res, profile, 'Profile updated');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get collaborators
     */
    async getCollaborators(req, res, next) {
        try {
            const requestedOwnerId = req.ownerId;
            console.log(`[TEAM] getCollaborators called. Using parentId: ${requestedOwnerId}`);
            const collaborators = await User.findCollaboratorsByParentId(requestedOwnerId);
            console.log(`[TEAM] findCollaboratorsByParentId(${requestedOwnerId}) result:`, JSON.stringify(collaborators));
            return response.success(res, collaborators);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Add a collaborator
     */
    async addCollaborator(req, res, next) {
        try {
            const { email, password, name, phone, permissions } = req.body;
            const parentId = req.ownerId;

            // Récupérer le nom du propriétaire pour l'e-mail
            const ownerProfile = await Owner.findProfileById(parentId);
            const ownerName = ownerProfile?.full_name || "Votre agence SamaLocation";

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                // Un compte locataire ne peut pas être un collaborateur (règle métier)
                if (existingUser.role === 'tenant') {
                    return response.error(res, "Un compte locataire ne peut pas être ajouté comme collaborateur d'agence.", 400);
                }

                // Si l'utilisateur appartient déjà à une équipe, on refuse pour l'instant (sécurité)
                if (existingUser.parent_id) {
                    return response.error(res, "Cet utilisateur appartient déjà à une équipe.", 400);
                }

                // Lier le compte existant (et mettre à jour les permissions)
                await User.updateParentId(existingUser.id, parentId);
                await User.updatePermissions(existingUser.id, permissions || { can_view_revenue: false });

                // Envoyer un e-mail de notification
                await sendTeamAdditionEmail(email, ownerName);

                return response.success(res, existingUser, 'Utilisateur existant lié à votre équipe avec succès.', 200);
            }

            // Création d'un nouveau compte
            const id = uuidv4();
            const passwordHash = await bcrypt.hash(password, 10);
            const customId = `COL-${Math.floor(1000 + Math.random() * 9000)}`;

            const newUser = await User.create({
                id,
                customId,
                email,
                passwordHash,
                name,
                phone: phone || '',
                role: 'owner', // Collaborateur a le rôle owner pour accéder au dashboard propriétaire
                parentId,
                permissions: permissions || { can_view_revenue: false },
                isSetupComplete: true
            });

            // Envoyer l'e-mail d'invitation avec le mot de passe temporaire
            await sendTeamInvitationEmail(email, ownerName, password);

            return response.success(res, newUser, 'Collaborateur invité avec succès', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update collaborator permissions
     */
    async updateCollaboratorPermissions(req, res, next) {
        try {
            const { id } = req.params;
            const { permissions } = req.body;
            const parentId = req.ownerId;

            // Security: check if user is a collaborator of the requester
            const collaborators = await User.findCollaboratorsByParentId(parentId);
            const isMine = collaborators.some(c => c.id === id);

            if (!isMine) {
                return response.error(res, "Vous n'avez pas accès à ce collaborateur.", 403);
            }

            await User.updatePermissions(id, permissions);
            return response.success(res, null, 'Permissions mises à jour');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Remove a collaborator
     */
    async removeCollaborator(req, res, next) {
        try {
            const { id } = req.params;
            const parentId = req.ownerId;

            await User.removeCollaborator(id, parentId);
            return response.success(res, null, 'Collaborateur retiré de l\'équipe');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ownerController;
