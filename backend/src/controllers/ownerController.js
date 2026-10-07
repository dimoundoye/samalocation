const Owner = require('../models/ownerModel');
const User = require('../models/userModel');
const response = require('../utils/response');
const { sendTeamInvitationLink } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Property = require('../models/propertyModel');
const TeamInvitation = require('../models/teamInvitationModel');
const logActivity = require('../utils/logActivity');

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
            const { deleteMultipleFromCloudinary } = require('../utils/cloudinaryHelper');

            const existingProfile = await Owner.findProfileById(userId);
            if (existingProfile) {
                const oldFiles = [];
                if (req.body.logo_url && existingProfile.logo_url && req.body.logo_url !== existingProfile.logo_url) {
                    oldFiles.push(existingProfile.logo_url);
                }
                // L'ancienne signature n'est JAMAIS supprimée : les contrats et reçus déjà émis gardent un lien
                // vers l'image signée à l'époque (valeur juridique, document figé).
                if (oldFiles.length > 0) {
                    deleteMultipleFromCloudinary(oldFiles);
                }
            }

            const profile = await Owner.updateProfile(userId, req.body);

            // Journal d'activité
            await logActivity(req, {
                action: 'UPDATE',
                entityType: 'profile',
                entityId: userId,
                entityLabel: 'Profil public de l\'agence modifié',
                metadata: {}
            });

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
            const fullProfile = await Owner.findProfileById(id);

            if (!fullProfile) {
                return response.error(res, 'Propriétaire non trouvé', 404);
            }

            // Route publique : liste blanche stricte. Ne jamais exposer les pièces d'identité,
            // la signature, le selfie de vérification ou le solde du portefeuille.
            const PUBLIC_FIELDS = [
                'id', 'company_name', 'full_name', 'phone', 'address', 'bio', 'logo_url',
                'banner_url', 'prestations', 'horaires', 'social_links', 'external_email',
                'website', 'verification_status', 'is_verified', 'currency', 'created_at'
            ];
            const profile = {};
            for (const field of PUBLIC_FIELDS) {
                if (fullProfile[field] !== undefined) profile[field] = fullProfile[field];
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

            // Journal d'activité
            await logActivity(req, {
                action: 'INVITE',
                entityType: 'team',
                entityId: invitation.id,
                entityLabel: `Agent ${email} invité dans l'équipe`,
                metadata: { email, permissions }
            });

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

            // Seul le compte connecté avec l'adresse invitée peut accepter : le lien seul ne suffit pas
            const user = req.user;
            if (user.email?.toLowerCase() !== invitation.invitee_email?.toLowerCase()) {
                return response.error(res, "Cette invitation a été envoyée à une autre adresse e-mail. Connectez-vous avec le compte invité.", 403);
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

            // Journal d'activité
            const targetUser = collaborators.find(c => c.id === id);
            await logActivity(req, {
                action: 'UPDATE',
                entityType: 'team',
                entityId: id,
                entityLabel: `Permissions de ${targetUser?.full_name || id} modifiées`,
                metadata: { permissions }
            });

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

            // Récupérer le nom de l'agent avant suppression
            const collaboratorsBefore = await User.findCollaboratorsByParentId(parentId);
            const agentToRemove = collaboratorsBefore.find(c => c.id === id);

            await User.removeCollaborator(id, parentId);

            // Journal d'activité
            await logActivity(req, {
                action: 'REMOVE',
                entityType: 'team',
                entityId: id,
                entityLabel: `Agent ${agentToRemove?.full_name || agentToRemove?.email || id} retiré de l'équipe`,
                metadata: { email: agentToRemove?.email }
            });

            return response.success(res, null, 'Collaborateur retiré de l\'équipe');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ownerController;
