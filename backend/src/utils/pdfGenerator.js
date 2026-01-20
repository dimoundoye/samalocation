const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const path = require('path');

/**
 * Générer un PDF de reçu de paiement
 * @param {Object} receiptData - Données complètes du reçu
 * @returns {PDFDocument} - Document PDF
 */
function generateReceiptPDF(receiptData) {
    const doc = new PDFDocument({ margin: 50 });

    // Couleurs
    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const grayColor = '#6b7280';

    // Logo et En-tête
    const logoGap = 10;
    const logoSize = 60;

    try {
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        console.log('Loading logo from:', logoPath);
        doc.image(logoPath, 50, 40, { width: logoSize });
    } catch (error) {
        console.error('Logo loading error:', error);
    }

    doc
        .fontSize(24)
        .fillColor(primaryColor)
        .text('REÇU DE PAIEMENT', { align: 'right' })
        .moveDown(0.5);

    doc
        .fontSize(10)
        .fillColor(grayColor)
        .text(`N° ${receiptData.receipt_number}`, { align: 'center' })
        .text(`Émis le ${format(new Date(receiptData.created_at), 'dd MMMM yyyy', { locale: fr })}`, { align: 'center' })
        .moveDown(2);

    // Ligne séparatrice
    doc
        .strokeColor(primaryColor)
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1.5);

    // Section Propriétaire
    doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('PROPRIÉTAIRE', { underline: true })
        .moveDown(0.5);

    doc
        .fontSize(10)
        .fillColor(textColor)
        .text(`Nom : ${receiptData.owner_name || 'N/A'}`)
        .text(`Email : ${receiptData.owner_email || 'N/A'}`)
        .text(`Téléphone : ${receiptData.owner_phone || 'N/A'}`)
        .moveDown(1.5);

    // Section Locataire
    doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('LOCATAIRE', { underline: true })
        .moveDown(0.5);

    doc
        .fontSize(10)
        .fillColor(textColor)
        .text(`Nom : ${receiptData.tenant_name || 'N/A'}`)
        .text(`Email : ${receiptData.tenant_email || 'N/A'}`)
        .text(`Téléphone : ${receiptData.tenant_phone || 'N/A'}`)
        .moveDown(1.5);

    // Section Bien
    doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('BIEN LOUÉ', { underline: true })
        .moveDown(0.5);

    doc
        .fontSize(10)
        .fillColor(textColor)
        .text(`Propriété : ${receiptData.property_name || 'N/A'}`)
        .text(`Adresse : ${receiptData.property_address || 'N/A'}`)
        .text(`Unité : ${receiptData.unit_number || 'N/A'}`)
        .text(`Loyer mensuel : ${receiptData.tenant_rent ? Number(receiptData.tenant_rent).toLocaleString('fr-FR') : 'N/A'} FCFA`)
        .moveDown(1.5);

    // Ligne séparatrice
    doc
        .strokeColor(grayColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1.5);

    // Détails du paiement
    doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('DÉTAILS DU PAIEMENT', { underline: true })
        .moveDown(0.5);

    const monthName = format(new Date(receiptData.year, receiptData.month - 1), 'MMMM yyyy', { locale: fr });

    doc
        .fontSize(10)
        .fillColor(textColor)
        .text(`Période: ${monthName} `)
        .text(`Date de paiement: ${format(new Date(receiptData.payment_date), 'dd MMMM yyyy', { locale: fr })} `)
        .text(`Mode de paiement: ${receiptData.payment_method || 'Virement'} `)
        .moveDown(1);

    // Montant en grand
    doc
        .fontSize(16)
        .fillColor(primaryColor)
        .text(`MONTANT PAYÉ: ${Number(receiptData.amount).toLocaleString('fr-FR')} FCFA`, { align: 'center', bold: true })
        .moveDown(2);

    // Notes si présentes
    if (receiptData.notes) {
        doc
            .fontSize(10)
            .fillColor(grayColor)
            .text(`Notes: ${receiptData.notes} `)
            .moveDown(1);
    }

    // Ligne séparatrice
    doc
        .strokeColor(grayColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);

    // Footer / Mentions légales
    doc
        .fontSize(8)
        .fillColor(grayColor)
        .text(
            'Ce reçu atteste du paiement du loyer pour la période mentionnée ci-dessus. ' +
            'Document généré automatiquement par Samalocation.',
            { align: 'center' }
        );

    return doc;
}

module.exports = { generateReceiptPDF };
