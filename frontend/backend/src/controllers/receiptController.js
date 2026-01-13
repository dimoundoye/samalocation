const Receipt = require('../models/receiptModel');
const { generateReceiptPDF } = require('../utils/pdfGenerator');
const response = require('../utils/response');

const receiptController = {
    /**
     * Créer un nouveau reçu
     */
    async createReceipt(req, res, next) {
        try {
            const { tenant_id, property_id, month, year, amount, payment_date, payment_method, notes } = req.body;
            const ownerId = req.user.id;

            console.log('📋 Creating receipt with data:', {
                tenant_id,
                property_id,
                month,
                year,
                amount,
                payment_date,
                payment_method,
                notes,
                ownerId
            });

            // Validation
            if (!tenant_id || !property_id || !month || !year || !amount || !payment_date) {
                console.log('❌ Validation failed - missing fields');
                return res.status(400).json({
                    status: 'error',
                    message: 'Tous les champs requis doivent être remplis'
                });
            }

            // Vérifier que la propriété appartient au propriétaire connecté
            const db = require('../config/db');
            const [properties] = await db.query(
                'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
                [property_id, ownerId]
            );

            if (properties.length === 0) {
                console.log('❌ Property not found or not owned by user');
                return res.status(403).json({
                    status: 'error',
                    message: 'Propriété non trouvée ou non autorisée'
                });
            }

            console.log('✅ Property verified, creating receipt...');
            const receipt = await Receipt.create({
                tenant_id,
                property_id,
                month,
                year,
                amount,
                payment_date,
                payment_method,
                notes
            });

            console.log('✅ Receipt created successfully:', receipt);

            // Créer une notification pour le locataire
            try {
                await db.query(
                    `INSERT INTO notifications (id, user_id, type, title, message, created_at)
                    VALUES (UUID(), ?, 'receipt', ?, ?, NOW())`,
                    [
                        tenant_id,
                        'Nouveau reçu de loyer',
                        `Votre reçu de paiement N° ${receipt.receipt_number} pour ${month}/${year} est maintenant disponible.`
                    ]
                );
                console.log('✅ Notification created for tenant');
            } catch (notifError) {
                console.error('⚠️ Failed to create notification for tenant:', notifError);
            }

            return response.success(res, receipt, 'Reçu créé avec succès');
        } catch (error) {
            console.error('❌ Error in createReceipt:', error);
            next(error);
        }
    },

    /**
     * Récupérer les reçus d'un locataire
     */
    async getTenantReceipts(req, res, next) {
        try {
            const userId = req.user.id;
            const receipts = await Receipt.findByTenantId(userId);
            return response.success(res, receipts);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Récupérer les reçus créés par un propriétaire
     */
    async getOwnerReceipts(req, res, next) {
        try {
            const ownerId = req.user.id;
            const receipts = await Receipt.findByOwnerId(ownerId);
            return response.success(res, receipts);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Télécharger un reçu en PDF
     */
    async downloadReceipt(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Récupérer le reçu avec toutes les informations
            const receipt = await Receipt.findById(id);

            if (!receipt) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reçu non trouvé'
                });
            }

            // Vérifier les permissions (locataire ou propriétaire)
            const db = require('../config/db');
            const [properties] = await db.query(
                'SELECT owner_id FROM properties WHERE id = ?',
                [receipt.property_id]
            );

            const isOwner = properties.length > 0 && properties[0].owner_id === userId;
            const isTenant = receipt.tenant_id === userId;

            if (!isOwner && !isTenant) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Non autorisé à télécharger ce reçu'
                });
            }

            // Générer le PDF
            const doc = generateReceiptPDF(receipt);

            // Configurer les headers pour le téléchargement
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=recu-${receipt.receipt_number}.pdf`);

            // Streamer le PDF
            doc.pipe(res);
            doc.end();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Supprimer un reçu
     */
    async deleteReceipt(req, res, next) {
        try {
            const { id } = req.params;
            const ownerId = req.user.id;

            const receipt = await Receipt.findById(id);

            if (!receipt) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reçu non trouvé'
                });
            }

            // Vérifier que c'est le propriétaire qui supprime
            const db = require('../config/db');
            const [properties] = await db.query(
                'SELECT owner_id FROM properties WHERE id = ?',
                [receipt.property_id]
            );

            if (properties.length === 0 || properties[0].owner_id !== ownerId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Non autorisé à supprimer ce reçu'
                });
            }

            await Receipt.delete(id);
            return response.success(res, null, 'Reçu supprimé avec succès');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = receiptController;
