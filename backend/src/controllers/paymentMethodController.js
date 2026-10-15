const PaymentMethod = require('../models/paymentMethodModel');
const Tenant = require('../models/tenantModel');
const Notification = require('../models/notificationModel');
const response = require('../utils/response');
const logActivity = require('../utils/logActivity');
const { v4: uuidv4 } = require('uuid');

const MAX_METHODS = 6;
const METHOD_TYPES = ['wave_link', 'wave', 'orange_money', 'bank'];

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * Valide et normalise les coordonnées saisies par le propriétaire.
 * Renvoie { methods } ou { error }.
 */
const normalizeMethods = (input) => {
    if (!Array.isArray(input)) return { error: 'Format des moyens de paiement invalide.' };
    if (input.length > MAX_METHODS) return { error: `${MAX_METHODS} moyens de paiement au maximum.` };

    const methods = [];
    for (const raw of input) {
        const type = raw?.type;
        if (!METHOD_TYPES.includes(type)) return { error: 'Type de moyen de paiement inconnu.' };
        const method = { type, instructions: clean(raw.instructions, 300) };

        if (type === 'wave_link') {
            const url = clean(raw.url, 300);
            // Seuls les liens Wave officiels sont acceptés : évite qu'un lien piégé soit présenté comme un paiement
            if (!/^https:\/\/pay\.wave\.com\/[^\s]+$/i.test(url)) {
                return { error: 'Le lien Wave doit commencer par https://pay.wave.com/' };
            }
            method.url = url;
        } else if (type === 'wave' || type === 'orange_money') {
            const phone = clean(raw.phone, 20).replace(/[\s.-]/g, '');
            if (!/^\+?\d{7,15}$/.test(phone)) return { error: 'Numéro de téléphone invalide.' };
            method.phone = phone;
            method.holder = clean(raw.holder, 100);
        } else if (type === 'bank') {
            method.holder = clean(raw.holder, 100);
            method.bank_name = clean(raw.bank_name, 100);
            method.iban = clean(raw.iban, 60).replace(/\s+/g, ' ');
            if (!method.holder || !method.iban) return { error: 'Le titulaire et le RIB / IBAN sont obligatoires pour un virement.' };
        }
        methods.push(method);
    }
    return { methods };
};

const paymentMethodController = {
    // ---------- Propriétaire : coordonnées ----------

    async getMyMethods(req, res, next) {
        try {
            const data = await PaymentMethod.getMethods(req.ownerId);
            return response.success(res, data);
        } catch (error) {
            next(error);
        }
    },

    async updateMyMethods(req, res, next) {
        try {
            const { methods, error } = normalizeMethods(req.body?.methods);
            if (error) return response.error(res, error, 400);

            const ownerId = req.ownerId;
            const previous = await PaymentMethod.getMethods(ownerId);
            const saved = await PaymentMethod.saveMethods(ownerId, methods, req.user.id);

            // Coordonnées modifiées : on prévient les locataires (parade contre le détournement de paiements)
            const changed = JSON.stringify(previous.methods || []) !== JSON.stringify(methods);
            if (changed && (previous.methods || []).length > 0) {
                const tenantUserIds = await PaymentMethod.findActiveTenantUserIds(ownerId);
                for (const userId of tenantUserIds) {
                    try {
                        await Notification.create({
                            id: uuidv4(),
                            user_id: userId,
                            type: 'payment',
                            title: 'Coordonnées de paiement modifiées',
                            message: "Votre bailleur a modifié ses coordonnées de paiement. Vérifiez-les avant votre prochain loyer et, en cas de doute, contactez-le directement.",
                            link: '/tenant-dashboard'
                        });
                    } catch (notifError) {
                        console.error('Failed to notify tenant of payment methods change:', notifError);
                    }
                }
            }

            try {
                await logActivity(req, {
                    action: 'UPDATE',
                    entityType: 'profile',
                    entityId: ownerId,
                    entityLabel: 'Coordonnées de paiement du loyer modifiées',
                    metadata: { count: methods.length }
                });
            } catch (logErr) { /* silencieux */ }

            return response.success(res, saved, 'Coordonnées de paiement enregistrées');
        } catch (error) {
            next(error);
        }
    },

    // ---------- Locataire ----------

    /**
     * Coordonnées de paiement du bailleur pour un bail du locataire connecté.
     */
    async getLeasePaymentInfo(req, res, next) {
        try {
            const leases = await Tenant.findActiveLeasesByUserId(req.user.id);
            const lease = leases.find(l => l.id === req.params.leaseId);
            if (!lease) return response.error(res, 'Location introuvable.', 404);

            // Les coordonnées ne sont visibles que pendant un bail actif
            const { methods } = lease.status === 'active' && lease.owner_id
                ? await PaymentMethod.getMethods(lease.owner_id)
                : { methods: [] };

            return response.success(res, { methods });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = paymentMethodController;
