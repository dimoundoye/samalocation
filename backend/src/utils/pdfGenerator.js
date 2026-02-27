const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const path = require('path');
const fetch = require('node-fetch');

/**
 * Générer un PDF de reçu de paiement
 * @param {Object} receiptData - Données complètes du reçu
 * @returns {Promise<PDFDocument>} - Document PDF (Promise)
 */
/**
 * Générer un PDF de reçu de paiement
 * @param {Object} receiptData - Données complètes du reçu
 * @returns {Promise<PDFDocument>} - Document PDF (Promise)
 */
async function generateReceiptPDF(receiptData) {
    const template = receiptData.receipt_template || 'classic';
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    if (template === 'modern') {
        await drawModernTemplate(doc, receiptData);
    } else if (template === 'minimal') {
        await drawMinimalTemplate(doc, receiptData);
    } else {
        await drawClassicTemplate(doc, receiptData);
    }

    return doc;
}

/**
 * Template Classique (Original)
 */
async function drawClassicTemplate(doc, receiptData) {
    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const grayColor = '#6b7280';

    // Logo
    try {
        const logoPath = path.join(__dirname, '../../assets/favicon01.png');
        doc.image(logoPath, 50, 40, { width: 60 });
    } catch (e) { }

    doc.fontSize(24).fillColor(primaryColor).text('REÇU DE PAIEMENT', { align: 'right' }).moveDown(0.5);
    doc.fontSize(10).fillColor(grayColor)
        .text(`N° ${receiptData.receipt_number}`, { align: 'center' })
        .text(`Émis le ${format(new Date(receiptData.created_at), 'dd MMMM yyyy', { locale: fr })}`, { align: 'center' })
        .moveDown(2);

    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

    // Propriétaire & Locataire side by side
    const startY = doc.y;
    doc.fontSize(12).fillColor(primaryColor).text('PROPRIÉTAIRE', 50, startY, { underline: true });
    doc.fontSize(10).fillColor(textColor)
        .text(`Nom : ${receiptData.owner_name || 'N/A'}`, 50, startY + 20)
        .text(`Email : ${receiptData.owner_email || 'N/A'}`)
        .text(`Téléphone : ${receiptData.owner_phone || 'N/A'}`);

    doc.fontSize(12).fillColor(primaryColor).text('LOCATAIRE', 320, startY, { underline: true });
    doc.fontSize(10).fillColor(textColor)
        .text(`Nom : ${receiptData.tenant_name || 'N/A'}`, 320, startY + 20)
        .text(`Email : ${receiptData.tenant_email || 'N/A'}`)
        .text(`Téléphone : ${receiptData.tenant_phone || 'N/A'}`);

    doc.moveDown(4);

    // Section Bien
    doc.fontSize(12).fillColor(primaryColor).text('BIEN LOUÉ', 50, doc.y, { underline: true }).moveDown(0.5);
    doc.fontSize(10).fillColor(textColor)
        .text(`Propriété : ${receiptData.property_name || 'N/A'}`)
        .text(`Adresse : ${receiptData.property_address || 'N/A'}`)
        .text(`Unité : ${receiptData.unit_number || 'N/A'}`)
        .text(`Loyer mensuel : ${receiptData.tenant_rent ? Number(receiptData.tenant_rent).toLocaleString('fr-FR') : 'N/A'} FCFA`)
        .moveDown(1.5);

    doc.strokeColor(grayColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

    // Détails paiement
    doc.fontSize(12).fillColor(primaryColor).text('DÉTAILS DU PAIEMENT', { underline: true }).moveDown(0.5);
    const monthName = format(new Date(receiptData.year, receiptData.month - 1), 'MMMM yyyy', { locale: fr });
    doc.fontSize(10).fillColor(textColor)
        .text(`Période: ${monthName}`)
        .text(`Date de paiement: ${format(new Date(receiptData.payment_date), 'dd MMMM yyyy', { locale: fr })}`)
        .text(`Mode de paiement: ${receiptData.payment_method || 'Virement'}`)
        .moveDown(1);

    doc.fontSize(16).fillColor(primaryColor).text(`MONTANT PAYÉ: ${Number(receiptData.amount).toLocaleString('fr-FR')} FCFA`, { align: 'center', bold: true }).moveDown(2);

    if (receiptData.notes) {
        doc.fontSize(10).fillColor(grayColor).text(`Notes: ${receiptData.notes}`).moveDown(1);
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc);
}

/**
 * Template Moderne
 */
async function drawModernTemplate(doc, receiptData) {
    const accentColor = '#0f172a'; // Slate 900
    const textColor = '#334155';

    // Header Bar
    doc.rect(0, 0, 612, 100).fill(accentColor);
    doc.fontSize(20).fillColor('#ffffff').text('QUITTANCE DE LOYER', 50, 40);
    doc.fontSize(10).fillColor('#cbd5e1').text(`N° ${receiptData.receipt_number}`, 50, 65);

    doc.moveDown(6);

    // Grid Layout
    const startY = 140;
    doc.fillColor(accentColor).fontSize(14).text('Détails du paiement', 50, startY);
    doc.rect(50, startY + 20, 512, 1).fill('#e2e8f0');

    const col1 = 50;
    const col2 = 300;
    const detailsY = startY + 40;

    doc.fontSize(10).fillColor('#64748b');
    doc.text('PÉRIODE', col1, detailsY);
    doc.text('DATE', col1, detailsY + 30);
    doc.text('MODE', col1, detailsY + 60);

    const monthName = format(new Date(receiptData.year, receiptData.month - 1), 'MMMM yyyy', { locale: fr });
    doc.fillColor(accentColor).fontSize(11);
    doc.text(monthName.toUpperCase(), col1 + 80, detailsY);
    doc.text(format(new Date(receiptData.payment_date), 'dd/MM/yyyy'), col1 + 80, detailsY + 30);
    doc.text((receiptData.payment_method || 'Virement').toUpperCase(), col1 + 80, detailsY + 60);

    doc.moveDown(6);

    // Parties
    const partiesY = doc.y + 40;
    doc.fillColor(accentColor).fontSize(12).text('PROPRIÉTAIRE', col1, partiesY, { bold: true });
    doc.fillColor(textColor).fontSize(10)
        .text(receiptData.owner_name, col1, partiesY + 20)
        .text(receiptData.owner_email || '')
        .text(receiptData.owner_phone || '');

    doc.fillColor(accentColor).fontSize(12).text('LOCATAIRE', col2, partiesY, { bold: true });
    doc.fillColor(textColor).fontSize(10)
        .text(receiptData.tenant_name, col2, partiesY + 20)
        .text(receiptData.tenant_email || '')
        .text(receiptData.tenant_phone || '');

    // Section Bien Loué (Ajoutée)
    doc.moveDown(3);
    const bienY = doc.y;
    doc.fillColor(accentColor).fontSize(13).text('INFORMATION DU BIEN', 50, bienY, { bold: true });
    doc.rect(50, bienY + 18, 512, 1).fill('#e2e8f0');

    const bienDetailsY = bienY + 30;
    doc.fontSize(9).fillColor('#64748b');
    doc.text('PROPRIÉTÉ', col1, bienDetailsY);
    doc.text('ADRESSE', col1, bienDetailsY + 20);
    doc.text('UNITÉ', col2, bienDetailsY);
    doc.text('LOYER MENSUEL', col2, bienDetailsY + 20);

    doc.fillColor(accentColor).fontSize(10);
    doc.text(receiptData.property_name || 'N/A', col1 + 80, bienDetailsY);
    doc.text(receiptData.property_address || 'N/A', col1 + 80, bienDetailsY + 20);
    doc.text(receiptData.unit_number || 'N/A', col2 + 100, bienDetailsY);
    doc.text(`${receiptData.tenant_rent ? Number(receiptData.tenant_rent).toLocaleString('fr-FR') : 'N/A'} FCFA`, col2 + 100, bienDetailsY + 20);

    // Section Montant Total
    doc.moveDown(3);
    const totalBoxY = doc.y;
    doc.rect(50, totalBoxY, 512, 50).fill('#f8fafc');
    doc.fillColor('#64748b').fontSize(10).text('MONTANT TOTAL PAYÉ', 70, totalBoxY + 18);
    doc.fillColor(accentColor).fontSize(18).text(`${Number(receiptData.amount).toLocaleString('fr-FR')} FCFA`, 300, totalBoxY + 15, { bold: true, align: 'right', width: 240 });

    doc.y = totalBoxY + 55;

    if (receiptData.notes) {
        doc.moveDown(1);
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text(`Notes: ${receiptData.notes}`, 50, doc.y);
        doc.font('Helvetica');
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc);
}

/**
 * Template Minimal (Noir & Blanc)
 */
async function drawMinimalTemplate(doc, receiptData) {
    const textColor = '#000000';

    doc.fontSize(22).fillColor(textColor).text('QUITTANCE DE LOYER', { align: 'left', bold: true });
    doc.fontSize(10).text(`Référence: ${receiptData.receipt_number}`, { align: 'left' });
    doc.text(`Date d'émission: ${format(new Date(receiptData.created_at), 'dd/MM/yyyy')}`, { align: 'left' });

    doc.moveDown(1.5);
    doc.rect(50, doc.y, 512, 1.5).fill(textColor);
    doc.moveDown(1);

    // Propriétaire et Locataire (Côté à côte pour gagner de la place)
    const startY = doc.y;
    doc.fontSize(10).text('PROPRIÉTAIRE:', 50, startY, { bold: true });
    doc.fontSize(10).font('Helvetica')
        .text(receiptData.owner_name || 'N/A', 50, startY + 15)
        .text(receiptData.owner_email || '', 50, startY + 27)
        .text(receiptData.owner_phone || '', 50, startY + 39);

    doc.fontSize(10).text('LOCATAIRE:', 320, startY, { bold: true });
    doc.fontSize(10)
        .text(receiptData.tenant_name || 'N/A', 320, startY + 15)
        .text(receiptData.tenant_email || '', 320, startY + 27)
        .text(receiptData.tenant_phone || '', 320, startY + 39);

    doc.moveDown(4.5);
    doc.rect(50, doc.y, 512, 0.5).fill('#eeeeee');
    doc.fillColor(textColor); // Reset color
    doc.moveDown(1);

    // Section Bien
    doc.fontSize(10).text('BIEN LOUÉ:', { bold: true });
    doc.fontSize(10)
        .text(`Propriété : ${receiptData.property_name || 'N/A'}`)
        .text(`Adresse : ${receiptData.property_address || 'N/A'}`)
        .text(`Unité : ${receiptData.unit_number || 'N/A'}`)
        .text(`Loyer mensuel : ${receiptData.tenant_rent ? Number(receiptData.tenant_rent).toLocaleString('fr-FR') : 'N/A'} FCFA`)
        .moveDown(1.5);

    doc.rect(50, doc.y, 512, 0.5).fill('#eeeeee');
    doc.fillColor(textColor); // Reset color
    doc.moveDown(1);

    // Détails du paiement
    const monthName = format(new Date(receiptData.year, receiptData.month - 1), 'MMMM yyyy', { locale: fr });
    doc.fontSize(10).text('DÉTAILS DU PAIEMENT:', { bold: true });
    doc.fontSize(10)
        .text(`Objet : Loyer mensuel - ${monthName}`)
        .text(`Date de paiement : ${format(new Date(receiptData.payment_date), 'dd/MM/yyyy')}`)
        .text(`Mode de paiement : ${receiptData.payment_method || 'Virement'}`)
        .moveDown(1.5);

    // Montant
    doc.strokeColor(textColor).lineWidth(1).rect(50, doc.y, 512, 35).stroke();
    doc.fillColor(textColor).fontSize(12).text(`MONTANT PAYÉ : ${Number(receiptData.amount).toLocaleString('fr-FR')} FCFA`, 65, doc.y + 11, { bold: true });
    doc.y += 35;
    doc.moveDown(1.5);

    if (receiptData.notes) {
        doc.fontSize(9).fillColor('#444444').font('Helvetica-Oblique').text(`Notes: ${receiptData.notes}`, 50, doc.y);
        doc.font('Helvetica');
        doc.moveDown(2);
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc);
}

async function embedSignature(doc, receiptData) {
    if (receiptData.signature_url) {
        try {
            let imageSource = null;
            if (receiptData.signature_url.includes('/uploads/')) {
                const parts = receiptData.signature_url.split('/uploads/');
                if (parts[1]) imageSource = path.join(__dirname, '../../uploads/', parts[1]);
            } else if (receiptData.signature_url.startsWith('http')) {
                const response = await fetch(receiptData.signature_url);
                if (response.ok) imageSource = await response.buffer();
            }

            if (imageSource) {
                doc.moveDown(2);
                const currentY = doc.y;
                if (currentY > 700) doc.addPage();

                doc.fontSize(10).fillColor('#6b7280').text('Signature / Cachet :', 400, doc.y);
                doc.image(imageSource, 400, doc.y + 5, { width: 100 });
                doc.y += 80;
            }
        } catch (error) {
            console.error('Error embedding signature:', error);
        }
    }
}

function drawFooter(doc) {
    const bottom = doc.page.height - 70;
    doc.fontSize(8).fillColor('#94a3b8').text(
        'Ce reçu atteste du paiement du loyer pour la période mentionnée ci-dessus. Document généré automatiquement par Samalocation.',
        50, bottom, { align: 'center', width: 512 }
    );
}

module.exports = { generateReceiptPDF };
