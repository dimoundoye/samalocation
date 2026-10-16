const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { formatAmountInWords } = require('./numberToWords');

// Images distantes (logo, signature) gardées en mémoire : chaque aperçu régénère le PDF,
// sans cache on retéléchargeait les mêmes images depuis Cloudinary à chaque clic sur « Voir ».
const IMAGE_CACHE_MAX_ENTRIES = 100;
const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000;
const IMAGE_FETCH_TIMEOUT_MS = 8000;
const IMAGE_FETCH_ATTEMPTS = 2;
const imageCache = new Map(); // url -> { buffer, expiresAt }

/**
 * Télécharge une image Cloudinary (avec cache, délai maximal et une nouvelle tentative).
 * Retourne null si l'image n'existe pas (404, pas une image) ; lève une erreur si Cloudinary
 * reste injoignable (délai dépassé, erreur réseau ou 5xx).
 */
async function fetchRemoteImage(imageUrl) {
    const cached = imageCache.get(imageUrl);
    if (cached && cached.expiresAt > Date.now()) return cached.buffer;

    let lastError = null;
    for (let attempt = 1; attempt <= IMAGE_FETCH_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(imageUrl, { redirect: 'error', timeout: IMAGE_FETCH_TIMEOUT_MS });
            if (response.ok && (response.headers.get('content-type') || '').startsWith('image/')) {
                const buffer = await response.buffer();
                if (imageCache.size >= IMAGE_CACHE_MAX_ENTRIES) {
                    imageCache.delete(imageCache.keys().next().value);
                }
                imageCache.set(imageUrl, { buffer, expiresAt: Date.now() + IMAGE_CACHE_TTL_MS });
                return buffer;
            }
            if (response.status < 500) return null; // image absente : inutile de réessayer
            lastError = new Error(`HTTP ${response.status}`);
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

/**
 * Helper pour récupérer une source d'image (locale ou distance)
 * @param {string} imageUrl
 * @param {{ required?: boolean }} options - required : si l'image existe mais n'a pas pu être chargée,
 *   lever une erreur plutôt que de produire un document incomplet (cas de la signature)
 */
async function fetchImageSource(imageUrl, { required = false } = {}) {
    if (!imageUrl) return null;
    if (imageUrl.includes('/uploads/')) {
        const parts = imageUrl.split('/uploads/');
        const uploadsDir = path.resolve(__dirname, '../../uploads');
        const fullPath = parts[1] ? path.resolve(uploadsDir, parts[1]) : null;
        // Anti path-traversal : le fichier doit rester dans le dossier uploads
        if (fullPath && fullPath.startsWith(uploadsDir + path.sep) && fs.existsSync(fullPath)) return fullPath;
        return null;
    }
    if (imageUrl.startsWith('https://res.cloudinary.com/')) {
        // Anti-SSRF : seules les images Cloudinary sont téléchargées côté serveur
        try {
            return await fetchRemoteImage(imageUrl);
        } catch (e) {
            console.error(`Error fetching image source (${imageUrl}):`, e.message);
            if (required) {
                const error = new Error("La signature du propriétaire n'a pas pu être chargée. Veuillez réessayer dans un instant.");
                error.statusCode = 503;
                throw error;
            }
        }
    }
    return null;
}

/**
 * Formate un montant en FCFA avec des espaces pour les milliers
 */
function formatCurrency(amount, currency = 'XOF') {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return `0 ${currency === 'XOF' || currency === 'XAF' ? 'F CFA' : currency}`;
    }
    const formatted = Math.floor(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    if (currency === 'XOF' || currency === 'XAF') {
        return `${formatted} F CFA`;
    }
    return `${formatted} ${currency}`;
}

/**
 * Retourne le libellé du loyer selon la période
 */
function getRentLabel(rentPeriod) {
    switch (rentPeriod) {
        case 'jour': return 'Loyer journalier';
        case 'semaine': return 'Loyer hebdomadaire';
        default: return 'Loyer mensuel';
    }
}

/**
 * Formate le libellé de la période (Mois ou Plage de dates)
 */
function formatPeriodLabel(receiptData) {
    if (receiptData.period_type !== 'mois' && receiptData.start_date && receiptData.end_date) {
        try {
            const start = format(new Date(receiptData.start_date), 'dd/MM/yyyy');
            const end = format(new Date(receiptData.end_date), 'dd/MM/yyyy');
            return `Du ${start} au ${end}`;
        } catch (e) {
            console.error("Error formatting period dates:", e);
        }
    }
    
    const yearNum = parseInt(receiptData.year) || new Date().getFullYear();
    const monthNum = parseInt(receiptData.month) || 1;
    try {
        return format(new Date(yearNum, monthNum - 1, 1), 'MMMM yyyy', { locale: fr });
    } catch (e) {
        return 'N/A';
    }
}

const DEPOSIT_FOOTER = 'Somme versée à titre de dépôt de garantie (caution). Elle sera restituée au locataire en fin de bail, '
    + 'déduction faite des sommes dont il resterait redevable (loyers ou charges impayés, réparations locatives), sur justificatifs.';

const UNPAID_NOTICE_FOOTER = "Avis de loyer impayé : il signale un loyer non réglé, en tout ou en partie, pour la période mentionnée "
    + "ci-dessus. Ce document n'est ni un reçu ni une quittance.";

const PARTIAL_FOOTER = "Reçu d'acompte : il atteste d'un versement partiel du loyer de la période mentionnée ci-dessus "
    + "et ne vaut pas quittance tant que le reste à payer n'est pas réglé.";

/**
 * Suivi du reste à payer, figé à l'émission (rent_due, paid_before). null pour une caution ou un reçu
 * émis avant le suivi. isPartial : il reste un montant dû après ce versement (reçu d'acompte).
 */
function getBalanceInfo(receiptData) {
    if (receiptData.receipt_type === 'deposit' || receiptData.rent_due === null || receiptData.rent_due === undefined) return null;
    const rentDue = Number(receiptData.rent_due) || 0;
    const paidBefore = Number(receiptData.paid_before) || 0;
    const amount = Number(receiptData.amount) || 0;
    const remaining = Math.max(Math.round((rentDue - paidBefore - amount) * 100) / 100, 0);
    return {
        rentDue,
        paidBefore,
        amount,
        remaining,
        isPartial: remaining > 0 && amount > 0,
        // Avis de loyer impayé : document à 0 F pour signaler qu'aucun versement n'a été fait sur le mois
        isUnpaidNotice: remaining > 0 && amount === 0,
        // Le détail n'apporte rien pour un loyer réglé en une fois
        showBreakdown: remaining > 0 || paidBefore > 0
    };
}

/**
 * Loyer affiché dans la section du bien : celui figé sur le reçu, sinon le loyer actuel
 */
function getDisplayedRent(receiptData) {
    if (receiptData.rent_due !== null && receiptData.rent_due !== undefined) return receiptData.rent_due;
    return receiptData.unit_base_rent || receiptData.tenant_rent;
}

/**
 * Textes qui changent entre une quittance de loyer, un reçu d'acompte et un reçu de caution (dépôt de garantie)
 */
function getReceiptTexts(receiptData) {
    const isDeposit = receiptData.receipt_type === 'deposit';
    const balance = getBalanceInfo(receiptData);
    const isPartial = !!balance?.isPartial;
    const isUnpaidNotice = !!balance?.isUnpaidNotice;
    return {
        isDeposit,
        isPartial,
        isUnpaidNotice,
        title: (rentTitle) => (isDeposit ? 'REÇU DE CAUTION' : isUnpaidNotice ? 'AVIS DE LOYER IMPAYÉ' : isPartial ? "REÇU D'ACOMPTE" : rentTitle),
        periodHeading: isDeposit ? 'Objet' : 'Période',
        periodValue: isDeposit ? 'Dépôt de garantie (caution)' : formatPeriodLabel(receiptData),
        amountLabel: (rentLabel) => (isDeposit ? 'MONTANT DE LA CAUTION' : isUnpaidNotice ? 'MONTANT VERSÉ' : isPartial ? 'MONTANT DE CE VERSEMENT' : rentLabel),
        amountInWordsPrefix: isUnpaidNotice
            ? 'Montant versé à ce jour'
            : isDeposit || isPartial ? 'Arrêté le présent reçu à la somme de' : 'Arrêté la présente quittance à la somme de'
    };
}

/**
 * Détail du solde de la période : loyer dû, déjà versé, ce versement, reste à payer.
 * Dessiné à partir de doc.y ; rien pour un loyer réglé en une fois.
 */
function drawBalanceBlock(doc, receiptData, { labelColor = '#64748b', valueColor = '#0f172a', alertColor = '#c2410c' } = {}) {
    const info = getBalanceInfo(receiptData);
    if (!info || !info.showBreakdown) return;

    const currency = receiptData.currency || 'XOF';
    const rows = [
        ['Loyer dû pour la période', formatCurrency(info.rentDue, currency)],
        ['Déjà versé', formatCurrency(info.paidBefore, currency)],
        ['Ce versement', formatCurrency(info.amount, currency)]
    ];

    doc.moveDown(0.5);
    let y = doc.y;
    doc.font('Helvetica').fontSize(10);
    for (const [label, value] of rows) {
        doc.fillColor(labelColor).text(label, 70, y);
        doc.fillColor(valueColor).text(value, 300, y, { align: 'right', width: 240 });
        y += 16;
    }

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(70, y + 2).lineTo(540, y + 2).stroke();
    y += 8;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.fillColor(info.remaining > 0 ? alertColor : valueColor).text('RESTE À PAYER', 70, y);
    doc.text(formatCurrency(info.remaining, currency), 300, y, { align: 'right', width: 240 });
    doc.font('Helvetica');
    doc.y = y + 24;
    doc.x = 50;
}

/**
 * Générer un PDF de reçu de paiement
 * @param {Object} receiptData - Données complètes du reçu
 * @returns {Promise<PDFDocument>} - Document PDF (Promise)
 */
async function generateReceiptPDF(receiptData) {
    const template = receiptData.receipt_template || 'classic';
    const ownerPassword = process.env.PDF_OWNER_PASSWORD || 'samalocation_default_secure_key_2026';
    const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        ownerPassword: ownerPassword,
        permissions: {
            modifying: false,
            copying: false,
            annotating: false,
            printing: 'highResolution'
        }
    });

    // Logo et signature téléchargés en parallèle (les templates les relisent ensuite depuis le cache)
    await Promise.all([
        fetchImageSource(receiptData.logo_url),
        fetchImageSource(receiptData.signature_url, { required: true })
    ]);

    if (getBalanceInfo(receiptData)?.isUnpaidNotice) {
        await drawUnpaidNoticeTemplate(doc, receiptData);
    } else if (template === 'modern') {
        await drawModernTemplate(doc, receiptData);
    } else if (template === 'minimal') {
        await drawMinimalTemplate(doc, receiptData);
    } else if (template === 'corporate') {
        await drawCorporateTemplate(doc, receiptData);
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

    // Draw Owner Logo if available
    const logoSource = await fetchImageSource(receiptData.logo_url);
    if (logoSource) {
        doc.image(logoSource, 50, 25, { fit: [80, 80] });
    }

    const texts = getReceiptTexts(receiptData);
    doc.fontSize(24).fillColor(primaryColor).text(texts.title('REÇU DE PAIEMENT'), { align: 'right' }).moveDown(0.5);
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
    const rentLabel = getRentLabel(receiptData.rent_period);
    doc.fontSize(10).fillColor(textColor)
        .text(`Propriété : ${receiptData.property_name || 'N/A'}`)
        .text(`Adresse : ${receiptData.property_address || 'N/A'}`)
        .text(`Unité : ${receiptData.unit_number || 'N/A'}`)
        .text(`${rentLabel} : ${formatCurrency(getDisplayedRent(receiptData), receiptData.currency)}`)
        .moveDown(1.5);

    doc.strokeColor(grayColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

    // Détails paiement
    doc.fontSize(12).fillColor(primaryColor).text('DÉTAILS DU PAIEMENT', { underline: true }).moveDown(0.5);
    doc.fontSize(10).fillColor(textColor)
        .text(`${texts.periodHeading}: ${texts.periodValue}`)
        .text(`Date de paiement: ${format(new Date(receiptData.payment_date), 'dd MMMM yyyy', { locale: fr })}`)
        .text(`Mode de paiement: ${receiptData.payment_method || 'Virement'}`)
        .moveDown(1);

    doc.fontSize(16).fillColor(primaryColor).text(`${texts.amountLabel('MONTANT PAYÉ')}: ${formatCurrency(receiptData.amount, receiptData.currency)}`, { align: 'center', bold: true });
    doc.fontSize(10).fillColor(textColor).text(`Soit : ${formatAmountInWords(receiptData.amount, receiptData.currency || 'XOF')}`, { align: 'center', italic: true }).moveDown(2);
    drawBalanceBlock(doc, receiptData, { valueColor: textColor });

    if (receiptData.notes) {
        doc.fontSize(10).fillColor(grayColor).text(`Notes: ${receiptData.notes}`).moveDown(1);
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc, receiptData);
}

/**
 * Template Moderne
 */
async function drawModernTemplate(doc, receiptData) {
    const accentColor = '#0f172a'; // Slate 900
    const textColor = '#334155';

    // Header Bar
    doc.rect(0, 0, 612, 100).fill(accentColor);

    // Draw Owner Logo if available (smaller in modern)
    const texts = getReceiptTexts(receiptData);
    const logoSource = await fetchImageSource(receiptData.logo_url);
    if (logoSource) {
        doc.image(logoSource, 50, 25, { fit: [50, 50] });
        doc.fontSize(20).fillColor('#ffffff').text(texts.title('QUITTANCE DE LOYER'), 120, 35);
        doc.fontSize(10).fillColor('#cbd5e1').text(`N° ${receiptData.receipt_number}`, 120, 60);
    } else {
        doc.fontSize(20).fillColor('#ffffff').text(texts.title('QUITTANCE DE LOYER'), 50, 40);
        doc.fontSize(10).fillColor('#cbd5e1').text(`N° ${receiptData.receipt_number}`, 50, 65);
    }

    doc.moveDown(6);

    // Grid Layout
    const startY = 140;
    doc.fillColor(accentColor).fontSize(14).text('Détails du paiement', 50, startY);
    doc.rect(50, startY + 20, 512, 1).fill('#e2e8f0');

    const col1 = 50;
    const col2 = 300;
    const detailsY = startY + 40;

    doc.fontSize(10).fillColor('#64748b');
    doc.text(texts.periodHeading.toUpperCase(), col1, detailsY);
    doc.text('DATE', col1, detailsY + 30);
    doc.text('MODE', col1, detailsY + 60);

    doc.fillColor(accentColor).fontSize(11);
    doc.text(texts.periodValue.toUpperCase(), col1 + 80, detailsY);
    doc.text(format(new Date(receiptData.payment_date), 'dd/MM/yyyy'), col1 + 80, detailsY + 30);
    doc.text((receiptData.payment_method || 'Virement').toUpperCase(), col1 + 80, detailsY + 60);

    // Positions fixes : les sections s'enchaînent sans grands vides, pour tenir sur une page
    // (même avec le détail du reste à payer et la signature)
    const partiesY = detailsY + 95;
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
    const bienY = partiesY + 80;
    doc.fillColor(accentColor).fontSize(13).text('INFORMATION DU BIEN', 50, bienY, { bold: true });
    doc.rect(50, bienY + 18, 512, 1).fill('#e2e8f0');

    const bienDetailsY = bienY + 30;
    doc.fontSize(9).fillColor('#64748b');
    doc.text('PROPRIÉTÉ', col1, bienDetailsY);
    doc.text('ADRESSE', col1, bienDetailsY + 20);
    doc.text('UNITÉ', col2, bienDetailsY);
    doc.text(getRentLabel(receiptData.rent_period).toUpperCase(), col2, bienDetailsY + 20);

    doc.fillColor(accentColor).fontSize(10);
    doc.text(receiptData.property_name || 'N/A', col1 + 80, bienDetailsY);
    doc.text(receiptData.property_address || 'N/A', col1 + 80, bienDetailsY + 20);
    doc.text(receiptData.unit_number || 'N/A', col2 + 100, bienDetailsY);
    doc.text(formatCurrency(getDisplayedRent(receiptData), receiptData.currency), col2 + 100, bienDetailsY + 20);

    // Section Montant Total
    const totalBoxY = bienDetailsY + 50;
    doc.rect(50, totalBoxY, 512, 50).fill('#f8fafc');
    doc.fillColor('#64748b').fontSize(10).text(texts.amountLabel('MONTANT TOTAL PAYÉ'), 70, totalBoxY + 18);
    doc.fillColor(accentColor).fontSize(18).text(formatCurrency(receiptData.amount, receiptData.currency), 300, totalBoxY + 15, { bold: true, align: 'right', width: 240 });

    doc.fillColor(textColor).fontSize(9).text(`${texts.amountInWordsPrefix} : ${formatAmountInWords(receiptData.amount, receiptData.currency || 'XOF')}`, 50, totalBoxY + 55, { italic: true });
    doc.y = totalBoxY + 75;
    drawBalanceBlock(doc, receiptData, { valueColor: accentColor });

    if (receiptData.notes) {
        doc.moveDown(1);
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text(`Notes: ${receiptData.notes}`, 50, doc.y);
        doc.font('Helvetica');
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc, receiptData);
}

/**
 * Template Minimal (Noir & Blanc)
 */
async function drawMinimalTemplate(doc, receiptData) {
    const textColor = '#000000';

    const texts = getReceiptTexts(receiptData);
    doc.fontSize(22).fillColor(textColor).text(texts.title('QUITTANCE DE LOYER'), { align: 'left', bold: true });
    doc.fontSize(10).text(`Référence: ${receiptData.receipt_number}`, { align: 'left' });
    doc.text(`Date d'émission: ${format(new Date(receiptData.created_at), 'dd/MM/yyyy')}`, { align: 'left' });

    // Logo in top right for minimal
    const logoSource = await fetchImageSource(receiptData.logo_url);
    if (logoSource) {
        doc.image(logoSource, 460, 40, { fit: [100, 60] });
    }

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

    // Section Bien (doc.x est resté sur la colonne du locataire)
    doc.x = 50;
    doc.fontSize(10).text('BIEN LOUÉ:', { bold: true });
    doc.fontSize(10)
        .text(`Propriété : ${receiptData.property_name || 'N/A'}`)
        .text(`Adresse : ${receiptData.property_address || 'N/A'}`)
        .text(`Unité : ${receiptData.unit_number || 'N/A'}`)
        .text(`${getRentLabel(receiptData.rent_period)} : ${formatCurrency(getDisplayedRent(receiptData), receiptData.currency)}`)
        .moveDown(1.5);

    doc.rect(50, doc.y, 512, 0.5).fill('#eeeeee');
    doc.fillColor(textColor); // Reset color
    doc.moveDown(1);

    // Détails du paiement
    doc.fontSize(10).text('DÉTAILS DU PAIEMENT:', { bold: true });
    doc.fontSize(10)
        .text(texts.isDeposit ? `Objet : ${texts.periodValue}` : `Objet : Location - ${texts.periodValue}`)
        .text(`Date de paiement : ${format(new Date(receiptData.payment_date), 'dd/MM/yyyy')}`)
        .text(`Mode de paiement : ${receiptData.payment_method || 'Virement'}`)
        .moveDown(1.5);

    // Montant
    doc.strokeColor(textColor).lineWidth(1).rect(50, doc.y, 512, 35).stroke();
    doc.fillColor(textColor).fontSize(12).text(`${texts.amountLabel('MONTANT PAYÉ')} : ${formatCurrency(receiptData.amount, receiptData.currency)}`, 65, doc.y + 11, { bold: true });
    doc.y += 35;
    doc.moveDown(1);
    doc.fontSize(10).fillColor(textColor).text(`Soit : ${formatAmountInWords(receiptData.amount, receiptData.currency || 'XOF')}`, { italic: true }).moveDown(1.5);
    drawBalanceBlock(doc, receiptData, { labelColor: '#444444', valueColor: textColor, alertColor: textColor });

    if (receiptData.notes) {
        doc.fontSize(9).fillColor('#444444').font('Helvetica-Oblique').text(`Notes: ${receiptData.notes}`, 50, doc.y);
        doc.font('Helvetica');
        doc.moveDown(2);
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc, receiptData);
}

/**
 * Libellés des moyens de paiement du propriétaire (owner_payment_methods), pour l'avis de loyer impayé
 */
function formatPaymentMethodLine(method) {
    const holder = method.holder ? ` (${method.holder})` : '';
    switch (method.type) {
        case 'wave': return method.phone ? `Wave : ${method.phone}${holder}` : null;
        case 'orange_money': return method.phone ? `Orange Money : ${method.phone}${holder}` : null;
        case 'wave_link': return method.url ? `Lien de paiement Wave : ${method.url}` : null;
        case 'bank': return method.iban ? `Virement${method.bank_name ? ` (${method.bank_name})` : ''} : ${method.iban}${holder}` : null;
        default: return null;
    }
}

/**
 * Échéance du loyer : jour de paiement prévu au bail (borné au dernier jour du mois). null si inconnu.
 */
function getRentDueDate(receiptData) {
    const day = parseInt(receiptData.payment_day, 10);
    const year = parseInt(receiptData.year, 10);
    const month = parseInt(receiptData.month, 10);
    if (!day || !year || !month) return null;
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(year, month - 1, Math.min(day, lastDay));
}

/**
 * Avis de loyer impayé : relance pour un loyer non réglé (en tout ou en partie).
 * Pas de versement, donc ni date ni mode de paiement : période, échéance, montant à régler et moyens de paiement.
 */
async function drawUnpaidNoticeTemplate(doc, receiptData) {
    // « loyer d'octobre », « loyer de mars »
    const periodLabel = formatPeriodLabel(receiptData);
    const ofPeriod = /^[aeiouyàâéèêh]/i.test(periodLabel) ? `d'${periodLabel}` : `de ${periodLabel}`;
    const alertColor = '#b91c1c';
    const textColor = '#1f2937';
    const mutedColor = '#6b7280';
    const lineColor = '#e5e7eb';
    const info = getBalanceInfo(receiptData);
    const currency = receiptData.currency || 'XOF';
    const issuedAt = new Date(receiptData.created_at || Date.now());

    // En-tête
    const logoSource = await fetchImageSource(receiptData.logo_url);
    if (logoSource) {
        doc.image(logoSource, 50, 40, { fit: [70, 50] });
    }
    doc.font('Helvetica-Bold').fontSize(20).fillColor(alertColor).text('AVIS DE LOYER IMPAYÉ', 50, 45, { align: 'right', width: 512 });
    doc.font('Helvetica').fontSize(9).fillColor(mutedColor)
        .text(`N° ${receiptData.receipt_number}`, 50, 72, { align: 'right', width: 512 })
        .text(`Émis le ${format(issuedAt, 'dd MMMM yyyy', { locale: fr })}`, 50, 85, { align: 'right', width: 512 });
    doc.rect(50, 108, 512, 2).fill(alertColor);

    // Parties
    const partiesY = 125;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(alertColor).text('BAILLEUR', 50, partiesY);
    doc.font('Helvetica').fontSize(10).fillColor(textColor)
        .text(receiptData.owner_name || 'N/A', 50, partiesY + 16)
        .text(receiptData.owner_email || '', 50)
        .text(receiptData.owner_phone || '', 50);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(alertColor).text('LOCATAIRE', 320, partiesY);
    doc.font('Helvetica').fontSize(10).fillColor(textColor)
        .text(receiptData.tenant_name || 'N/A', 320, partiesY + 16)
        .text(receiptData.tenant_email || '', 320)
        .text(receiptData.tenant_phone || '', 320);

    // Logement
    const bienY = partiesY + 80;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(alertColor).text('LOGEMENT', 50, bienY);
    const unitLabel = receiptData.unit_number ? ` — Unité ${receiptData.unit_number}` : '';
    doc.font('Helvetica').fontSize(10).fillColor(textColor)
        .text(`${receiptData.property_name || 'N/A'}${unitLabel}`, 50, bienY + 16)
        .text(receiptData.property_address || '', 50);

    // Objet, échéance, retard
    const objetY = bienY + 60;
    doc.rect(50, objetY, 512, 1).fill(lineColor);
    const dueDate = getRentDueDate(receiptData);
    const lateDays = dueDate ? Math.floor((issuedAt.setHours(0, 0, 0, 0) - dueDate.getTime()) / 86400000) : 0;
    let y = objetY + 14;
    const drawRow = (label, value, { bold = false, color = textColor, size = 10 } = {}) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
        doc.fillColor(bold ? color : mutedColor).text(label, 70, y);
        doc.fillColor(color).text(value, 300, y, { align: 'right', width: 240 });
        y += size + 8;
    };
    drawRow('Objet', `Loyer ${ofPeriod}`, { color: textColor });
    if (dueDate) {
        drawRow('Échéance', format(dueDate, 'dd MMMM yyyy', { locale: fr }));
        if (lateDays > 0) drawRow('Retard', `${lateDays} jour${lateDays > 1 ? 's' : ''}`, { color: alertColor });
    }

    // Montant à régler
    y += 6;
    doc.rect(50, y, 512, 1).fill(lineColor);
    y += 12;
    drawRow('Loyer dû pour la période', formatCurrency(info.rentDue, currency));
    drawRow('Déjà versé', formatCurrency(info.paidBefore, currency));
    y += 2;
    doc.rect(50, y - 4, 512, 34).fill('#fef2f2');
    y += 6;
    drawRow('MONTANT À RÉGLER', formatCurrency(info.remaining, currency), { bold: true, color: alertColor, size: 13 });
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(mutedColor)
        .text(`Soit : ${formatAmountInWords(info.remaining, currency)}`, 70, y + 2, { width: 470 });
    y = doc.y + 16;

    // Message
    doc.font('Helvetica').fontSize(10).fillColor(textColor).text(
        info.paidBefore > 0
            ? `Madame, Monsieur, sauf erreur de notre part, le loyer ${ofPeriod} n'a été réglé qu'en partie. `
                + 'Nous vous prions de bien vouloir régler le montant restant dans les meilleurs délais.'
            : `Madame, Monsieur, sauf erreur de notre part, nous n'avons pas reçu le règlement du loyer ${ofPeriod}. `
                + 'Nous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais.',
        50, y, { width: 512, align: 'justify' }
    );
    if (receiptData.notes) {
        doc.moveDown(0.6);
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(textColor).text(`Message du bailleur : ${receiptData.notes}`, 50, doc.y, { width: 512 });
    }

    // Comment payer
    const methodLines = (receiptData.owner_payment_methods || [])
        .flatMap(m => [formatPaymentMethodLine(m), m.instructions ? `   ${m.instructions}` : null])
        .filter(Boolean);
    if (methodLines.length > 0) {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(alertColor).text('COMMENT PAYER', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor(textColor);
        methodLines.forEach(line => doc.text(line.startsWith('   ') ? line.trim() : `• ${line}`, line.startsWith('   ') ? 62 : 50, doc.y, { width: 500 }));
    }
    doc.font('Helvetica');
    doc.x = 50;

    await embedSignature(doc, receiptData);
    drawFooter(doc, receiptData);
}

async function embedSignature(doc, receiptData) {
    if (receiptData.signature_url) {
        const imageSource = await fetchImageSource(receiptData.signature_url, { required: true });
        if (imageSource) {
            doc.moveDown(2);
            // Bloc signature (~95 pt) au-dessus du pied de page (hash + mention) : sinon page suivante
            if (doc.y + 95 > doc.page.height - 95) doc.addPage();

            doc.fontSize(10).fillColor('#6b7280').text('Signature / Cachet :', 400, doc.y);
            doc.image(imageSource, 400, doc.y + 5, { width: 100 });
            doc.y += 80;
        }
    }
}

/**
 * Template Corporate / Agence
 */
async function drawCorporateTemplate(doc, receiptData) {
    const primaryColor = '#1e293b'; // Slate 800
    const secondaryColor = '#475569';
    const textColor = '#334155';

    // Top Brand Section
    const logoSource = await fetchImageSource(receiptData.logo_url);
    if (logoSource) {
        doc.image(logoSource, 50, 40, { fit: [120, 80] });
    }

    const texts = getReceiptTexts(receiptData);
    doc.fontSize(24).fillColor(primaryColor).text(texts.title('QUITTANCE DE LOYER'), 200, 45, { align: 'right', characterSpacing: 1 });
    doc.fontSize(10).fillColor(secondaryColor).text(`RÉFÉRENCE : ${receiptData.receipt_number}`, 200, 75, { align: 'right' });

    doc.moveDown(4);

    // Corporate Header Grid
    const headerY = doc.y;
    doc.rect(50, headerY, 512, 100).fill('#f1f5f9');

    doc.fillColor(primaryColor).fontSize(11).text('ÉMETTEUR (PROPRIÉTAIRE)', 70, headerY + 15, { bold: true });
    doc.fillColor(textColor).fontSize(10)
        .text(receiptData.owner_name, 70, headerY + 35)
        .text(receiptData.owner_email || '')
        .text(receiptData.owner_phone || '');

    doc.fillColor(primaryColor).fontSize(11).text('LOCATAIRE', 320, headerY + 15, { bold: true });
    doc.fillColor(textColor).fontSize(10)
        .text(receiptData.tenant_name, 320, headerY + 35)
        .text(receiptData.tenant_email || '')
        .text(receiptData.tenant_phone || '');

    doc.y = headerY + 120;
    doc.x = 50; // doc.x est resté sur la colonne du locataire

    // Body content
    doc.fontSize(12).fillColor(primaryColor).text('OBJET DU PAIEMENT', { underline: true }).moveDown(0.5);
    // Styled Table-like list
    const itemsY = doc.y;
    const drawItem = (label, value, y) => {
        doc.fillColor(secondaryColor).fontSize(10).text(label, 60, y);
        doc.fillColor(primaryColor).fontSize(10).text(value, 200, y, { bold: true });
    };

    drawItem(texts.isDeposit ? 'Objet du versement' : 'Période de location', texts.periodValue.toUpperCase(), itemsY + 10);
    drawItem('Propriété louée', receiptData.property_name || 'N/A', itemsY + 30);
    drawItem('Adresse du bien', receiptData.property_address || 'N/A', itemsY + 50);
    drawItem('Date de règlement', format(new Date(receiptData.payment_date), 'dd/MM/yyyy'), itemsY + 70);
    drawItem('Mode de paiement', (receiptData.payment_method || 'Virement').toUpperCase(), itemsY + 90);

    doc.y = itemsY + 120;

    // Total Amount Box
    const amountY = doc.y;
    doc.strokeColor(primaryColor).lineWidth(1.5).rect(50, amountY, 512, 45).stroke();
    doc.fillColor('#f8fafc').rect(51, amountY + 1, 510, 43).fill();
    doc.fillColor(primaryColor).fontSize(14).text(texts.isUnpaidNotice ? 'MONTANT VERSÉ :' : texts.isPartial ? 'MONTANT DE CE VERSEMENT :' : 'MONTANT NET PERÇU :', 70, amountY + 15, { bold: true });
    doc.fontSize(16).text(formatCurrency(receiptData.amount, receiptData.currency), 300, amountY + 14, { bold: true, align: 'right', width: 240 });

    doc.fillColor(textColor).fontSize(10).text(`${texts.amountInWordsPrefix} : ${formatAmountInWords(receiptData.amount, receiptData.currency || 'XOF')}`, 50, amountY + 52, { italic: true });
    doc.y = amountY + 75;
    drawBalanceBlock(doc, receiptData, { labelColor: secondaryColor, valueColor: primaryColor });

    if (receiptData.notes) {
        doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Oblique').text(`Remarques: ${receiptData.notes}`);
        doc.font('Helvetica');
    }

    await embedSignature(doc, receiptData);
    drawFooter(doc, receiptData);
}

function drawFooter(doc, receiptData) {
    // Les mentions de caution et d'acompte tiennent sur deux lignes : on les remonte pour rester dans la page
    const balanceInfo = receiptData ? getBalanceInfo(receiptData) : null;
    const twoLines = receiptData?.receipt_type === 'deposit' || !!(balanceInfo?.isPartial || balanceInfo?.isUnpaidNotice);
    const bottom = doc.page.height - (twoLines ? 80 : 70);
    if (receiptData) {
        const crypto = require('crypto');
        const rawData = `${receiptData.receipt_number || ''}${receiptData.id || ''}${receiptData.amount || ''}`;
        const docHash = crypto.createHash('sha256').update(rawData).digest('hex');
        
        doc.fontSize(7).fillColor('#cbd5e1').text(
            `Hash de securite : ${docHash}`,
            50, bottom - 15, { align: 'center', width: 512 }
        );
    }
    
    const isOnline = receiptData && receiptData.payment_method && receiptData.payment_method.startsWith('En ligne');
    const footerText = receiptData?.receipt_type === 'deposit'
        ? DEPOSIT_FOOTER
        : balanceInfo?.isUnpaidNotice
            ? UNPAID_NOTICE_FOOTER
        : balanceInfo?.isPartial
            ? PARTIAL_FOOTER
        : isOnline
            ? 'Quittance émise par la plateforme Samalocation, gérée par YAKIRIX (RCCM : SN.DKR.2026.A.14009 — NINEA : 012978435) en qualité de mandataire de collecte pour le compte du bailleur.'
            : 'Ce reçu atteste du paiement du loyer pour la période mentionnée ci-dessus.';

    doc.fontSize(8).fillColor('#94a3b8').text(
        footerText,
        50, bottom, { align: 'center', width: 512 }
    );
}

/**
 * Décompte de restitution d'une caution : caution versée, retenues motivées, montant rendu au locataire.
 * @param {Object} data - Données du reçu de caution (Receipt.findById) + `settlement` (ligne deposit_settlements)
 */
async function generateDepositSettlementPDF(data) {
    const settlement = data.settlement;
    const ownerPassword = process.env.PDF_OWNER_PASSWORD || 'samalocation_default_secure_key_2026';
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        ownerPassword,
        permissions: { modifying: false, copying: false, annotating: false, printing: 'highResolution' }
    });

    const primaryColor = '#1e293b';
    const mutedColor = '#64748b';
    const textColor = '#334155';
    const currency = data.currency || 'XOF';
    const depositAmount = Number(settlement.deposit_amount);
    const refundedAmount = Number(settlement.refunded_amount);
    const retainedAmount = Number(settlement.retained_amount);
    const deductions = Array.isArray(settlement.deductions) ? settlement.deductions : [];

    const [logoSource] = await Promise.all([
        fetchImageSource(data.logo_url),
        fetchImageSource(settlement.owner_signature, { required: true })
    ]);

    // En-tête
    if (logoSource) {
        doc.image(logoSource, 50, 40, { fit: [100, 70] });
    }
    doc.fontSize(18).fillColor(primaryColor).text('DÉCOMPTE DE RESTITUTION', 200, 45, { align: 'right', width: 362 });
    doc.fontSize(18).text('DE CAUTION', 200, 67, { align: 'right', width: 362 });
    doc.fontSize(10).fillColor(mutedColor)
        .text(`N° ${settlement.settlement_number}`, 200, 95, { align: 'right', width: 362 })
        .text(`Établi le ${format(new Date(settlement.settlement_date), 'dd MMMM yyyy', { locale: fr })}`, 200, 110, { align: 'right', width: 362 });

    let y = 140;
    if (settlement.status === 'cancelled') {
        doc.rect(50, y, 512, 28).fill('#fee2e2');
        doc.fillColor('#b91c1c').fontSize(10)
            .text(`DOCUMENT ANNULÉ${settlement.cancellation_reason ? ` — Motif : ${settlement.cancellation_reason}` : ''}`, 60, y + 9, { width: 492 });
        y += 40;
    }

    // Parties
    doc.rect(50, y, 512, 80).fill('#f1f5f9');
    doc.fillColor(primaryColor).fontSize(11).text('BAILLEUR', 70, y + 12);
    doc.fillColor(textColor).fontSize(10)
        .text(data.owner_name || 'N/A', 70, y + 30)
        .text(data.owner_email || '')
        .text(data.owner_phone || '');
    doc.fillColor(primaryColor).fontSize(11).text('LOCATAIRE', 320, y + 12);
    doc.fillColor(textColor).fontSize(10)
        .text(data.tenant_name || 'N/A', 320, y + 30)
        .text(data.tenant_email || '')
        .text(data.tenant_phone || '');
    y += 100;

    // Bien et caution d'origine
    const drawItem = (label, value) => {
        doc.fillColor(mutedColor).fontSize(10).text(label, 60, y);
        doc.fillColor(primaryColor).fontSize(10).text(value, 220, y, { width: 340 });
        y += 18;
    };
    doc.fillColor(primaryColor).fontSize(12).text('BIEN ET CAUTION', 50, y, { underline: true });
    y += 22;
    drawItem('Propriété', data.property_name || 'N/A');
    drawItem('Adresse', data.property_address || 'N/A');
    if (data.unit_number) drawItem('Unité', String(data.unit_number));
    drawItem('Reçu de caution', `N° ${data.receipt_number} du ${format(new Date(data.payment_date), 'dd/MM/yyyy')}`);
    y += 12;

    // Décompte
    doc.fillColor(primaryColor).fontSize(12).text('DÉCOMPTE', 50, y, { underline: true });
    y += 22;
    const drawRow = (label, amount, { bold = false, color = textColor, sign = '' } = {}) => {
        if (y > 690) {
            doc.addPage();
            y = 50;
        }
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color).fontSize(10)
            .text(label, 60, y, { width: 330 })
            .text(`${sign}${formatCurrency(amount, currency)}`, 390, y, { width: 162, align: 'right' });
        y = Math.max(doc.y, y + 14) + 6;
        doc.font('Helvetica');
    };
    drawRow('Caution versée', depositAmount, { bold: true, color: primaryColor });
    deductions.forEach(d => drawRow(`Retenue : ${d.label}`, Number(d.amount), { color: '#b91c1c', sign: '- ' }));
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(60, y).lineTo(552, y).stroke();
    y += 8;
    drawRow('Total des retenues', retainedAmount, { color: '#b91c1c', sign: retainedAmount > 0 ? '- ' : '' });

    // Montant restitué
    y += 6;
    doc.strokeColor(primaryColor).lineWidth(1.5).rect(50, y, 512, 40).stroke();
    doc.font('Helvetica-Bold').fillColor(primaryColor).fontSize(12)
        .text('MONTANT RESTITUÉ AU LOCATAIRE', 65, y + 14)
        .text(formatCurrency(refundedAmount, currency), 330, y + 14, { width: 217, align: 'right' });
    doc.font('Helvetica');
    y += 50;

    doc.fillColor(textColor).fontSize(10);
    if (refundedAmount > 0) {
        doc.text(`Soit : ${formatAmountInWords(refundedAmount, currency)}`, 50, y, { width: 512 });
        y = doc.y + 4;
        doc.text(`Restitué le ${format(new Date(settlement.settlement_date), 'dd/MM/yyyy')}${settlement.payment_method ? ` — Mode : ${settlement.payment_method}` : ''}`, 50, y, { width: 512 });
    } else {
        doc.text("Aucune somme n'est restituée : la caution est entièrement retenue.", 50, y, { width: 512 });
    }
    y = doc.y + 10;

    if (settlement.notes) {
        doc.fillColor(mutedColor).fontSize(9).font('Helvetica-Oblique').text(`Remarques : ${settlement.notes}`, 50, y, { width: 512 });
        doc.font('Helvetica');
        y = doc.y;
    }
    doc.y = y;

    await embedSignature(doc, { signature_url: settlement.owner_signature });

    // Pied de page : empreinte du document + mention
    const bottom = doc.page.height - 80;
    const crypto = require('crypto');
    const docHash = crypto.createHash('sha256')
        .update(`${settlement.settlement_number}${settlement.id}${depositAmount}${refundedAmount}${retainedAmount}`)
        .digest('hex');
    doc.fontSize(7).fillColor('#cbd5e1').text(`Hash de securite : ${docHash}`, 50, bottom - 15, { align: 'center', width: 512 });
    doc.fontSize(8).fillColor('#94a3b8').text(
        'Ce décompte solde le dépôt de garantie versé par le locataire. Les retenues correspondent aux sommes dont il restait redevable, sur justificatifs.',
        50, bottom, { align: 'center', width: 512 }
    );

    return doc;
}

module.exports = { generateReceiptPDF, generateDepositSettlementPDF };
