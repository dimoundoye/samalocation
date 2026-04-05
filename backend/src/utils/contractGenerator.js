const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const nodeFetch = require('node-fetch');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Génère le PDF du contrat de location optimisé juridiquement
 */
async function generateContractPDF(contractData) {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
    });

    const isPremium = contractData.contract_type === 'premium';
    console.log(`Generating PDF for contract: ${contractData.contract_number}, Type: ${contractData.contract_type}, ID: ${contractData.id || contractData.contract_id}`);
    const accentColor = '#0f172a';
    const textColor = '#334155';
    const secondaryColor = '#64748b';
    const lineHighlight = '#f1f5f9';

    // Helper: format currency properly
    const formatFCFA = (amount) => {
        if (!amount) return '0 FCFA';
        return `${Number(amount).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA`;
    };

    // Helper: Section titles
    const sectionTitle = (title) => {
        doc.moveDown();
        doc.fontSize(12).fillColor(accentColor).font('Helvetica-Bold').text(title.toUpperCase());
        doc.rect(50, doc.y, 512, 0.5).fill('#cbd5e1');
        doc.moveDown(0.5).font('Helvetica').fillColor(textColor).fontSize(10);
    };

    // -- HEADER --
    doc.fontSize(18).fillColor(accentColor).font('Helvetica-Bold').text('CONTRAT DE BAIL À USAGE D\'HABITATION', { align: 'center' });
    doc.fontSize(8).fillColor(secondaryColor).font('Helvetica').text(isPremium ? 'VERSION PREMIUM' : 'VERSION STANDARD', { align: 'center' });
    doc.moveDown();

    doc.fontSize(9).fillColor(textColor).text(`Contrat n° : ${contractData.contract_number}`, { align: 'right' });
    doc.fontSize(7).fillColor(secondaryColor).text(`ID: ${contractData.id || contractData.contract_id || ''}`, { align: 'right' });
    doc.fontSize(9).fillColor(textColor).text(`Établi à Dakar, le ${format(new Date(contractData.created_at || new Date()), 'dd MMMM yyyy', { locale: fr })}`, { align: 'right' });
    doc.moveDown(1.5);

    // -- 1. DÉSIGNATION DES PARTIES --
    sectionTitle('1. DÉSIGNATION DES PARTIES');

    const startYParties = doc.y;

    // BAILLEUR
    doc.font('Helvetica-Bold').text('LE BAILLEUR (Propriétaire) :', 50, startYParties);
    doc.font('Helvetica').fontSize(9)
        .text(`M./Mme : ${contractData.owner_name}`, 50, startYParties + 15)
        .text(`Identité : ${contractData.owner_id_type || 'CNI'} n° ${contractData.owner_id_number || '_______'} délivrée le ${contractData.owner_id_date ? format(new Date(contractData.owner_id_date), 'dd/MM/yyyy') : '_______'}`)
        .text(`Né(e) le : ${contractData.owner_dob ? format(new Date(contractData.owner_dob), 'dd/MM/yyyy') : '_______'} à ${contractData.owner_birthplace || '_______'}`)
        .text(`Adresse : ${contractData.owner_address || contractData.owner_address_detailed || 'Dakar, Sénégal'}`)
        .text(`Contact : ${contractData.owner_phone || 'N/A'} / ${contractData.owner_email || 'N/A'}`);

    // LOCATAIRE
    doc.font('Helvetica-Bold').fontSize(10).text('LE LOCATAIRE :', 300, startYParties);
    doc.font('Helvetica').fontSize(9)
        .text(`M./Mme : ${contractData.tenant_name}`, 300, startYParties + 15)
        .text(`Identité : ${contractData.tenant_id_type || 'CNI'} n° ${contractData.tenant_id_number || '_______'} délivrée le ${contractData.tenant_id_date ? format(new Date(contractData.tenant_id_date), 'dd/MM/yyyy') : '_______'}`)
        .text(`Né(e) le : ${contractData.tenant_dob ? format(new Date(contractData.tenant_dob), 'dd/MM/yyyy') : '_______'} à ${contractData.tenant_birthplace || '_______'}`)
        .text(`Contact : ${contractData.tenant_phone} / ${contractData.tenant_email}`);

    doc.moveDown(4);

    // -- 2. OBJET ET DESIGNATION --
    sectionTitle('2. OBJET ET DÉSIGNATION DES LIEUX');
    doc.text(`Le Bailleur donne en location au Locataire, qui accepte, les locaux désignés ci-après :`);
    doc.moveDown(0.5);
    doc.rect(50, doc.y, 512, 40).fill(lineHighlight);
    doc.fillColor(textColor).fontSize(9)
        .text(`Adresse : ${contractData.detailed_address || contractData.property_address || 'Non spécifiée'}`, 60, doc.y + 5)
        .text(`Désignation : ${contractData.property_name} - ${contractData.unit_number || 'Logement entier'}`)
        .text(`Usage : EXCLUSIVEMENT À USAGE D'HABITATION.`, { bold: true });

    doc.moveDown(2);

    // -- 3. DURÉE DU CONTRAT --
    sectionTitle('3. DURÉE ET RELOCALISATION');
    doc.text(`Le présent contrat est conclu pour une durée ferme de ${contractData.duration_months} mois, commençant le ${format(new Date(contractData.start_date), 'dd MMMM yyyy', { locale: fr })}.`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('CLAUSE DE DÉPART :', { underline: true });
    doc.font('Helvetica').text(`Le LOCATAIRE pourra résilier son bail à tout moment, sous réserve de respecter un préavis d'un mois notifié par courrier accusé de réception ou par voie électronique certifiée sur la plateforme. Ce préavis s’applique également au LOCATAIRE souhaitant partir au terme de la DUREE DE LOCATION, afin d’éviter toute reconduction tacite.`);

    // -- 4. CONDITIONS FINANCIÈRES --
    sectionTitle('4. CONDITIONS FINANCIÈRES');
    doc.text(`Loyer mensuel : ${formatFCFA(contractData.rent_amount)}`);
    doc.text(`Dépôt de garantie : ${formatFCFA(contractData.deposit_amount)} (restitué en fin de bail sous réserve de l'état des lieux).`);
    doc.text(`Date de paiement : Au plus tard le ${contractData.payment_day} de chaque mois.`);
    doc.text(`Mode de paiement : ${contractData.payment_method || 'Virement / Mobile Money'}.`);

    if (isPremium && contractData.charges_info) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Charges :');
        doc.font('Helvetica').text(`Les charges suivantes sont à la charge exclusive du locataire : ${contractData.charges_info.description || 'Eau, Électricité, Internet'}.`);
    }

    // -- 5. ÉTAT DES LIEUX ET ENTRETIEN (TOUS CONTRATS) --
    sectionTitle('5. ÉTAT DES LIEUX ET ENTRETIEN');
    doc.text(`Un état des lieux d’entrée contradictoire sera établi et signé par les parties. Un état des lieux de sortie sera effectué à la fin du bail.`);
    doc.text(`Le locataire devra tenir les lieux en état de propreté et ne pourra faire aucune transformation sans l’autorisation préalable écrite du bailleur.`);
    doc.text(`Le nombre de personnes pouvant occuper le bien est strictement limité à ${contractData.occupancy_limit} individus.`);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Interdiction de sous-location :');
    doc.font('Helvetica').text(`Le locataire ne peut sous-louer le logement, en totalité ou en partie, sans autorisation écrite du bailleur.`);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Nuisances :');
    doc.font('Helvetica').text(`La sonorité abusive et le tapage nocturne sont interdits et ne seront tolérés qu'en cas de fêtes occasionnelles.`);

    // -- 6. CLAUSES RÉSOLUTOIRES --
    sectionTitle('6. CLAUSES RÉSOLUTOIRES');
    doc.text(`Le présent contrat sera résilié immédiatement et de plein droit, sans qu’il soit besoin de faire ordonner cette résiliation en justice, dans les cas suivants :`, { align: 'justify' });
    doc.moveDown(0.5);
    doc.text(`— Deux mois après un commandement demeuré infructueux à défaut de paiement aux termes convenus de tout ou partie du loyer et des charges ou en cas de non-versement du dépôt de garantie éventuellement prévu au contrat ;`, { indent: 20, align: 'justify' });
    doc.text(`— Un mois après un commandement demeuré infructueux à défaut d’abonnement aux services publics (eau, électricité). Une fois acquis au bailleur le bénéfice de la clause résolutoire, le locataire devra libérer immédiatement les lieux. Les frais, droits et honoraires des actes de procédure seront à la charge du LOCATAIRE. Il est précisé que le locataire sera tenu de toutes les obligations découlant du présent bail jusqu’à la libération effective des lieux sans préjudice, nonobstant l’expulsion.`, { indent: 20, align: 'justify' });
    doc.text(`— Dès lors qu’une décision de justice sera passée en force de chose jugée qui constatera les troubles de voisinage et constituera le non-respect d’user paisiblement des locaux loués. En cas de congé ou de résiliation si le locataire se maintient après l’expiration du bail, il sera redevable d’une indemnité d’occupation au moins égale au montant du dernier loyer, charges, taxes et accessoires réclamés.`, { indent: 20, align: 'justify' });


    // -- INVENTORY (IF PRESENT) --
    if (contractData.inventory && Object.keys(contractData.inventory).length > 0) {
        sectionTitle('ANNEXE : LISTE DES ÉQUIPEMENTS');
        Object.entries(contractData.inventory).forEach(([item, status]) => {
            doc.text(`- ${item} : ${status === 'ok' ? '[OK]' : '[DÉGRADÉ]'}`);
        });
    }

    // -- NOTES & ADDITIONAL CLAUSES --
    if (contractData.notes) {
        sectionTitle('NOTES & CLAUSES SPÉCIFIQUES');
        doc.fontSize(9).text(contractData.notes, { align: 'justify' });
    }

    doc.addPage();

    // -- SIGNATURES --
    sectionTitle('SIGNATURES');
    const signatureY = doc.y + 20;

    // BOXES FOR SIGNATURES
    doc.rect(50, signatureY, 240, 100).stroke('#e2e8f0');
    doc.rect(292, signatureY, 240, 100).stroke('#e2e8f0');

    doc.fontSize(10).font('Helvetica-Bold')
        .text('LE BAILLEUR', 50, signatureY - 15)
        .text('LE LOCATAIRE', 292, signatureY - 15);

    // Owner Signature
    if (contractData.owner_signature && contractData.owner_signature.startsWith('http')) {
        try {
            const response = await nodeFetch(contractData.owner_signature);
            if (response.ok) {
                const buffer = await response.buffer();
                doc.image(buffer, 60, signatureY + 20, { width: 100 });
            } else {
                doc.fontSize(7).font('Helvetica-Oblique').text('Signature archivée numériquement', 60, signatureY + 30);
            }
        } catch (e) {
            console.error('Signature fetch error:', e);
            doc.fontSize(7).font('Helvetica-Oblique').text('Signature archivée numériquement', 60, signatureY + 30);
        }
    } else if (contractData.owner_signature) {
        doc.fontSize(7).font('Helvetica-Oblique').text('Signature archivée sur serveur', 60, signatureY + 30);
    }

    // Tenant Signature
    if (contractData.tenant_signed) {
        doc.fontSize(8).fillColor('#059669').font('Helvetica-Bold').text('SIGNÉ ÉLECTRONIQUEMENT', 302, signatureY + 20);
        const signedAt = contractData.tenant_signed_at ? new Date(contractData.tenant_signed_at) : new Date();
        const safeId = (contractData.id || contractData.contract_number || 'CONTRAT').toString();

        doc.fillColor(textColor).font('Helvetica').fontSize(7)
            .text(`Date : ${format(signedAt, 'dd/MM/yyyy HH:mm', { locale: fr })}`)
            .text(`IP : Trace protégée`)
            .text(`ID : ${safeId.substring(0, 13).toUpperCase()}`);

        doc.moveDown();
        doc.fontSize(6).font('Helvetica-Oblique').text('Signature électronique simple conformément aux dispositions relatives aux transactions électroniques en vigueur au Sénégal.', { width: 220 });
    } else {
        doc.fontSize(8).fillColor(secondaryColor).text('(En attente de signature du locataire)', 302, signatureY + 40);
    }

    // -- QR CODE & HASH --
    doc.moveDown(8);

    // Document Hash
    const rawData = `${contractData.contract_number || ''}${contractData.contract_id || contractData.id || ''}`;
    const docHash = crypto.createHash('sha256').update(rawData).digest('hex');
    doc.fontSize(7).fillColor(secondaryColor).text(`Hash de sécurité : ${docHash}`, { align: 'center' });

    // QR Code
    try {
        const qrId = contractData.contract_id || contractData.id;
        if (qrId) {
            let baseUrl = process.env.FRONTEND_URL || 'https://samalocation.com';
            // Nettoyer l'URL : enlever le slash final s'il existe
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }
            const qrContent = `${baseUrl}/verify/contract/${qrId}`;
            const qrBuffer = await QRCode.toBuffer(qrContent);
            doc.image(qrBuffer, 247, doc.y + 10, { width: 100 });
            doc.fontSize(6).text('Scanner pour vérifier l\'authenticité', 247, doc.y + 115, { width: 100, align: 'center' });
        }
    } catch (err) {
        console.error('QR rendering error', err);
    }

    doc.moveDown(4);

    // -- FOOTER & DISCLAIMER --
    doc.fontSize(7).fillColor(secondaryColor).font('Helvetica-Oblique').text('AVIS DE NON-RESPONSABILITÉ : Ce document est un modèle généré automatiquement par Samalocation. Il a un caractère purement indicatif. Les parties sont seules responsables du contenu et de la légalité des clauses insérées. Il est recommandé de faire enregistrer tout contrat de bail auprès des services fiscaux (DGID) compétents.', 50, doc.y + 20, { align: 'justify', width: 512 });

    doc.moveDown();
    doc.fontSize(8).fillColor(secondaryColor).font('Helvetica').text(`Document généré par la plateforme Samalocation. Version ${isPremium ? 'Premium' : 'Standard'} 2.1`, { align: 'center' });
    doc.text('© Samalocation - Tous droits réservés', { align: 'center' });

    return doc;
}

module.exports = { generateContractPDF };
