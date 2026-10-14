const Owner = require('../models/ownerModel');
const User = require('../models/userModel');
const response = require('../utils/response');
const { sendTeamInvitationLink } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Property = require('../models/propertyModel');
const TeamInvitation = require('../models/teamInvitationModel');
const logActivity = require('../utils/logActivity');
const Organization = require('../models/organizationModel');
const { syncMembership } = require('../utils/socket');
const { hasProfessionalPlan, PRO_AGENT_MESSAGE } = require('../utils/workspaces');

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
            const collaborators = await Organization.findCollaborators(req.ownerId);
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
            const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
            // Seul ce choix est accepté : le rôle (gestionnaire / agent) en découle, rien d'autre n'est stocké
            const permissions = { can_view_revenue: req.body.permissions?.can_view_revenue === true };
            const organizationId = req.ownerId;

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return response.error(res, "Adresse e-mail invalide.", 400);
            }

            // Récupérer le nom du propriétaire pour l'e-mail
            const ownerProfile = await Owner.findProfileById(organizationId);
            const ownerName = ownerProfile?.full_name || "Votre agence SamaLocation";

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                if (existingUser.id === organizationId || existingUser.id === req.user.id) {
                    return response.error(res, "Vous ne pouvez pas vous inviter vous-même.", 400);
                }

                // Un compte locataire ne peut pas être un collaborateur (règle métier)
                if (existingUser.role === 'tenant') {
                    return response.error(res, "Un compte locataire ne peut pas être ajouté comme collaborateur d'agence.", 400);
                }

                // Un agent peut appartenir à plusieurs équipes, mais pas deux fois à la même
                if (await Organization.isActiveMember(existingUser.id, organizationId)) {
                    return response.error(res, "Cet utilisateur fait déjà partie de votre équipe.", 400);
                }

                if (await hasProfessionalPlan(existingUser.id)) {
                    return response.error(res, PRO_AGENT_MESSAGE, 400);
                }
            }

            // Créer l'invitation (une invitation encore en attente est renouvelée et renvoyée)
            const invitation = await TeamInvitation.create(organizationId, email, permissions);

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
     * Get invitation details (route publique : seul le nécessaire à l'affichage est renvoyé)
     */
    async getInvitationDetails(req, res, next) {
        try {
            const { token } = req.params;
            const invitation = await TeamInvitation.findByToken(token);

            if (!invitation) {
                return response.error(res, "Invitation invalide ou expirée.", 404);
            }

            return response.success(res, {
                inviter_id: invitation.inviter_id,
                inviter_name: invitation.inviter_name,
                invitee_email: invitation.invitee_email,
                permissions: { can_view_revenue: invitation.permissions?.can_view_revenue === true },
                expires_at: invitation.expires_at
            });
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
            if (user.role === 'tenant') {
                return response.error(res, "Un compte locataire ne peut pas rejoindre une équipe de gestion.", 403);
            }
            if (user.id === invitation.inviter_id) {
                return response.error(res, "Vous ne pouvez pas rejoindre votre propre équipe.", 400);
            }
            // Le plan a pu être pris entre l'envoi de l'invitation et son acceptation
            if (await hasProfessionalPlan(user.id)) {
                return response.error(res, PRO_AGENT_MESSAGE, 403);
            }

            // Usage unique : si deux acceptations arrivent en même temps, une seule passe
            const claimed = await TeamInvitation.updateStatus(invitation.id, 'accepted');
            if (!claimed) {
                return response.error(res, "Invitation invalide ou expirée.", 404);
            }

            // Ajoute l'équipe sans retirer les autres (un agent peut gérer pour plusieurs propriétaires)
            await User.joinTeam(user.id, invitation.inviter_id, invitation.permissions);
            await syncMembership(user.id, invitation.inviter_id, true);

            return response.success(res, { organization_id: invitation.inviter_id }, 'Félicitations ! Vous avez rejoint l\'équipe.');
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
            const permissions = { can_view_revenue: req.body.permissions?.can_view_revenue === true };
            const organizationId = req.ownerId;

            // Sécurité : seul un membre de l'équipe de l'organisation active peut être modifié
            const collaborators = await Organization.findCollaborators(organizationId);
            const targetUser = collaborators.find(c => c.id === id);

            if (!targetUser) {
                return response.error(res, "Vous n'avez pas accès à ce collaborateur.", 403);
            }

            await User.updateTeamPermissions(id, organizationId, permissions);

            // Journal d'activité
            await logActivity(req, {
                action: 'UPDATE',
                entityType: 'team',
                entityId: id,
                entityLabel: `Permissions de ${targetUser.full_name || id} modifiées`,
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
            const organizationId = req.ownerId;

            const collaborators = await Organization.findCollaborators(organizationId);
            const agentToRemove = collaborators.find(c => c.id === id);
            if (!agentToRemove) {
                return response.error(res, "Vous n'avez pas accès à ce collaborateur.", 403);
            }

            // Retire uniquement l'accès à cette organisation : ses autres équipes ne sont pas touchées
            await User.leaveTeam(id, organizationId);
            await syncMembership(id, organizationId, false);

            // Journal d'activité
            await logActivity(req, {
                action: 'REMOVE',
                entityType: 'team',
                entityId: id,
                entityLabel: `Agent ${agentToRemove.full_name || agentToRemove.email || id} retiré de l'équipe`,
                metadata: { email: agentToRemove.email }
            });

            return response.success(res, null, 'Collaborateur retiré de l\'équipe');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ownerController;
