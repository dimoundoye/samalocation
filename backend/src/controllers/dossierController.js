const Dossier = require('../models/dossierModel');
const response = require('../utils/response');
const Property = require('../models/propertyModel');
const Notification = require('../models/notificationModel');
const Subscription = require('../models/subscriptionModel');
const { v4: uuidv4 } = require('uuid');

const dossierController = {
    /**
     * Récupère le dossier de l'utilisateur connecté
     */
    async getMyDossier(req, res, next) {
        try {
            const userId = req.user.id;
            const dossier = await Dossier.findByUserId(userId);
            return response.success(res, dossier);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Enregistre ou met à jour le dossier
     */
    async saveDossier(req, res, next) {
        try {
            const userId = req.user.id;
            const dossier = await Dossier.save(userId, req.body);
            return response.success(res, dossier, 'Dossier mis à jour avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Partage le dossier pour un bien spécifique
     */
    async shareDossier(req, res, next) {
        try {
            const userId = req.user.id;
            const { propertyId } = req.body;

            const dossier = await Dossier.findByUserId(userId);
            if (!dossier) {
                return response.error(res, 'Veuillez d\'abord créer votre dossier', 400);
            }

            const property = await Property.findById(propertyId);
            if (!property) {
                return response.error(res, 'Bien non trouvé', 404);
            }

            const share = await Dossier.share(dossier.id, property.owner_id, propertyId);

            // Créer une notification pour le propriétaire
            await Notification.create({
                id: uuidv4(),
                user_id: property.owner_id,
                type: 'dossier_shared',
                title: 'Nouveau dossier partagé',
                message: `Un candidat a partagé son dossier pour le bien : ${property.name}`,
                link: '/owner-dashboard/dossiers'
            });

            return response.success(res, share, 'Dossier partagé avec succès');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Liste les dossiers partagés avec le propriétaire connecté
     */
    async getSharedDossiers(req, res, next) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const dossiers = await Dossier.findSharedWith(ownerId);
            return response.success(res, dossiers);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Récupère les détails d'un dossier partagé spécifique
     */
    async getSharedDossierDetails(req, res, next) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const { dossierId } = req.params;

            // Vérifier l'abonnement pour la consultation de dossier
            const canConsult = await Subscription.hasAccessToFeature(req.user.id, 'dossier_consultation');
            if (!canConsult) {
                return response.error(res, 'Votre abonnement actuel ne permet pas de consulter les dossiers digitaux. Veuillez passer à un plan Premium.', 403);
            }

            const hasAccess = await Dossier.hasAccess(dossierId, ownerId);
            if (!hasAccess) {
                return response.error(res, 'Accès non autorisé à ce dossier', 403);
            }

            const dossier = await Dossier.findById(dossierId);
            return response.success(res, dossier);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Met à jour le statut d'un dossier partagé
     */
    async updateSharedDossierStatus(req, res, next) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const { dossierId } = req.params;
            const { status } = req.body;

            // Vérifier l'abonnement pour la consultation/gestion de dossier
            const canConsult = await Subscription.hasAccessToFeature(req.user.id, 'dossier_consultation');
            if (!canConsult) {
                return response.error(res, 'Votre abonnement actuel ne permet pas de gérer les dossiers digitaux. Veuillez passer à un plan Premium.', 403);
            }

            const hasAccess = await Dossier.hasAccess(dossierId, ownerId);
            if (!hasAccess) {
                return response.error(res, 'Accès non autorisé', 403);
            }

            const updatedShare = await Dossier.updateShareStatus(dossierId, ownerId, status);
            return response.success(res, updatedShare, 'Statut du dossier mis à jour');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Récupère les partages créés par le locataire
     */
    async getMyDossierShares(req, res, next) {
        try {
            const userId = req.user.id;
            const dossier = await Dossier.findByUserId(userId);
            if (!dossier) return response.success(res, []);
            
            const shares = await Dossier.findSharesByDossierId(dossier.id);
            return response.success(res, shares);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Révoque un partage de dossier par le locataire
     */
    async revokeDossierShare(req, res, next) {
        try {
            const userId = req.user.id;
            const { ownerId } = req.params;
            const { propertyId } = req.query;

            const dossier = await Dossier.findByUserId(userId);
            if (!dossier) return response.error(res, 'Dossier non trouvé', 404);

            await Dossier.deleteShare(dossier.id, ownerId, propertyId);
            return response.success(res, null, 'Accès révoqué avec succès');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = dossierController;
