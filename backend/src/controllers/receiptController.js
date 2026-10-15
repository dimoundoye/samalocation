const Receipt = require('../models/receiptModel');
const DepositSettlement = require('../models/depositSettlementModel');
const Subscription = require('../models/subscriptionModel');
const { generateReceiptPDF, generateDepositSettlementPDF } = require('../utils/pdfGenerator');
const response = require('../utils/response');
const logActivity = require('../utils/logActivity');
const { emitToWorkspace } = require('../utils/socket');
const Notification = require('../models/notificationModel');
const { v4: uuidv4 } = require('uuid');

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
                amount,
                payment_date,
                payment_method,
                notes,
                period_type,
                start_date,
                end_date
            } = req.body;
            let { month, year } = req.body;
            const ownerId = req.ownerId;

            // Caution (dépôt de garantie) : pas de période, rattachée au mois de son versement
            const receiptType = req.body.receipt_type === 'deposit' ? 'deposit' : 'rent';
            const isDeposit = receiptType === 'deposit';
            if (isDeposit && payment_date) {
                const paidOn = new Date(payment_date);
                if (!isNaN(paidOn.getTime())) {
                    month = paidOn.getMonth() + 1;
                    year = paidOn.getFullYear();
                }
            }

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

            // Une seule caution détenue à la fois par locataire et par logement
            if (isDeposit) {
                const existing = await Receipt.findHeldDeposit({ tenant_id, property_id, unit_id });
                if (existing) {
                    const formattedAmount = Number(existing.amount).toLocaleString('fr-FR');
                    return response.error(
                        res,
                        `Une caution de ${formattedAmount} F CFA est déjà enregistrée pour ce locataire sur ce logement (reçu N° ${existing.receipt_number}). Annulez-la ou restituez-la avant d'en émettre une nouvelle.`,
                        409
                    );
                }
            }

            // Quota mensuel de quittances : contrôlé par checkReceiptLimit (subscriptionMiddleware), cautions exclues

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
                period_type: isDeposit ? 'mois' : period_type,
                start_date: isDeposit ? null : start_date,
                end_date: isDeposit ? null : end_date,
                receipt_type: receiptType
            });

            console.log('✅ Receipt created successfully:', receipt);
            emitToWorkspace(ownerId, 'workspace_updated', { entity: 'receipts', action: 'create', id: receipt.id });

            // Créer une notification pour le locataire
            try {
                // tenant_id peut être l'identifiant du bail (tenants.id) : la notification va au compte du locataire
                const { rows: leaseRows } = await db.query('SELECT user_id FROM tenants WHERE id = $1', [tenant_id]);
                await Notification.create({
                    id: uuidv4(),
                    user_id: leaseRows[0]?.user_id || tenant_id,
                    type: 'receipt',
                    title: isDeposit ? 'Nouveau reçu de caution' : 'Nouveau reçu de loyer',
                    message: isDeposit
                        ? `Votre reçu de caution N° ${receipt.receipt_number} est maintenant disponible.`
                        : `Votre reçu de paiement N° ${receipt.receipt_number} pour ${month}/${year} est maintenant disponible.`,
                    link: '/tenant-dashboard/contracts'
                });
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
                    entityLabel: isDeposit
                        ? `Reçu de caution de ${formattedAmount} F CFA pour ${tenantName} — ${propName}`
                        : `Reçu de ${formattedAmount} F CFA pour ${tenantName} — ${propName} (${month}/${year})`,
                    metadata: { amount, month, year, tenant_id, property_id, receipt_type: receiptType }
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
     * Annuler une quittance avec motif (norme A+B anti-fraude)
     */
    async cancelReceipt(req, res, next) {
        try {
            const { id } = req.params;
            const { cancellation_reason } = req.body;
            const ownerId = req.ownerId;
            const userId = req.user.id;

            if (!cancellation_reason || !cancellation_reason.trim()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Un motif d\'annulation est obligatoire.'
                });
            }

            const receipt = await Receipt.findById(id);
            if (!receipt) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reçu non trouvé'
                });
            }

            // Vérifier que la propriété appartient au propriétaire / agence connecté
            const db = require('../config/db');
            const { rows: properties } = await db.query(
                'SELECT owner_id FROM properties WHERE id = $1',
                [receipt.property_id]
            );

            if (properties.length === 0 || (properties[0].owner_id !== ownerId && properties[0].owner_id !== userId)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Non autorisé à annuler cette quittance'
                });
            }

            const isDeposit = receipt.receipt_type === 'deposit';
            if (isDeposit && await DepositSettlement.findValidByReceiptId(String(id))) {
                return response.error(res, "Cette caution a déjà été restituée. Annulez d'abord la restitution.", 409);
            }

            const cancelledReceipt = await Receipt.cancel(id, cancellation_reason.trim(), userId);
            const documentLabel = isDeposit ? 'Reçu de caution' : 'Quittance';

            // Journal d'activité indélébile pour le patron / agence
            try {
                const tenantName = receipt.tenant_name || 'Locataire';
                const propName = receipt.property_name || 'Bien';
                const formattedAmount = Number(receipt.amount).toLocaleString('fr-FR');
                await logActivity(req, {
                    action: 'CANCEL',
                    entityType: 'tenant',
                    entityId: id,
                    entityLabel: `${documentLabel} N° ${receipt.receipt_number} de ${formattedAmount} F CFA ANNULÉ${isDeposit ? '' : 'E'} — ${tenantName} (${receipt.month}/${receipt.year}) | Motif: ${cancellation_reason.trim()}`,
                    metadata: { 
                        receipt_number: receipt.receipt_number, 
                        amount: receipt.amount, 
                        cancellation_reason: cancellation_reason.trim(),
                        tenant_name: tenantName,
                        property_name: propName,
                        month: receipt.month,
                        year: receipt.year
                    }
                });
            } catch (logErr) { console.error('Failed to log activity:', logErr); }

            // Envoyer une notification d'annulation au locataire
            try {
                if (receipt.tenant_id) {
                    await Notification.create({
                        id: uuidv4(),
                        user_id: receipt.tenant_id,
                        type: 'receipt',
                        title: isDeposit ? 'Reçu de caution annulé' : 'Quittance de loyer annulée',
                        message: isDeposit
                            ? `Le reçu de caution N° ${receipt.receipt_number} a été annulé par le propriétaire. Motif : ${cancellation_reason.trim()}`
                            : `La quittance N° ${receipt.receipt_number} (${receipt.month}/${receipt.year}) a été annulée par le propriétaire. Motif : ${cancellation_reason.trim()}`,
                        link: '/tenant-dashboard/contracts'
                    });
                }
            } catch (notifErr) { console.error('Failed to notify tenant:', notifErr); }

            return response.success(res, cancelledReceipt, `${documentLabel} annulé${isDeposit ? '' : 'e'} avec succès.`);
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
    },

    /**
     * Restituer une caution : en totalité, en partie (avec retenues motivées) ou retenue en totalité
     */
    async settleDeposit(req, res, next) {
        try {
            const { id } = req.params;
            const receipt = await Receipt.findById(id);
            if (!receipt || receipt.receipt_type !== 'deposit') {
                return response.error(res, 'Caution introuvable', 404);
            }
            if (receipt.status === 'cancelled') {
                return response.error(res, 'Ce reçu de caution est annulé : il ne peut pas être restitué.', 400);
            }

            const access = await getReceiptAccess(req, receipt);
            if (!access.isOwner) {
                return response.error(res, 'Non autorisé à restituer cette caution', 403);
            }
            if (await DepositSettlement.findValidByReceiptId(String(id))) {
                return response.error(res, 'Cette caution a déjà été restituée.', 409);
            }

            // Retenues : chacune doit avoir un motif et un montant positif
            const depositAmount = roundAmount(Number(receipt.amount));
            const rawDeductions = Array.isArray(req.body.deductions) ? req.body.deductions : [];
            if (rawDeductions.length > 30) {
                return response.error(res, 'Trop de retenues (30 maximum).', 400);
            }
            const deductions = [];
            for (const item of rawDeductions) {
                const amount = Number(item?.amount);
                const label = typeof item?.label === 'string' ? item.label.trim().slice(0, 200) : '';
                if (!Number.isFinite(amount) || amount < 0) {
                    return response.error(res, 'Montant de retenue invalide.', 400);
                }
                if (amount === 0) continue;
                if (!label) {
                    return response.error(res, 'Chaque retenue doit avoir un motif.', 400);
                }
                deductions.push({ label, amount: roundAmount(amount) });
            }

            const retainedAmount = roundAmount(deductions.reduce((sum, d) => sum + d.amount, 0));
            if (retainedAmount > depositAmount) {
                return response.error(res, 'Les retenues dépassent le montant de la caution.', 400);
            }
            const refundedAmount = roundAmount(depositAmount - retainedAmount);

            const settlementDate = req.body.settlement_date ? new Date(req.body.settlement_date) : new Date();
            if (isNaN(settlementDate.getTime())) {
                return response.error(res, 'Date de restitution invalide.', 400);
            }

            // Signature électronique figée sur le décompte, seulement si le plan l'inclut
            let ownerSignature = null;
            if (await Subscription.hasAccessToFeature(access.ownerId, 'electronic_signature')) {
                const db = require('../config/db');
                const { rows } = await db.query('SELECT signature_url FROM owner_profiles WHERE user_profile_id = $1', [access.ownerId]);
                ownerSignature = rows[0]?.signature_url || null;
            }

            const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 1000) : '';
            const settlement = await DepositSettlement.create({
                deposit_receipt_id: String(id),
                deposit_amount: depositAmount,
                refunded_amount: refundedAmount,
                retained_amount: retainedAmount,
                deductions,
                settlement_date: settlementDate.toISOString().split('T')[0],
                payment_method: refundedAmount > 0 ? (req.body.payment_method || 'virement') : null,
                notes: notes || null,
                owner_signature: ownerSignature,
                created_by: req.user.id
            });

            emitToWorkspace(req.ownerId, 'workspace_updated', { entity: 'receipts', action: 'update', id: receipt.id });

            const outcome = describeSettlement(settlement);
            try {
                const formattedRefund = refundedAmount.toLocaleString('fr-FR');
                await logActivity(req, {
                    action: 'UPDATE',
                    entityType: 'tenant',
                    entityId: receipt.id,
                    entityLabel: `Caution N° ${receipt.receipt_number} ${outcome} — ${formattedRefund} F CFA rendus à ${receipt.tenant_name || 'Locataire'} (décompte ${settlement.settlement_number})`,
                    metadata: { settlement_number: settlement.settlement_number, refunded_amount: refundedAmount, retained_amount: retainedAmount }
                });
            } catch (logErr) { /* silencieux */ }

            try {
                if (receipt.tenant_id) {
                    await Notification.create({
                        id: uuidv4(),
                        user_id: receipt.tenant_id,
                        type: 'receipt',
                        title: 'Restitution de votre caution',
                        message: `Votre caution (reçu N° ${receipt.receipt_number}) a été ${outcome}. Le décompte N° ${settlement.settlement_number} est disponible.`,
                        link: '/tenant-dashboard/contracts'
                    });
                }
            } catch (notifErr) { console.error('Failed to notify tenant:', notifErr); }

            return response.success(res, settlement, 'Restitution de la caution enregistrée.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Annuler une restitution de caution (avec motif) : la caution redevient détenue
     */
    async cancelDepositSettlement(req, res, next) {
        try {
            const { settlementId } = req.params;
            const reason = typeof req.body.cancellation_reason === 'string' ? req.body.cancellation_reason.trim() : '';
            if (!reason) {
                return response.error(res, "Un motif d'annulation est obligatoire.", 400);
            }

            const settlement = await DepositSettlement.findById(settlementId);
            if (!settlement || settlement.status !== 'valid') {
                return response.error(res, 'Restitution introuvable ou déjà annulée', 404);
            }
            const receipt = await Receipt.findById(settlement.deposit_receipt_id);
            if (!receipt) {
                return response.error(res, 'Caution introuvable', 404);
            }
            const access = await getReceiptAccess(req, receipt);
            if (!access.isOwner) {
                return response.error(res, 'Non autorisé à annuler cette restitution', 403);
            }

            const cancelled = await DepositSettlement.cancel(settlementId, reason, req.user.id);
            emitToWorkspace(req.ownerId, 'workspace_updated', { entity: 'receipts', action: 'update', id: receipt.id });

            try {
                await logActivity(req, {
                    action: 'CANCEL',
                    entityType: 'tenant',
                    entityId: receipt.id,
                    entityLabel: `Restitution de caution N° ${settlement.settlement_number} ANNULÉE — ${receipt.tenant_name || 'Locataire'} | Motif: ${reason}`,
                    metadata: { settlement_number: settlement.settlement_number, cancellation_reason: reason }
                });
            } catch (logErr) { /* silencieux */ }

            try {
                if (receipt.tenant_id) {
                    await Notification.create({
                        id: uuidv4(),
                        user_id: receipt.tenant_id,
                        type: 'receipt',
                        title: 'Restitution de caution annulée',
                        message: `Le décompte de restitution N° ${settlement.settlement_number} a été annulé par le propriétaire. Motif : ${reason}`,
                        link: '/tenant-dashboard/contracts'
                    });
                }
            } catch (notifErr) { console.error('Failed to notify tenant:', notifErr); }

            return response.success(res, cancelled, 'Restitution annulée.');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Télécharger (ou afficher) le décompte de restitution d'une caution en PDF
     */
    async downloadDepositSettlement(req, res, next) {
        try {
            const settlement = await DepositSettlement.findById(req.params.settlementId);
            if (!settlement) {
                return response.error(res, 'Décompte introuvable', 404);
            }
            const receipt = await Receipt.findById(settlement.deposit_receipt_id);
            if (!receipt) {
                return response.error(res, 'Caution introuvable', 404);
            }

            const access = await getReceiptAccess(req, receipt);
            if (!access.isOwner && !access.isTenant && !access.isAdmin) {
                return response.error(res, 'Non autorisé à consulter ce décompte', 403);
            }

            const hasBranding = access.ownerId ? await Subscription.hasAccessToFeature(access.ownerId, 'custom_branding') : false;
            const doc = await generateDepositSettlementPDF({
                ...receipt,
                logo_url: hasBranding ? receipt.logo_url : null,
                settlement
            });

            const isInline = req.query.inline === 'true';
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `${isInline ? 'inline' : 'attachment'}; filename=restitution-${settlement.settlement_number}.pdf`);
            doc.pipe(res);
            doc.end();
        } catch (error) {
            next(error);
        }
    }
};

/**
 * Droits de l'utilisateur sur un reçu : propriétaire (ou membre de son organisation), locataire, administrateur
 */
async function getReceiptAccess(req, receipt) {
    const db = require('../config/db');
    const { rows } = await db.query('SELECT owner_id FROM properties WHERE id = $1', [receipt.property_id]);
    const ownerId = rows[0]?.owner_id || null;
    return {
        ownerId,
        isOwner: !!ownerId && (ownerId === req.ownerId || ownerId === req.user.id),
        isTenant: receipt.tenant_id === req.user.id,
        isAdmin: req.user?.role === 'admin' || req.user?.role === 'ADMIN'
    };
}

function roundAmount(value) {
    return Math.round(value * 100) / 100;
}

/**
 * Issue de la restitution, pour les messages : « restituée en totalité », « restituée en partie », « retenue en totalité »
 */
function describeSettlement(settlement) {
    const refunded = Number(settlement.refunded_amount);
    const retained = Number(settlement.retained_amount);
    if (retained <= 0) return 'restituée en totalité';
    if (refunded <= 0) return 'retenue en totalité';
    return 'restituée en partie';
}

module.exports = receiptController;
