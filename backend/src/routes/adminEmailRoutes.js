const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const response = require('../utils/response');
const { sendEmail } = require('../utils/emailService');
const emailTemplates = require('../utils/emailTemplates');
const { v4: uuidv4 } = require('uuid');

// Toutes les routes nécessitent l'authentification ET le rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/emails/properties
 * Récupère les biens récents pour sélection dans le template "Nouveau bien"
 */
router.get('/properties', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT p.id, p.name as title, p.address, p.property_type, p.photos, p.photo_url,
                   COALESCE(pu.monthly_rent, 0) as price,
                   COALESCE(pu.bedrooms, 0) as bedrooms
            FROM properties p
            LEFT JOIN LATERAL (
                SELECT monthly_rent, bedrooms 
                FROM property_units 
                WHERE property_id = p.id 
                ORDER BY monthly_rent ASC LIMIT 1
            ) pu ON true
            WHERE p.is_published = true
            ORDER BY p.published_at DESC NULLS LAST
            LIMIT 25
        `);

        const formatted = rows.map(r => ({
            id: r.id,
            title: r.title || 'Propriété',
            address: r.address || '',
            city: 'Dakar',
            property_type: r.property_type || 'Appartement',
            price: Number(r.price) || 0,
            bedrooms: Number(r.bedrooms) || 0,
            images: Array.isArray(r.photos) && r.photos.length > 0 
                ? r.photos 
                : (r.photo_url ? [r.photo_url] : [])
        }));

        return response.success(res, formatted);
    } catch (error) {
        console.error('Error fetching properties for email:', error);
        return response.error(res, error.message, 500);
    }
});

/**
 * POST /api/admin/emails/preview
 * Génère le sujet et le HTML d'un template pour aperçu en direct
 */
router.post('/preview', async (req, res) => {
    try {
        const { templateId, templateData = {} } = req.body;

        const generated = generateEmailContent(templateId, templateData, {
            name: 'Moussa Diop',
            custom_id: 'PROP-2024-88',
            referral_count: 2
        });

        return response.success(res, generated);
    } catch (error) {
        console.error('Error generating preview:', error);
        return response.error(res, error.message, 500);
    }
});

/**
 * Helper : Génère le sujet et le contenu HTML selon le template
 */
function generateEmailContent(templateId, data = {}, user = {}) {
    const userName = user.name || user.full_name || data.userName || 'Membre SamaLocation';
    const referralCode = user.custom_id || data.referralCode || 'SL-PRO';
    const referralCount = user.referral_count || data.referralCount || 0;

    switch (templateId) {
        case 'new_property':
            return emailTemplates.getNewPropertyTemplate({
                propertyTitle: data.propertyTitle || 'Magnifique appartement F3',
                propertyLocation: data.propertyLocation || 'Almadies, Dakar',
                propertyPrice: data.propertyPrice ? Number(data.propertyPrice) : 350000,
                propertyImage: data.propertyImage || '',
                propertyUrl: data.propertyUrl || `${process.env.FRONTEND_URL || 'http://localhost:8080'}/search`,
                propertyType: data.propertyType || 'Appartement',
                bedrooms: data.bedrooms ? Number(data.bedrooms) : 2
            });

        case 'referral_program':
            return emailTemplates.getReferralProgramTemplate({
                userName,
                referralCode,
                referralCount
            });

        case 'terms_update':
            return emailTemplates.getTermsUpdateTemplate({
                effectiveDate: data.effectiveDate || '1er octobre 2024',
                summaryText: data.summaryText
            });

        case 'security_tips':
            return emailTemplates.getSecurityTipsTemplate();

        case 'account_suspended':
            return emailTemplates.getAccountSuspendedTemplate({
                userName,
                reason: data.reason || 'Non-respect répété des conditions d\'utilisation',
                date: data.date || new Date().toLocaleDateString('fr-FR')
            });

        case 'user_reported_warning':
            return emailTemplates.getReportWarningTemplate({
                userName,
                reason: data.reason || 'Comportement suspect ou annonce non conforme'
            });

        case 'custom':
        default:
            return emailTemplates.getCustomTemplate({
                title: data.title || 'Information SamaLocation',
                message: data.message || '',
                buttonText: data.buttonText,
                buttonUrl: data.buttonUrl
            });
    }
}

/**
 * POST /api/admin/emails/send
 * Envoie un email à une cible (all, tenants, owners, custom)
 */
router.post('/send', async (req, res) => {
    try {
        const {
            templateId,
            targetAudience = 'custom',
            customRecipientEmail,
            customRecipientName,
            customSubject,
            templateData = {}
        } = req.body;

        if (!templateId) {
            return response.error(res, 'Le type de modèle (templateId) est requis.', 400);
        }

        let recipients = [];

        if (targetAudience === 'custom') {
            if (!customRecipientEmail) {
                return response.error(res, 'L\'adresse e-mail destinataire est requise.', 400);
            }
            recipients = [{
                email: customRecipientEmail.trim(),
                name: customRecipientName || 'Utilisateur',
                custom_id: 'SL-USER',
                referral_count: 0
            }];
        } else {
            // Requête ciblée selon l'audience
            let query = `
                SELECT u.id, u.email, u.custom_id, u.referral_count, up.full_name as name, up.role
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.id
                WHERE u.email IS NOT NULL AND u.email != ''
            `;

            const params = [];
            if (targetAudience === 'tenants') {
                query += ` AND up.role = 'tenant'`;
            } else if (targetAudience === 'owners') {
                query += ` AND up.role = 'owner'`;
            }

            const { rows } = await db.query(query, params);
            recipients = rows;
        }

        if (recipients.length === 0) {
            return response.error(res, 'Aucun destinataire trouvé pour cette audience.', 400);
        }

        console.log(`[AdminEmail] Début d'envoi campagne ${templateId} à ${recipients.length} destinataire(s) (Cible: ${targetAudience})...`);

        let sentSuccessCount = 0;
        let sentErrorCount = 0;
        let lastSubject = customSubject || '';

        // Envoi par lots (batches) de 5 avec temporisation douce
        const batchSize = 5;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            await Promise.all(batch.map(async (user) => {
                try {
                    const content = generateEmailContent(templateId, templateData, user);
                    const subjectToSend = customSubject || content.subject;
                    lastSubject = subjectToSend;

                    const ok = await sendEmail(user.email, subjectToSend, content.html);
                    if (ok) {
                        sentSuccessCount++;
                    } else {
                        sentErrorCount++;
                    }
                } catch (err) {
                    console.error(`[AdminEmail] Erreur pour ${user.email}:`, err.message);
                    sentErrorCount++;
                }
            }));

            // Pause de 200ms entre les lots si ce n'est pas le dernier
            if (i + batchSize < recipients.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        // Journalisation dans la table email_campaign_logs
        try {
            const logId = uuidv4();
            await db.query(`
                INSERT INTO email_campaign_logs (id, template_id, subject, target_audience, recipient_count, recipient_emails, sent_by, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                logId,
                templateId,
                lastSubject,
                targetAudience,
                sentSuccessCount,
                targetAudience === 'custom' ? customRecipientEmail : `${sentSuccessCount} destinataires (${targetAudience})`,
                req.user?.id || null,
                sentErrorCount > 0 ? (sentSuccessCount > 0 ? 'partial' : 'failed') : 'sent'
            ]);
        } catch (logErr) {
            console.error('[AdminEmail] Erreur log DB:', logErr.message);
        }

        console.log(`[AdminEmail] Fin de campagne : ${sentSuccessCount} envoyé(s), ${sentErrorCount} échec(s).`);

        return response.success(res, {
            total: recipients.length,
            sent: sentSuccessCount,
            failed: sentErrorCount,
            targetAudience
        }, `${sentSuccessCount} e-mail(s) envoyé(s) avec succès.`);

    } catch (error) {
        console.error('Error in sendAdminEmail:', error);
        return response.error(res, error.message, 500);
    }
});

/**
 * GET /api/admin/emails/logs
 * Récupère l'historique des campagnes d'e-mails
 */
router.get('/logs', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT * FROM email_campaign_logs
            ORDER BY created_at DESC
            LIMIT 50
        `);

        return response.success(res, rows);
    } catch (error) {
        console.error('Error fetching email logs:', error);
        return response.error(res, error.message, 500);
    }
});

module.exports = router;
