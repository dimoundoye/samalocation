const Receipt = require('../models/receiptModel');
const { generateReceiptPDF } = require('../utils/pdfGenerator');
const response = require('../utils/response');
const logActivity = require('../utils/logActivity');

const receiptController = {
    /**
     * Créer un nouveau reçu
     */
    async createReceipt(req, res, next) {
        try {
            const { 
                tenant_id, 
                property_id, 
                unit_id, 
                month, 
                year, 
                amount, 
                payment_date, 
                payment_method, 
                notes,
                period_type,
                start_date,
                end_date
            } = req.body;
            const ownerId = req.ownerId;

            console.log('📋 Creating receipt with data:', {
                tenant_id,
                property_id,
                month,
                year,
                amount,
                payment_date,
                payment_method,
                period_type,
                start_date,
                end_date,
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
            const { rows: properties } = await db.query(
                'SELECT id FROM properties WHERE id = $1 AND owner_id = $2',
                [property_id, ownerId]
            );

            if (properties.length === 0) {
                console.log('❌ Property not found or not owned by user');
                return res.status(403).json({
                    status: 'error',
                    message: 'Propriété non trouvée ou non autorisée'
                });
            }

            // --- Vérification du quota mensuel de quittances ---
            const Subscription = require('../models/subscriptionModel');
            const PLANS = require('../config/plans');
            
            // On récupère les stats de consommation actuelles
            const activeSub = await Subscription.findActiveByUserId(ownerId);
            let planKey = activeSub ? (activeSub.plan_name ? activeSub.plan_name.toUpperCase() : 'FREE') : 'FREE';
            if (planKey === 'PROFESSIONNEL' || planKey === 'PROFESSIONEL') planKey = 'PROFESSIONAL';
            const planConfig = PLANS[planKey] || PLANS.FREE;

            const maxReceipts = planConfig.limits.max_receipts_per_month;

            if (maxReceipts !== Infinity && maxReceipts !== -1) {
                // Compter les quittances générées ce mois-ci
                const { rows: countRows } = await db.query(`
                    SELECT COUNT(*) FROM receipts r
                    JOIN properties p ON r.property_id = p.id
                    WHERE (p.owner_id = $1 OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1))
                    AND EXTRACT(MONTH FROM r.created_at) = EXTRACT(MONTH FROM NOW())
                    AND EXTRACT(YEAR FROM r.created_at) = EXTRACT(YEAR FROM NOW())
                `, [ownerId]);
                
                const currentMonthCount = parseInt(countRows[0].count);
                
                if (currentMonthCount >= maxReceipts) {
                    return res.status(403).json({
                        status: 'error',
                        message: `Vous avez atteint votre limite mensuelle de ${maxReceipts} quittances pour le plan ${planConfig.name}. Veuillez passer au plan supérieur pour continuer.`
                    });
                }
            }
            // --------------------------------------------------

            console.log('✅ Property verified and limits checked, creating receipt...');
            const receipt = await Receipt.create({
                tenant_id,
                property_id,
                unit_id,
                month,
                year,
                amount,
                payment_date,
                payment_method,
                notes,
                period_type,
                start_date,
                end_date
            });

            console.log('✅ Receipt created successfully:', receipt);

            // Créer une notification pour le locataire
            try {
                await db.query(
                    `INSERT INTO notifications (id, user_id, type, title, message, created_at)
                    VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())`,
                    [
                        tenant_id,
                        'receipt',
                        'Nouveau reçu de loyer',
                        `Votre reçu de paiement N° ${receipt.receipt_number} pour ${month}/${year} est maintenant disponible.`
                    ]
                );
                console.log('✅ Notification created for tenant');
            } catch (notifError) {
                console.error('⚠️ Failed to create notification for tenant:', notifError);
            }

            // Journal d'activité
            try {
                const tenantName = receipt.tenant_name || 'Locataire inconnu';
                const propName = receipt.property_name || 'Bien inconnu';
                const formattedAmount = Number(amount).toLocaleString('fr-FR');
                await logActivity(req, {
                    action: 'GENERATE',
                    entityType: 'tenant',
                    entityId: receipt.id,
                    entityLabel: `Reçu de ${formattedAmount} F CFA pour ${tenantName} — ${propName} (${month}/${year})`,
                    metadata: { amount, month, year, tenant_id, property_id }
                });
            } catch (logErr) { /* silencieux */ }

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
            const limit = parseInt(req.query.limit) || 100;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const receipts = await Receipt.findByTenantId(userId, limit, offset);
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
            const ownerId = req.ownerId;
            const limit = parseInt(req.query.limit) || 200;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const receipts = await Receipt.findByOwnerId(ownerId, limit, offset);
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

            // Vérifier les permissions (locataire, propriétaire, administrateur ou collaborateur/agent)
            const db = require('../config/db');
            const { rows: properties } = await db.query(
                'SELECT owner_id FROM properties WHERE id = $1',
                [receipt.property_id]
            );

            const isOwner = properties.length > 0 && (properties[0].owner_id === req.ownerId || properties[0].owner_id === userId);
            const isTenant = receipt.tenant_id === userId;
            const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'ADMIN');

            if (!isOwner && !isTenant && !isAdmin) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Non autorisé à télécharger ce reçu'
                });
            }

            // --- Restriction Branding ---
            // Vérifier si le propriétaire a droit au branding personnalisé
            const Subscription = require('../models/subscriptionModel');
            const ownerId = properties.length > 0 ? properties[0].owner_id : (receipt.owner_id || null);
            const hasBranding = ownerId ? await Subscription.hasAccessToFeature(ownerId, 'custom_branding') : false;
            
            if (!hasBranding) {
                receipt.logo_url = null;
            }
            // ----------------------------

            // Générer le PDF
            const doc = await generateReceiptPDF(receipt);

            // Configurer les headers pour le téléchargement ou l'affichage en ligne
            const isInline = req.query.inline === 'true' || req.query.disposition === 'inline';
            const disposition = isInline ? 'inline' : 'attachment';

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `${disposition}; filename=recu-${receipt.receipt_number}.pdf`);

            // Log de succès
            if (isInline) {
                console.log(`✅ [SUCCÈS PREVISUALISATION] Reçu N° ${receipt.receipt_number} (ID: ${id}) ouvert en ligne par ${req.user?.full_name || 'Utilisateur'}`);
            } else {
                console.log(`✅ [SUCCÈS TÉLÉCHARGEMENT] Reçu N° ${receipt.receipt_number} (ID: ${id}) téléchargé par ${req.user?.full_name || 'Utilisateur'}`);
            }

            // Streamer le PDF
            doc.pipe(res);
            doc.end();
        } catch (error) {
            console.error(`❌ [ÉCHEC REÇU] Erreur lors de la prévisualisation/téléchargement du reçu ID ${req.params.id}:`, error);
            next(error);
        }
    },

    /**
     * Supprimer un reçu
     */
    async deleteReceipt(req, res, next) {
        try {
            const { id } = req.params;
            const ownerId = req.ownerId;

            const receipt = await Receipt.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reçu non trouvé'
                });
            }

            // Vérifier que la propriété appartient au propriétaire connecté
            const db = require('../config/db');
            const { rows: properties } = await db.query(
                'SELECT owner_id FROM properties WHERE id = $1',
                [receipt.property_id]
            );

            if (properties.length === 0 || properties[0].owner_id !== ownerId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Non autorisé à supprimer ce reçu'
                });
            }

            await Receipt.delete(id);

            // Journal d'activité
            await logActivity(req, {
                action: 'DELETE',
                entityType: 'tenant',
                entityId: id,
                entityLabel: `Reçu supprimé : ${receipt.tenant_name || receipt.tenant_id} — ${receipt.property_name || receipt.property_id} (${receipt.month}/${receipt.year})`,
                metadata: { receipt_number: receipt.receipt_number, amount: receipt.amount }
            });

            return response.success(res, null, 'Reçu supprimé avec succès');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = receiptController;
