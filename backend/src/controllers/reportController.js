const { v4: uuidv4 } = require('uuid');
const Report = require('../models/reportModel');
const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

// Motifs de signalement d'une annonce (clé envoyée par le navigateur → libellé enregistré)
const PROPERTY_REPORT_CATEGORIES = {
    scam: 'Arnaque ou annonce frauduleuse',
    unavailable: 'Bien déjà loué, vendu ou indisponible',
    misleading: 'Informations ou photos trompeuses',
    price: 'Prix incorrect ou abusif',
    broker: 'Intermédiaire / courtier se faisant passer pour le propriétaire',
    inappropriate: 'Contenu inapproprié ou offensant',
    other: 'Autre',
};

const MAX_REPORT_PHOTOS = 5;

/**
 * Photos jointes à un signalement : uniquement des images déjà envoyées sur notre compte Cloudinary
 * (route /api/upload). L'admin les affiche telles quelles, donc aucune autre URL n'est acceptée.
 * @returns {string[] | null} la liste validée, ou null si elle est invalide
 */
function parseReportPhotos(rawPhotos) {
    if (rawPhotos === undefined || rawPhotos === null) return [];
    if (!Array.isArray(rawPhotos) || rawPhotos.length > MAX_REPORT_PHOTOS) return null;

    const cloudName = cloudinary.config().cloud_name;
    const allowedPrefix = cloudName
        ? `https://res.cloudinary.com/${cloudName}/image/upload/`
        : 'https://res.cloudinary.com/';
    const valid = rawPhotos.every(url => typeof url === 'string' && url.length <= 500 && url.startsWith(allowedPrefix));
    return valid ? rawPhotos : null;
}

const reportController = {
    /**
     * Créer un nouveau signalement (locataire)
     */
    async createReport(req, res, next) {
        try {
            if (req.body.property_id) {
                return reportController.createPropertyReport(req, res, next);
            }

            const { reported_id, reason } = req.body;
            const reporter_id = req.user.id;

            const photos = parseReportPhotos(req.body.photos);
            if (photos === null) {
                return res.status(400).json({
                    status: 'error',
                    message: `Photos invalides (${MAX_REPORT_PHOTOS} maximum, envoyées depuis le formulaire de signalement).`
                });
            }

            // Validation
            if (!reported_id || !reason) {
                return res.status(400).json({
                    status: 'error',
                    message: 'reported_id et reason sont requis'
                });
            }

            if (reason.trim().length < 10) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Le motif doit contenir au moins 10 caractères'
                });
            }

            // Créer le signalement
            const reportData = {
                id: uuidv4(),
                reporter_id,
                reported_id,
                reason: reason.trim(),
                photos
            };

            const report = await Report.create(reportData);

            res.status(201).json({
                status: 'success',
                message: 'Signalement créé avec succès',
                data: report
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Signaler une annonce publiée (tout utilisateur connecté).
     * Le signalement vise le propriétaire de l'annonce (reported_id) et garde le bien concerné.
     */
    async createPropertyReport(req, res, next) {
        try {
            const { property_id, category } = req.body;
            const details = String(req.body.reason || '').trim();
            const reporter_id = req.user.id;

            if (!PROPERTY_REPORT_CATEGORIES[category]) {
                return res.status(400).json({ status: 'error', message: 'Motif de signalement invalide' });
            }
            // Détails obligatoires pour « Autre », facultatifs sinon
            if (category === 'other' && details.length < 10) {
                return res.status(400).json({ status: 'error', message: 'Décrivez le problème en au moins 10 caractères' });
            }
            if (details.length > 1000) {
                return res.status(400).json({ status: 'error', message: 'Description trop longue (1000 caractères maximum)' });
            }

            const { rows } = await db.query(
                'SELECT id, owner_id, is_published FROM properties WHERE id::text = $1',
                [String(property_id)]
            );
            const property = rows[0];
            if (!property || !property.is_published) {
                return res.status(404).json({ status: 'error', message: 'Annonce introuvable' });
            }
            if (String(property.owner_id) === String(reporter_id) || (req.ownerId && String(property.owner_id) === String(req.ownerId))) {
                return res.status(400).json({ status: 'error', message: 'Vous ne pouvez pas signaler votre propre annonce' });
            }
            if (await Report.findPendingForProperty(reporter_id, String(property.id))) {
                return res.status(409).json({ status: 'error', message: 'Vous avez déjà signalé cette annonce. Notre équipe l\'examine.' });
            }

            const reason = details
                ? `${PROPERTY_REPORT_CATEGORIES[category]} — ${details}`
                : PROPERTY_REPORT_CATEGORIES[category];

            const report = await Report.create({
                id: uuidv4(),
                reporter_id,
                reported_id: String(property.owner_id),
                reason,
                property_id: String(property.id),
                category,
            });

            res.status(201).json({
                status: 'success',
                message: 'Signalement envoyé. Merci, notre équipe va examiner cette annonce.',
                data: { id: report.id }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Récupérer tous les signalements (admin)
     */
    async getAllReports(req, res, next) {
        try {
            const { status, reported_id } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (reported_id) filters.reported_id = reported_id;

            const reports = await Report.findAll(filters);

            res.json({
                status: 'success',
                data: reports
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Récupérer les statistiques des signalements (admin)
     */
    async getStatistics(req, res, next) {
        try {
            const stats = await Report.getStatistics();

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Mettre à jour un signalement (admin)
     */
    async updateReport(req, res, next) {
        try {
            const { id } = req.params;
            const { status, admin_notes } = req.body;

            if (!status) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Le statut est requis'
                });
            }

            const validStatuses = ['pending', 'reviewed', 'resolved'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Statut invalide'
                });
            }

            await Report.updateStatus(id, status, admin_notes);

            res.json({
                status: 'success',
                message: 'Signalement mis à jour'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = reportController;
