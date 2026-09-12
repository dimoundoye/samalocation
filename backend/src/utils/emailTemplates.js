/**
 * Générateur de gabarits d'e-mails HTML modernes et responsives pour SamaLocation
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

/**
 * Layout HTML global commun pour tous les e-mails
 */
function buildEmailLayout({ title, preheader = '', contentHtml, actionButton = null, footerNote = '' }) {
    const primaryColor = '#2D3FE2';
    const accentColor = '#4F46E5';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        .wrapper { width: 100%; background-color: #f4f5f9; padding: 30px 10px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
        .header { background-color: #ffffff; padding: 28px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f0f2f5; }
        .logo { font-size: 28px; font-weight: 900; color: #2D3FE2; text-decoration: none; letter-spacing: -0.5px; display: inline-block; }
        .tagline { color: #6b7280; font-size: 13px; margin-top: 6px; font-weight: 500; }
        .body-content { padding: 32px 28px; }
        .btn-primary { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; text-align: center; box-shadow: 0 4px 12px rgba(45,63,226,0.25); }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .footer a { color: ${primaryColor}; text-decoration: underline; margin: 0 6px; }
        .highlight-box { background-color: #f0f3ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .warning-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #92400e; }
        .danger-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #991b1b; }
        .success-box { background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #065f46; }
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 10px 4px; }
            .body-content { padding: 24px 16px; }
        }
    </style>
</head>
<body>
    ${preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header" style="background-color: #ffffff; padding: 28px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f0f2f5;">
                <a href="${FRONTEND_URL}" class="logo" style="font-size: 28px; font-weight: 900; color: #2D3FE2; text-decoration: none; letter-spacing: -0.5px; display: inline-block;">Samalocation</a>
                <div class="tagline" style="color: #6b7280; font-size: 13px; margin-top: 6px; font-weight: 500;">La plateforme de référence pour l'immobilier au Sénégal</div>
            </div>

            <!-- Main Content -->
            <div class="body-content">
                ${contentHtml}

                ${actionButton ? `
                    <div style="text-align: center; margin: 30px 0 10px 0;">
                        <a href="${actionButton.url}" class="btn-primary">${actionButton.text}</a>
                    </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
                ${footerNote ? `<p style="margin-bottom: 12px; font-style: italic;">${footerNote}</p>` : ''}
                <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} SamaLocation. Tous droits réservés.</p>
                <p style="margin: 6px 0;">Dakar, Sénégal &bull; Plateforme sécurisée de gestion & location immobilière</p>
                <p style="margin-top: 10px;">
                    <a href="${FRONTEND_URL}/privacy">Politique de confidentialité</a> |
                    <a href="${FRONTEND_URL}/terms">Conditions d'utilisation</a> |
                    <a href="${FRONTEND_URL}/contact">Support & Contact</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * 1. Template : Annonce d'un nouveau bien immobilier disponible
 */
function getNewPropertyTemplate({ propertyTitle, propertyLocation, propertyPrice, propertyImage, propertyUrl, propertyType = 'Appartement', bedrooms = 0 }) {
    const formattedPrice = typeof propertyPrice === 'number' 
        ? new Intl.NumberFormat('fr-FR').format(propertyPrice) + ' FCFA / mois'
        : propertyPrice;

    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            ✨ Nouveau bien disponible sur SamaLocation !
        </h2>
        <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">
            Un nouveau logement vient d'être mis en location. Découvrez cette opportunité avant tout le monde :
        </p>

        <!-- Carte du Bien -->
        <div style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 24px;">
            ${propertyImage ? `
                <div style="width: 100%; height: 220px; background-image: url('${propertyImage}'); background-size: cover; background-position: center;"></div>
            ` : ''}
            <div style="padding: 20px;">
                <div style="display: inline-block; background: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
                    ${propertyType} ${bedrooms > 0 ? `&bull; ${bedrooms} chambre${bedrooms > 1 ? 's' : ''}` : ''}
                </div>
                <h3 style="margin: 6px 0 10px 0; color: #111827; font-size: 18px; font-weight: 700;">
                    ${propertyTitle}
                </h3>
                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 14px 0;">
                    📍 <strong>Localisation :</strong> ${propertyLocation || 'Dakar, Sénégal'}
                </p>
                <div style="font-size: 20px; font-weight: 800; color: #2D3FE2; margin-top: 8px;">
                    ${formattedPrice}
                </div>
            </div>
        </div>

        <p style="color: #4b5563; font-size: 14px; text-align: center;">
            Intéressé ? Contactez le bailleur ou planifiez une visite dès maintenant sur la plateforme.
        </p>
    `;

    return {
        subject: `✨ Nouveau bien disponible : ${propertyTitle} à ${propertyLocation || 'Dakar'}`,
        html: buildEmailLayout({
            title: `Nouveau bien : ${propertyTitle}`,
            preheader: `Découvrez ce nouveau bien disponible sur SamaLocation : ${propertyTitle} (${formattedPrice})`,
            contentHtml,
            actionButton: {
                text: 'Voir l\'annonce & Planifier une visite',
                url: propertyUrl || `${FRONTEND_URL}/search`
            }
        })
    };
}

/**
 * 2. Template : Programme de Parrainage Bailleurs (Jusqu'à 5 mois offerts)
 */
function getReferralProgramTemplate({ userName = 'Cher Propriétaire', referralCode = '', referralCount = 0 }) {
    const code = referralCode || 'VOTRE-CODE';
    const registerUrl = `${FRONTEND_URL}/auth?tab=register&ref=${encodeURIComponent(code)}`;
    const whatsappMsg = encodeURIComponent(`Bonjour ! Rejoins SamaLocation pour gérer tes locations ou trouver des locataires fiables. Avec mon code de parrainage ${code}, tu bénéficies d'un mois d'abonnement Premium offert dès ton inscription : ${registerUrl}`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMsg}`;

    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            🎁 Obtenez jusqu'à 5 mois d'abonnement Premium gratuits !
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour <strong>${userName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Saviez-vous que vous pouvez profiter gratuitement de la gestion de vos biens sur SamaLocation grâce à notre programme de parrainage exclusif aux bailleurs ?
        </p>

        <!-- Avantages Gagnant-Gagnant -->
        <div class="highlight-box">
            <h4 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 16px; font-weight: 700;">
                🤝 Une formule 100% Gagnant - Gagnant :
            </h4>
            <div style="margin-bottom: 10px; font-size: 14px; color: #1f2937;">
                ✅ <strong>Pour vous (Parrain) :</strong> <strong>1 mois d'abonnement offert</strong> pour chaque propriétaire parrainé qui s'inscrit (cumulable jusqu'à <strong>5 mois gratuits</strong>).
            </div>
            <div style="font-size: 14px; color: #1f2937;">
                ✅ <strong>Pour votre confrère (Filleul) :</strong> <strong>1 mois d'abonnement offert</strong> pour découvrir tous les outils de gestion en toute sérénité.
            </div>
        </div>

        <!-- Encadré Code de Parrainage -->
        <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 14px; padding: 22px; text-align: center; color: #ffffff; margin: 24px 0;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a5b4fc; font-weight: 600; margin-bottom: 6px;">
                Votre code de parrainage unique
            </div>
            <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #facc15; font-family: monospace; background: rgba(255,255,255,0.1); display: inline-block; padding: 6px 18px; border-radius: 8px; margin: 6px 0;">
                ${code}
            </div>
            <div style="font-size: 13px; color: #e0e7ff; margin-top: 10px;">
                Progression : <strong>${referralCount} / 5</strong> mois offerts déjà débloqués 🏆
            </div>
        </div>

        <!-- Bouton WhatsApp & Lien -->
        <div style="text-align: center; margin: 25px 0;">
            <a href="${whatsappUrl}" style="display: inline-block; background-color: #25D366; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 13px 26px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37,211,102,0.3); margin-bottom: 12px;">
                💬 Partager directement sur WhatsApp
            </a>
            <p style="font-size: 13px; color: #6b7280; margin-top: 8px;">
                Ou partagez votre lien : <br>
                <a href="${registerUrl}" style="color: #2D3FE2; word-break: break-all; font-weight: 600;">${registerUrl}</a>
            </p>
        </div>
    `;

    return {
        subject: `🎁 Spécial Propriétaire : Obtenez jusqu'à 5 mois d'abonnement offerts avec votre code ${code}`,
        html: buildEmailLayout({
            title: 'Programme de Parrainage Propriétaires',
            preheader: 'Faites grandir la communauté SamaLocation et recevez jusqu\'à 5 mois d\'abonnement gratuit !',
            contentHtml,
            actionButton: {
                text: 'Accéder à mon espace Propriétaire',
                url: `${FRONTEND_URL}/owner-dashboard`
            },
            footerNote: 'Cette offre est soumise aux conditions du programme de parrainage SamaLocation.'
        })
    };
}

/**
 * 3. Template : Mise à jour des CGU & Politique de Confidentialité
 */
function getTermsUpdateTemplate({ effectiveDate = 'immédiatement', summaryText = '' }) {
    const defaultSummary = summaryText || `
        <ul style="padding-left: 20px; margin: 12px 0; color: #374151; font-size: 14px;">
            <li style="margin-bottom: 6px;">Renforcement de la sécurité des données et de la protection des pièces d'identité.</li>
            <li style="margin-bottom: 6px;">Précisions sur la génération et la signature électronique des contrats de location.</li>
            <li style="margin-bottom: 6px;">Clarification des règles anti-fraude et de modération des annonces.</li>
        </ul>
    `;

    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            📜 Mise à jour de nos Conditions d'Utilisation et Politique de Confidentialité
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Dans le cadre de notre engagement continu à vous offrir un service transparent, sécurisé et conforme à la réglementation, nous avons procédé à une mise à jour de nos <strong>Conditions Générales d'Utilisation (CGU)</strong> ainsi que de notre <strong>Politique de Confidentialité</strong>.
        </p>

        <div class="highlight-box">
            <h4 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 15px; font-weight: 700;">
                📅 Date d'entrée en vigueur : ${effectiveDate}
            </h4>
            <p style="font-size: 14px; margin: 0 0 8px 0; color: #374151;">
                Voici un aperçu des principaux points actualisés :
            </p>
            ${defaultSummary}
        </div>

        <p style="color: #4b5563; font-size: 14px;">
            En continuant à utiliser la plateforme SamaLocation, vous acceptez ces nouvelles dispositions. Si vous avez la moindre question concernant ces changements, notre équipe se tient à votre entière disposition.
        </p>
    `;

    return {
        subject: `📜 Information importante : Mise à jour des Conditions d'Utilisation - SamaLocation`,
        html: buildEmailLayout({
            title: 'Mise à jour des Conditions d\'Utilisation',
            preheader: 'Nous avons mis à jour nos Conditions d\'Utilisation et Politique de Confidentialité.',
            contentHtml,
            actionButton: {
                text: 'Consulter les nouvelles conditions',
                url: `${FRONTEND_URL}/terms`
            }
        })
    };
}

/**
 * 4. Template : Conseils de Sécurité & Sensibilisation Anti-Arnaque
 */
function getSecurityTipsTemplate() {
    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            🛡️ Conseils de Sécurité : Réussir votre location en toute sérénité
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Chez SamaLocation, votre sécurité est notre priorité absolue. Pour vous prémunir contre les mauvaises surprises et les tentatives de fraude, nous vous rappelons nos règles d'or indispensables :
        </p>

        <div style="space-y: 16px; margin: 24px 0;">
            <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px;">
                <div style="background: #fee2e2; color: #dc2626; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;">1</div>
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 15px; font-weight: 700;">Ne versez JAMAIS d'argent avant la visite</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Ne payez aucun acompte, avance ou frais de dossier pour « réserver » un bien sans avoir visité le logement physique et rencontré le bailleur.</p>
                </div>
            </div>

            <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px;">
                <div style="background: #e0e7ff; color: #4338ca; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;">2</div>
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 15px; font-weight: 700;">Vérifiez le badge "Propriétaire Vérifié"</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Les propriétaires vérifiés par SamaLocation ont fourni une pièce d'identité officielle validée par notre équipe de conformité.</p>
                </div>
            </div>

            <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px;">
                <div style="background: #dcfce7; color: #15803d; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;">3</div>
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 15px; font-weight: 700;">Utilisez le contrat officiel avec QR Code</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Les contrats générés sur SamaLocation contiennent un QR code d'authenticité et un numéro de série infalsifiable vérifiable en ligne.</p>
                </div>
            </div>

            <div style="display: flex; gap: 14px; align-items: flex-start;">
                <div style="background: #fef3c7; color: #b45309; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;">4</div>
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 15px; font-weight: 700;">Signalez toute annonce suspecte</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Un prix trop bas pour le quartier ? Une demande de virement urgent ? Utilisez le bouton « Signaler » présent sur chaque annonce.</p>
                </div>
            </div>
        </div>
    `;

    return {
        subject: `🛡️ Rappel Sécurité : Les 4 règles d'or pour louer sans risque sur SamaLocation`,
        html: buildEmailLayout({
            title: 'Conseils de Sécurité SamaLocation',
            preheader: 'Ne versez jamais d\'argent avant visite : découvrez nos 4 règles de sécurité.',
            contentHtml,
            actionButton: {
                text: 'Explorer les biens sécurisés',
                url: `${FRONTEND_URL}/search`
            }
        })
    };
}

/**
 * 5. Template : Avis officiel de Suspension / Blocage de Compte
 */
function getAccountSuspendedTemplate({ userName = 'Utilisateur', reason = 'Non-respect des Conditions Générales d\'Utilisation', date = '' }) {
    const suspensionDate = date || new Date().toLocaleDateString('fr-FR');

    const contentHtml = `
        <h2 style="color: #991b1b; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            ⛔ Notification officielle de suspension de compte
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour <strong>${userName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Nous vous informons que votre compte SamaLocation a fait l'objet d'une suspension à compter du <strong>${suspensionDate}</strong>.
        </p>

        <div class="danger-box" style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #991b1b;">
            <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">Motif de la sanction :</h4>
            <p style="margin: 0; font-size: 14px; font-weight: 600;">${reason}</p>
        </div>

        <h4 style="color: #111827; font-size: 15px; margin-top: 20px; margin-bottom: 8px;">Conséquences directes de la suspension :</h4>
        <ul style="padding-left: 20px; margin: 0 0 20px 0; color: #4b5563; font-size: 14px;">
            <li style="margin-bottom: 6px;">Vos annonces immobilières publiées ont été retirées de la plateforme.</li>
            <li style="margin-bottom: 6px;">L'accès à vos fonctionnalités et à votre tableau de bord est temporairement désactivé.</li>
            <li style="margin-bottom: 6px;">Toute tentative de création d'un nouveau compte sans accord préalable pourra être bloquée.</li>
        </ul>

        <p style="color: #4b5563; font-size: 14px;">
            Si vous estimez qu'il s'agit d'une erreur ou si vous souhaitez fournir des justificatifs pour réexaminer votre dossier, vous pouvez contacter notre service de modération en répondant à cet e-mail ou via notre page de support.
        </p>
    `;

    return {
        subject: `[IMPORTANT] Notification de suspension de votre compte SamaLocation`,
        html: buildEmailLayout({
            title: 'Suspension de compte - SamaLocation',
            preheader: 'Notification officielle concernant la suspension de votre compte SamaLocation.',
            contentHtml,
            actionButton: {
                text: 'Contacter le support / Faire un recours',
                url: `${FRONTEND_URL}/contact`
            },
            footerNote: 'Cette notification constitue une mesure de protection de la communauté SamaLocation.'
        })
    };
}

/**
 * 6. Template : Avertissement suite à un Signalement
 */
function getReportWarningTemplate({ userName = 'Utilisateur', reason = 'Comportement suspect ou annonce non conforme' }) {
    const contentHtml = `
        <h2 style="color: #92400e; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;">
            ⚠️ Avertissement concernant votre activité sur SamaLocation
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour <strong>${userName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Notre équipe de modération a reçu et analysé un signalement concernant votre profil ou l'une de vos annonces sur SamaLocation.
        </p>

        <div class="warning-box" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 18px 20px; margin: 20px 0; color: #92400e;">
            <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">Objet du signalement :</h4>
            <p style="margin: 0; font-size: 14px;">${reason}</p>
        </div>

        <p style="color: #4b5563; font-size: 15px;">
            Nous vous rappelons que tous les membres de la communauté SamaLocation s'engagent à respecter nos règles de transparence, d'exactitude des informations et de respect mutuel.
        </p>

        <div class="highlight-box">
            <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
                ⚠️ <strong>Important :</strong> Cet e-mail constitue un premier avertissement. Tout nouveau manquement constaté ou récidive pourra entraîner la suspension immédiate et définitive de votre compte sans préavis.
            </p>
        </div>

        <p style="color: #4b5563; font-size: 14px;">
            Merci de procéder aux ajustements nécessaires dans les plus brefs délais. Si vous souhaitez apporter des éclaircissements, vous pouvez répondre à ce message.
        </p>
    `;

    return {
        subject: `⚠️ Avertissement officiel : Signalement sur votre compte SamaLocation`,
        html: buildEmailLayout({
            title: 'Avertissement de modération',
            preheader: 'Un signalement concernant votre compte nécessite votre attention.',
            contentHtml,
            actionButton: {
                text: 'Accéder à mon compte',
                url: `${FRONTEND_URL}/auth`
            }
        })
    };
}

/**
 * 7. Template : Message Libre / Annonce Générale
 */
function getCustomTemplate({ title = 'Information de l\'équipe SamaLocation', message = '', buttonText = '', buttonUrl = '' }) {
    const formattedMessage = message ? message.replace(/\n/g, '<br>') : '';

    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px;">
            ${title}
        </h2>
        <div style="color: #374151; font-size: 15px; line-height: 1.7;">
            ${formattedMessage}
        </div>
    `;

    return {
        subject: title,
        html: buildEmailLayout({
            title,
            preheader: title,
            contentHtml,
            actionButton: (buttonText && buttonUrl) ? { text: buttonText, url: buttonUrl } : null
        })
    };
}

/**
 * 8. Template : Réponse au Support Client
 */
function getSupportReplyTemplate({ userName = 'Client', originalSubject = '', originalMessage = '', replyContent = '' }) {
    const formattedReply = replyContent.replace(/\n/g, '<br>');
    const formattedOriginal = originalMessage.replace(/\n/g, '<br>');

    const contentHtml = `
        <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">
            💬 Réponse du Support SamaLocation
        </h2>
        <p style="color: #4b5563; font-size: 15px;">
            Bonjour <strong>${userName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px;">
            Nous vous remercions d'avoir contacté le service client de SamaLocation concernant : <strong>« ${originalSubject} »</strong>.
        </p>

        <!-- Réponse de l'admin -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; color: #1e293b; font-size: 15px; line-height: 1.7;">
            ${formattedReply}
        </div>

        <p style="color: #4b5563; font-size: 14px; margin-bottom: 24px;">
            Si vous avez des questions complémentaires, n'hésitez pas à répondre directement à cet e-mail.
        </p>

        <!-- Rappel du message original -->
        <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 14px; margin-top: 24px; color: #6b7280; font-size: 13px;">
            <div style="font-weight: 700; margin-bottom: 4px; color: #4b5563;">Rappel de votre message :</div>
            <div style="font-style: italic;">« ${formattedOriginal} »</div>
        </div>
    `;

    return {
        subject: `Re: ${originalSubject} - Support SamaLocation`,
        html: buildEmailLayout({
            title: `Re: ${originalSubject}`,
            preheader: `Réponse de l'équipe SamaLocation à votre message du support client.`,
            contentHtml,
            actionButton: {
                text: 'Visiter SamaLocation',
                url: FRONTEND_URL
            },
            footerNote: 'L\'équipe Support SamaLocation est à votre disposition 7j/7.'
        })
    };
}

module.exports = {
    buildEmailLayout,
    getNewPropertyTemplate,
    getReferralProgramTemplate,
    getTermsUpdateTemplate,
    getSecurityTipsTemplate,
    getAccountSuspendedTemplate,
    getReportWarningTemplate,
    getCustomTemplate,
    getSupportReplyTemplate
};
