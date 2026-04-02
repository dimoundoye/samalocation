const Owner = require('../models/ownerModel');
const User = require('../models/userModel');
const response = require('../utils/response');
const { sendTeamInvitationLink } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Property = require('../models/propertyModel');
const TeamInvitation = require('../models/teamInvitationModel');

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
     * Get public owner profile
     */
    async getPublicProfile(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await Owner.findProfileById(id);
            
            if (!profile) {
                return response.error(res, 'Propriétaire non trouvé', 404);
            }

            // Fetch published properties
            const properties = await Property.findByOwnerId(id);
            const publishedProperties = properties.filter(p => p.is_published);

            return response.success(res, {
                profile,
                properties: publishedProperties
            });
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
     * Add a collaborator (sends invitation)
     */
    async addCollaborator(req, res, next) {
        try {
            const { email, permissions } = req.body;
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
            }

            // Vérifier si une invitation est déjà en cours
            const existingInvite = await TeamInvitation.findByEmailAndInviter(email, parentId);
            if (existingInvite) {
                return response.error(res, "Une invitation est déjà en cours pour cet email.", 400);
            }

            // Créer l'invitation
            const invitation = await TeamInvitation.create(parentId, email, permissions || { can_view_revenue: false });

            // Envoyer l'e-mail d'invitation avec le lien d'acceptation
            await sendTeamInvitationLink(email, ownerName, invitation.token, !!existingUser);

            return response.success(res, null, 'Invitation envoyée avec succès', 201);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get invitation details
     */
    async getInvitationDetails(req, res, next) {
        try {
            const { token } = req.params;
            const invitation = await TeamInvitation.findByToken(token);

            if (!invitation) {
                return response.error(res, "Invitation invalide ou expirée.", 404);
            }

            return response.success(res, invitation);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Accept invitation
     */
    async acceptInvitation(req, res, next) {
        try {
            const { token } = req.params;
            const invitation = await TeamInvitation.findByToken(token);

            if (!invitation) {
                return response.error(res, "Invitation invalide ou expirée.", 404);
            }

            // Vérifier si l'utilisateur est connecté et si son email correspond
            // (Note: on peut aussi permettre à un nouvel utilisateur de s'inscrire via ce token)
            const user = await User.findByEmail(invitation.invitee_email);
            
            if (!user) {
                return response.error(res, "Vous devez d'abord créer un compte avec l'adresse e-mail invitée.", 403);
            }

            // Mettre à jour l'utilisateur
            await User.updateParentId(user.id, invitation.inviter_id);
            await User.updatePermissions(user.id, invitation.permissions);
            
            // Marquer l'invitation comme acceptée
            await TeamInvitation.updateStatus(invitation.id, 'accepted');

            return response.success(res, null, 'Félicitations ! Vous avez rejoint l\'équipe.');
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
