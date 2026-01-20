const { v4: uuidv4 } = require('uuid');
const Report = require('../models/reportModel');

const reportController = {
    /**
     * Créer un nouveau signalement (locataire)
     */
    async createReport(req, res, next) {
        try {
            const { reported_id, reason } = req.body;
            const reporter_id = req.user.id;

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
                reason: reason.trim()
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
