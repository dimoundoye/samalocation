const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const nodeFetch = require('node-fetch');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { formatAmountInWords } = require('./numberToWords');

/**
 * Lit une image de signature depuis le disque ou le réseau et la convertit en Data URI Base64
 */
async function resolveSignatureDataUri(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    const trimmed = imageUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:image/')) return trimmed;

    try {
        if (trimmed.includes('/uploads/') || trimmed.startsWith('uploads/')) {
            const parts = trimmed.split('/uploads/');
            const relPath = parts[1] || parts[0];
            const uploadsDir = path.resolve(__dirname, '../../uploads');
            const fullPath = path.resolve(uploadsDir, relPath);
            // Anti path-traversal : le fichier doit rester dans le dossier uploads
            if (fullPath.startsWith(uploadsDir + path.sep) && fs.existsSync(fullPath)) {
                const fileBuf = fs.readFileSync(fullPath);
                const ext = path.extname(fullPath).toLowerCase().replace('.', '') || 'png';
                const mime = ext === 'jpg' ? 'jpeg' : ext;
                return `data:image/${mime};base64,${fileBuf.toString('base64')}`;
            }
        }
        // Anti-SSRF : seules les images hébergées sur Cloudinary sont téléchargées côté serveur
        if (trimmed.startsWith('https://res.cloudinary.com/')) {
            const response = await nodeFetch(trimmed, { redirect: 'error' });
            const contentType = response.headers.get('content-type') || '';
            if (response.ok && contentType.startsWith('image/')) {
                const buffer = await response.buffer();
                return `data:${contentType};base64,${buffer.toString('base64')}`;
            }
        }
    } catch (err) {
        console.error('Error resolving signature image to data URI:', err.message);
    }
    return null;
}

/**
 * Génère le PDF du contrat de location optimisé juridiquement
 */
async function generateContractPDF(contractData) {
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

    const isPremium = contractData.contract_type === 'premium';
    console.log(`Generating PDF for contract: ${contractData.contract_number}, Type: ${contractData.contract_type}, ID: ${contractData.id || contractData.contract_id}`);
    const accentColor = '#0f172a';
    const textColor = '#334155';
    const secondaryColor = '#64748b';
    const lineHighlight = '#f1f5f9';

    // Helper: format currency properly
    const formatCurrency = (amount, currencyCode = 'XOF') => {
        if (!amount) return `0 ${currencyCode === 'XOF' || currencyCode === 'XAF' ? 'FCFA' : currencyCode}`;
        const formatted = Number(amount).toLocaleString('fr-FR').replace(/\s/g, ' ');
        if (currencyCode === 'XOF' || currencyCode === 'XAF') return `${formatted} FCFA`;
        return `${formatted} ${currencyCode}`;
    };

    // Helper: Section titles
    const sectionTitle = (title) => {
        doc.moveDown();
        doc.fontSize(12).fillColor(accentColor).font('Helvetica-Bold').text(title.toUpperCase());
        doc.rect(50, doc.y, 512, 0.5).fill('#cbd5e1');
        doc.moveDown(0.5).font('Helvetica').fillColor(textColor).fontSize(10);
    };

    // -- HEADER --
    doc.fontSize(18).fillColor(accentColor).font('Helvetica-Bold').text('CONTRAT DE BAIL A USAGE D\'HABITATION', { align: 'center' });
    doc.fontSize(8).fillColor(secondaryColor).font('Helvetica').text(isPremium ? 'VERSION PREMIUM' : 'VERSION STANDARD', { align: 'center' });
    doc.moveDown();

    doc.fontSize(9).fillColor(textColor).text(`Contrat n° : ${contractData.contract_number}`, { align: 'right' });
    doc.fontSize(7).fillColor(secondaryColor).text(`ID: ${contractData.id || contractData.contract_id || ''}`, { align: 'right' });
    doc.fontSize(9).fillColor(textColor).text(`Etabli le ${format(new Date(contractData.created_at || new Date()), 'dd MMMM yyyy', { locale: fr })}`, { align: 'right' });
    doc.moveDown(1.5);

    // -- 1. DÉSIGNATION DES PARTIES --
    sectionTitle('1. DESIGNATION DES PARTIES');
    const startYParties = doc.y;
 
    // BAILLEUR
    doc.font('Helvetica-Bold').text('LE BAILLEUR (Proprietaire) :', 50, startYParties);
    doc.font('Helvetica').fontSize(9)
        .text(`M./Mme : ${contractData.owner_name || '_______'}`, 50, startYParties + 15)
        .text(`Identite : ${contractData.owner_id_type || 'CNI'} n° ${contractData.owner_id_number || '_______'} delivree le ${contractData.owner_id_date ? format(new Date(contractData.owner_id_date), 'dd/MM/yyyy') : '_______'}`)
        .text(`Ne(e) le : ${contractData.owner_dob ? format(new Date(contractData.owner_dob), 'dd/MM/yyyy') : '_______'} a ${contractData.owner_birthplace || '_______'}`)
        .text(`Adresse : ${contractData.owner_address || contractData.owner_address_detailed || '_______'}`)
        .text(`Contact : ${contractData.owner_phone || '_______'} / ${contractData.owner_email || '_______'}`);
 
    // LOCATAIRE
    doc.font('Helvetica-Bold').fontSize(10).text('LE LOCATAIRE :', 300, startYParties);
    doc.font('Helvetica').fontSize(9)
        .text(`M./Mme : ${contractData.tenant_name || '_______'}`, 300, startYParties + 15)
        .text(`Identite : ${contractData.tenant_id_type || 'CNI'} n° ${contractData.tenant_id_number || '_______'} delivree le ${contractData.tenant_id_date ? format(new Date(contractData.tenant_id_date), 'dd/MM/yyyy') : '_______'}`)
        .text(`Ne(e) le : ${contractData.tenant_dob ? format(new Date(contractData.tenant_dob), 'dd/MM/yyyy') : '_______'} a ${contractData.tenant_birthplace || '_______'}`)
        .text(`Contact : ${contractData.tenant_phone || '_______'} / ${contractData.tenant_email || '_______'}`);
 
    doc.moveDown(4);

    // -- 2. OBJET ET DESIGNATION --
    sectionTitle('2. OBJET ET DESIGNATION DES LIEUX');
    doc.text(`Le Bailleur donne en location au Locataire, qui accepte, les locaux designes ci-apres :`);
    doc.moveDown(0.5);
    doc.rect(50, doc.y, 512, 45).fill(lineHighlight);
    doc.fillColor(textColor).fontSize(9)
        .text(`Type de bien : ${contractData.property_type || 'Appartement'}`, 60, doc.y + 5)
        .text(`Adresse : ${contractData.detailed_address || contractData.property_address || 'Non specifiee'}`);
    
    if (contractData.property_details) {
        doc.text(`Details : ${contractData.property_details}`);
    }

    doc.text(`Usage : EXCLUSIVEMENT A USAGE D'HABITATION.`);

    doc.moveDown(2);

    // -- 3. DURÉE DU CONTRAT --
    sectionTitle('3. DUREE ET RELOCALISATION');
    doc.text(`Le present contrat est conclu pour une duree ferme de ${contractData.duration_months} mois, commencant le ${format(new Date(contractData.start_date), 'dd MMMM yyyy', { locale: fr })}.`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('CLAUSE DE DEPART :', { underline: true });
    doc.font('Helvetica').text(`Le LOCATAIRE pourra resilier son bail a tout moment, sous reserve de respecter un preavis d'un mois notifie par courrier accuse de reception ou par voie electronique certifiee sur la plateforme. Ce preavis s'applique egalement au LOCATAIRE souhaitant partir au terme de la DUREE DE LOCATION, afin d'eviter toute reconduction tacite.`);

    // -- 4. CONDITIONS FINANCIÈRES --
    sectionTitle('4. CONDITIONS FINANCIERES');
    const currency = contractData.currency || 'XOF';
    
    doc.font('Helvetica-Bold').text(`Loyer mensuel : `, { continued: true })
       .font('Helvetica').text(`${formatCurrency(contractData.rent_amount, currency)} `)
       .fontSize(8).fillColor(secondaryColor).font('Helvetica-Oblique').text(`(soit ${formatAmountInWords(contractData.rent_amount, currency)})`);
    
    doc.moveDown(0.5);
    
    doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(`Depot de garantie : `, { continued: true })
       .font('Helvetica').text(`${formatCurrency(contractData.deposit_amount, currency)} `)
       .fontSize(8).fillColor(secondaryColor).font('Helvetica-Oblique').text(`(soit ${formatAmountInWords(contractData.deposit_amount, currency)})`);
    
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(`Ce depot sera restitue en fin de bail sous reserve de l'etat des lieux.`);
    
    doc.moveDown(0.5);
    doc.text(`Date de paiement : Au plus tard le ${contractData.payment_day} de chaque mois.`);
    doc.text(`Mode de paiement : ${contractData.payment_method || 'Virement / Mobile Money'}.`);

    if (isPremium && contractData.charges_info) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Charges :');
        doc.font('Helvetica').text(`Les charges suivantes sont a la charge exclusive du locataire : ${contractData.charges_info.description || 'Eau, Electricite, Internet'}.`);
    }

    // -- 5. ÉTAT DES LIEUX ET ENTRETIEN (TOUS CONTRATS) --
    sectionTitle('5. ETAT DES LIEUX ET ENTRETIEN');
    doc.text(`Un etat des lieux d'entree contradictoire sera etabli et signe par les parties. Un etat des lieux de sortie sera effectue a la fin du bail.`);
    doc.text(`Le locataire devra tenir les lieux en etat de proprete et ne pourra faire aucune transformation sans l'autorisation prealable ecrite du bailleur.`);
    doc.text(`Le nombre de personnes pouvant occuper le bien est strictement limite a ${contractData.occupancy_limit} individus.`);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Interdiction de sous-location :');
    doc.font('Helvetica').text(`Le locataire ne peut sous-louer le logement, en totalite ou en partie, sans autorisation ecrite du bailleur.`);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Nuisances :');
    doc.font('Helvetica').text(`La sonorite abusive et le tapage nocturne sont interdits et ne seront toleres qu'en cas de fetes occasionnelles.`);

    // -- 6. CLAUSES RÉSOLUTOIRES --
    sectionTitle('6. CLAUSES RESOLUTOIRES');
    doc.text(`Le present contrat sera resilie immediatement et de plein droit, sans qu'il soit besoin de faire ordonner cette resiliation en justice, dans les cas suivants :`, { align: 'justify' });
    doc.moveDown(0.5);
    doc.text(`- Deux mois apres un commandement demeure infructueux a defaut de paiement aux termes convenus de tout ou partie du loyer et des charges ou en cas de non-versement du depot de garantie eventuellement prevu au contrat ;`, { indent: 20, align: 'justify' });
    doc.text(`- Un mois apres un commandement demeure infructueux a defaut d'abonnement aux services publics (eau, electricite). Une fois acquis au bailleur le benefice de la clause resolutoire, le locataire devra liberer immediatement les lieux. Les frais, droits et honoraires des actes de procedure seront a la charge du LOCATAIRE.`, { indent: 20, align: 'justify' });
    doc.text(`- Des lors qu'une decision de justice sera passee en force de chose jugee qui constatera les troubles de voisinage et constituera le non-respect d'user paisiblement des locaux loues. En cas de conge ou de resiliation si le locataire se maintient apres l'expiration du bail, il sera redevable d'une indemnite d'occupation au moins egale au montant du dernier loyer, charges, taxes et accessoires reclames.`, { indent: 20, align: 'justify' });


    // -- INVENTORY (IF PRESENT) --
    if (contractData.inventory && Object.keys(contractData.inventory).length > 0) {
        sectionTitle('ANNEXE : LISTE DES EQUIPEMENTS');
        Object.entries(contractData.inventory).forEach(([item, status]) => {
            doc.text(`- ${item} : ${status === 'ok' ? '[OK]' : '[DEGRADE]'}`);
        });
    }

    // -- NOTES & ADDITIONAL CLAUSES --
    if (contractData.notes) {
        sectionTitle('NOTES & CLAUSES SPECIFIQUES');
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
    let ownerSigDone = false;
    if (contractData.owner_signature && typeof contractData.owner_signature === 'string') {
        // Résolution sécurisée (uploads locaux confinés + Cloudinary uniquement)
        const sigDataUri = await resolveSignatureDataUri(contractData.owner_signature);
        if (sigDataUri) {
            try {
                const base64 = sigDataUri.split(',')[1];
                doc.image(Buffer.from(base64, 'base64'), 60, signatureY + 20, { width: 100 });
                ownerSigDone = true;
            } catch (e) {
                console.error('Owner signature render error:', e);
            }
        }
    }
    if (!ownerSigDone) {
        doc.fontSize(8).fillColor('#059669').font('Helvetica-Bold').text('SIGNE ELECTRONIQUEMENT', 60, signatureY + 20);
        const ownerSignedAt = contractData.created_at ? new Date(contractData.created_at) : new Date();
        const safeOwnerId = (contractData.id || contractData.contract_number || 'CONTRAT').toString();
        doc.fillColor(textColor).font('Helvetica').fontSize(7)
            .text(`Date : ${format(ownerSignedAt, 'dd/MM/yyyy HH:mm', { locale: fr })}`, 60, signatureY + 32)
            .text(`Par le bailleur`, 60, signatureY + 41)
            .text(`ID : ${safeOwnerId.substring(0, 13).toUpperCase()}`, 60, signatureY + 50);
        doc.fontSize(6).font('Helvetica-Oblique').text('Signature electronique du bailleur integree au contrat.', 60, signatureY + 62, { width: 200 });
    }

    // Tenant Signature
    if (contractData.tenant_signed) {
        doc.fontSize(8).fillColor('#059669').font('Helvetica-Bold').text('SIGNE ELECTRONIQUEMENT', 302, signatureY + 20);
        const signedAt = contractData.tenant_signed_at ? new Date(contractData.tenant_signed_at) : new Date();
        const safeId = (contractData.id || contractData.contract_number || 'CONTRAT').toString();

        doc.fillColor(textColor).font('Helvetica').fontSize(7)
            .text(`Date : ${format(signedAt, 'dd/MM/yyyy HH:mm', { locale: fr })}`)
            .text(`IP : Trace protegee`)
            .text(`ID : ${safeId.substring(0, 13).toUpperCase()}`);

        doc.moveDown();
        doc.fontSize(6).font('Helvetica-Oblique').text('Signature electronique simple conformement aux dispositions relatives aux transactions electroniques en vigueur.', { width: 220 });
    } else {
        doc.fontSize(8).fillColor(secondaryColor).text('(En attente de signature du locataire)', 302, signatureY + 40);
    }

    // -- QR CODE & HASH --
    doc.moveDown(8);

    // Document Hash
    const rawData = `${contractData.contract_number || ''}${contractData.contract_id || contractData.id || ''}`;
    const docHash = crypto.createHash('sha256').update(rawData).digest('hex');
    doc.fontSize(7).fillColor(secondaryColor).text(`Hash de securite : ${docHash}`, 50, doc.y, { align: 'center', width: 495 });

    // QR Code
    try {
        const qrId = contractData.contract_id || contractData.id;
        if (qrId) {
            let baseUrl = process.env.FRONTEND_URL || 'https://samalocation.com';
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }
            const qrContent = `${baseUrl}/verify/contract/${qrId}`;
            const qrBuffer = await QRCode.toBuffer(qrContent);
            doc.image(qrBuffer, 247, doc.y + 10, { width: 100 });
            doc.fontSize(6).text('Scanner pour verifier l\'authenticite', 247, doc.y + 115, { width: 100, align: 'center' });
        }
    } catch (err) {
        console.error('QR rendering error', err);
    }

    doc.moveDown(4);

    // -- FOOTER & DISCLAIMER --
    doc.fontSize(7).fillColor(secondaryColor).font('Helvetica-Oblique').text('AVIS DE NON-RESPONSABILITE : Ce document est un modele genere automatiquement par Samalocation. Il a un caractere purement indicatif. Les parties sont seules responsables du contenu et de la legalite des clauses inserees. Il est recommande de faire enregistrer tout contrat de bail aupres des services fiscaux competents.', 50, doc.y + 20, { align: 'justify', width: 512 });

    doc.moveDown();
    doc.fontSize(8).fillColor(secondaryColor).font('Helvetica').text(`Document genere par la plateforme Samalocation. Version ${isPremium ? 'Premium' : 'Standard'} 2.1`, { align: 'center' });
    doc.text('(c) Samalocation - Tous droits reserves', { align: 'center' });

    return doc;
}

/**
 * Génère un PDF depuis un contenu HTML personnalisé (TipTap/Rich Editor)
 * Rendu fidèle : texte mixte inline (bold/italic/u dans les paragraphes),
 * alignement via style, tableaux, listes, et respect des styles CSS inline.
 * Corrige spécifiquement :
 *   - <li><p>...</p></li> généré par TipTap (insideLi = transparent wrapper)
 *   - <table><tbody><tr>... géré via querySelectorAll('tr')
 *   - Segments inline rendus avec continued:true pour le texte mixte
 * @param {string} htmlContent - HTML produit par TipTap
 * @param {object} meta - Métadonnées (contract_number, owner_name, tenant_name, etc.)
 * @returns {PDFDocument}
 */
function generateCustomContractPDF(htmlContent, meta = {}) {
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

    const textColor      = '#000000';
    const secondaryColor = '#666666';
    const PAGE_WIDTH     = 512;

    const { JSDOM } = require('jsdom');
    const dom  = new JSDOM(htmlContent);
    const body = dom.window.document.body;

    // ── Helper: extract a CSS property from a node's style attribute ─────────
    function getStyle(node, property) {
        const style = (node.getAttribute && node.getAttribute('style')) || '';
        const re = new RegExp(property + '\\s*:\\s*([^;]+)', 'i');
        const m = style.match(re);
        return m ? m[1].trim() : null;
    }

    // ── Helper: read text-align from a node's style attribute ────────────────
    function getAlign(node) {
        return getStyle(node, 'text-align') || 'left';
    }

    // ── Helper: convert CSS px to PDF pt (1px ≈ 0.75pt) ─────────────────────
    function cssPxToPt(val) {
        if (!val) return null;
        const m = String(val).match(/^([\d.]+)\s*px$/);
        if (m) return Math.round(parseFloat(m[1]) * 0.75);
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    }

    // ── Helper: parse CSS color to PDFKit color ──────────────────────────────
    function cssColor(raw) {
        if (!raw) return null;
        raw = raw.trim();
        if (raw.startsWith('#')) return raw;
        // rgb(r, g, b)
        const rgb = raw.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgb) {
            const r = Math.min(255, Math.max(0, parseInt(rgb[1])));
            const g = Math.min(255, Math.max(0, parseInt(rgb[2])));
            const b = Math.min(255, Math.max(0, parseInt(rgb[3])));
            return `rgb(${r},${g},${b})`;
        }
        return null;
    }

    // ── Helper: draw a thin horizontal rule ──────────────────────────────────
    function drawHR(color = '#cccccc') {
        doc.moveDown(0.3);
        doc.save().rect(50, doc.y, PAGE_WIDTH, 1).fill(color).restore();
        doc.moveDown(0.5);
    }

    // ── Collect all inline text segments from a node ──────────────────────────
    // insideLi=true : treats <p>/<div> as transparent wrappers (TipTap li>p pattern)
    // Returns [{ text, font, color, size, underline, isBreak? }]
    function collectInlineSegments(node, ctx, insideLi = false) {
        const segments = [];

        function traverse(currentNode, currentCtx) {
            // Text node
            if (currentNode.nodeType === 3) {
                let text = currentNode.textContent.replace(/\r?\n/g, ' ').replace(/\u2022/g, '-');
                if (text) {
                    segments.push({
                        text,
                        font: currentCtx.font || 'Helvetica',
                        color: currentCtx.color || textColor,
                        size: currentCtx.size || 12,
                        underline: currentCtx.underline || false
                    });
                }
                return;
            }

            if (currentNode.nodeType !== 1) return;

            const name = currentNode.nodeName.toLowerCase();

            // <br> → line break marker
            if (name === 'br') {
                segments.push({
                    text: '\n',
                    font: currentCtx.font || 'Helvetica',
                    color: currentCtx.color || textColor,
                    size: currentCtx.size || 12,
                    underline: false,
                    isBreak: true
                });
                return;
            }

            if (['script', 'style', 'meta', 'head'].includes(name)) return;

            let newCtx = { ...currentCtx };

            // Parse inline CSS styles
            const inlineColor = cssColor(getStyle(currentNode, 'color'));
            if (inlineColor) newCtx.color = inlineColor;

            const inlineSize = cssPxToPt(getStyle(currentNode, 'font-size'));
            if (inlineSize) newCtx.size = inlineSize;

            const inlineBg = cssColor(getStyle(currentNode, 'background-color'));
            if (inlineBg) newCtx.bgColor = inlineBg;

            // Apply semantic formatting
            switch (name) {
                case 'strong': case 'b':
                    newCtx.font = currentCtx.italic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold';
                    newCtx.bold = true;
                    break;
                case 'em': case 'i':
                    newCtx.font = currentCtx.bold ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique';
                    newCtx.italic = true;
                    break;
                case 'u':
                    newCtx.underline = true;
                    break;
                case 'mark':
                    if (!inlineColor) newCtx.color = '#92400e';
                    if (!inlineBg) newCtx.bgColor = '#fef3c7';
                    break;
                case 's': case 'del':
                    newCtx.strikethrough = true;
                    break;
                default:
                    break;
            }

            // Check CSS font-weight for bold
            const fw = getStyle(currentNode, 'font-weight');
            if (fw && (fw === 'bold' || fw === '700' || parseInt(fw) >= 600)) {
                newCtx.font = newCtx.italic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold';
                newCtx.bold = true;
            }

            // Check CSS text-decoration for underline
            const deco = getStyle(currentNode, 'text-decoration');
            if (deco && deco.includes('underline')) {
                newCtx.underline = true;
            }

            currentNode.childNodes.forEach(child => traverse(child, newCtx));
        }

        traverse(node, ctx);
        return segments;
    }

    // ── Render a series of inline segments to PDF ──────────────────────────────
    function renderInlineSegments(segments, align = 'left') {
        if (!segments.length) return;

        const lines = [[]];
        for (const seg of segments) {
            if (seg.isBreak) {
                lines.push([]);
            } else {
                lines[lines.length - 1].push(seg);
            }
        }

        lines.forEach((lineSegs, lineIdx) => {
            if (!lineSegs.length) {
                doc.moveDown(0.3);
                return;
            }
            lineSegs.forEach((seg, i) => {
                const isLast = i === lineSegs.length - 1;
                doc.font(seg.font)
                   .fillColor(seg.color)
                   .fontSize(seg.size)
                   .text(seg.text, { align, continued: !isLast, underline: seg.underline });
            });
            if (lineIdx < lines.length - 1) {
                doc.moveDown(0.2);
            }
        });
    }

    // ── Block renderer ───────────────────────────────────────────────────────
    function renderBlock(node) {
        if (node.nodeType === 3) {
            const text = node.textContent.replace(/\r?\n/g, ' ').trim();
            if (text) {
                doc.fillColor(textColor).fontSize(12).font('Helvetica').text(text);
                doc.moveDown(0.4);
            }
            return;
        }

        if (node.nodeType !== 1) return;

        const name = node.nodeName.toLowerCase();

        switch (name) {
            // ── Headings ──────────────────────────────────────────────────────
            case 'h1': {
                const align = getAlign(node);
                const segments = collectInlineSegments(node, { font: 'Helvetica-Bold', size: 22, color: '#000000' });
                doc.moveDown(0.4);
                renderInlineSegments(segments, align);
                doc.moveDown(0.3);
                break;
            }
            case 'h2': {
                const align = getAlign(node);
                const segments = collectInlineSegments(node, { font: 'Helvetica-Bold', size: 16, color: '#000000' });
                doc.moveDown(0.3);
                renderInlineSegments(segments, align);
                doc.moveDown(0.2);
                break;
            }
            case 'h3': {
                const align = getAlign(node);
                const segments = collectInlineSegments(node, { font: 'Helvetica-Bold', size: 13, color: '#000000' });
                doc.moveDown(0.2);
                renderInlineSegments(segments, align);
                doc.moveDown(0.15);
                break;
            }
            case 'h4': {
                const align = getAlign(node);
                const segments = collectInlineSegments(node, { font: 'Helvetica-Bold', size: 12, color: '#000000' });
                doc.moveDown(0.15);
                renderInlineSegments(segments, align);
                doc.moveDown(0.1);
                break;
            }

            // ── Paragraph ─────────────────────────────────────────────────────
            case 'p': {
                const align = getAlign(node);
                const segments = collectInlineSegments(node, { font: 'Helvetica', size: 12, color: textColor });
                if (segments.length === 0) {
                    doc.moveDown(0.2);
                    break;
                }
                renderInlineSegments(segments, align);
                doc.moveDown(0.3);
                break;
            }

            // ── Div / span → recurse ───────────────────────────────────────────
            case 'div':
            case 'span': {
                node.childNodes.forEach(child => renderBlock(child));
                break;
            }

            // ── Horizontal rule ───────────────────────────────────────────────
            case 'hr':
                drawHR('#cccccc');
                break;

            // ── Hard line break ───────────────────────────────────────────────
            case 'br':
                doc.moveDown(0.2);
                break;

            // ── Unordered list ────────────────────────────────────────────────
            case 'ul': {
                node.childNodes.forEach(child => {
                    if (child.nodeName && child.nodeName.toLowerCase() === 'li') {
                        const segments = collectInlineSegments(child, { font: 'Helvetica', size: 12, color: textColor }, true);
                        const fullText = segments.map(s => s.text).join('').trim();
                        const isSectionHeader = /^\d+\.\s/.test(fullText);
                        if (isSectionHeader) {
                            renderInlineSegments(segments, 'left');
                        } else {
                            doc.font('Helvetica').fillColor(textColor).fontSize(12)
                               .text('-  ', { indent: 20, continued: true });
                            if (segments.length > 0) {
                                segments.forEach((seg, i) => {
                                    const isLast = i === segments.length - 1;
                                    doc.font(seg.font).fillColor(seg.color).fontSize(seg.size)
                                       .text(seg.text, { continued: !isLast, underline: seg.underline });
                                });
                            } else {
                                doc.text('');
                            }
                        }
                        doc.moveDown(0.15);
                    }
                });
                doc.moveDown(0.3);
                break;
            }

            // ── Ordered list ──────────────────────────────────────────────────
            case 'ol': {
                let idx = 1;
                node.childNodes.forEach(child => {
                    if (child.nodeName && child.nodeName.toLowerCase() === 'li') {
                        const segments = collectInlineSegments(child, { font: 'Helvetica', size: 12, color: textColor }, true);
                        doc.font('Helvetica').fillColor(textColor).fontSize(12)
                           .text(`${idx}.  `, { indent: 20, continued: true });
                        if (segments.length > 0) {
                            segments.forEach((seg, i) => {
                                const isLast = i === segments.length - 1;
                                doc.font(seg.font).fillColor(seg.color).fontSize(seg.size)
                                   .text(seg.text, { continued: !isLast, underline: seg.underline });
                            });
                        } else {
                            doc.text('');
                        }
                        doc.moveDown(0.15);
                        idx++;
                    }
                });
                doc.moveDown(0.3);
                break;
            }

            // ── Table ─────────────────────────────────────────────────────────
            case 'table': {
                const rows = [];
                node.querySelectorAll('tr').forEach(tr => {
                    const cells = [];
                    tr.querySelectorAll('th, td').forEach(td => {
                        const isHeader = td.nodeName.toLowerCase() === 'th';
                        const align = getAlign(td);
                        const segs = collectInlineSegments(td, {
                            font: isHeader ? 'Helvetica-Bold' : 'Helvetica',
                            size: 10,
                            color: '#000000'
                        }, true);
                        const text = segs.map(s => s.text).join('').trim();
                        cells.push({ text, isHeader, align });
                    });
                    if (cells.length) rows.push(cells);
                });

                if (!rows.length) break;

                const colCount  = Math.max(...rows.map(r => r.length));
                const colWidth  = PAGE_WIDTH / colCount;
                const rowHeight = 28;
                const startX    = 50;

                doc.moveDown(0.5);

                rows.forEach((row, ri) => {
                    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                    }
                    const y = doc.y;
                    row.forEach((cell, ci) => {
                        const x       = startX + ci * colWidth;
                        const bgColor = cell.isHeader ? '#e0e0e0' : (ri % 2 === 0 ? '#fafafa' : '#ffffff');
                        doc.save().rect(x, y, colWidth, rowHeight).fill(bgColor).stroke('#d0d0d0').restore();
                        doc.fillColor('#000000')
                           .fontSize(cell.isHeader ? 10 : 10)
                           .font(cell.isHeader ? 'Helvetica-Bold' : 'Helvetica')
                           .text(cell.text, x + 4, y + 6, {
                               width: colWidth - 8,
                               height: rowHeight - 4,
                               ellipsis: true,
                               lineBreak: false,
                               align: cell.align || 'left'
                           });
                    });
                    doc.y = y + rowHeight;
                });

                doc.moveDown(0.5);
                break;
            }

            case 'tbody': case 'thead': case 'tfoot':
                break;

            case 'head': case 'script': case 'style': case 'meta':
                break;

            default:
                node.childNodes.forEach(child => renderBlock(child));
        }
    }

    // ── Page header ──────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(secondaryColor).font('Helvetica')
       .text(
           `Contrat n° : ${meta.contract_number || ''}  |  ${meta.owner_name || ''} - ${meta.tenant_name || ''}`,
           { align: 'right' }
       );
    doc.moveDown(0.5);
    drawHR('#cccccc');

    // ── Render HTML body ──────────────────────────────────────────────────────
    body.childNodes.forEach(node => renderBlock(node));

    // ── Page footer ───────────────────────────────────────────────────────────
    doc.moveDown(3);
    drawHR('#d0d0d0');
    doc.fontSize(8).fillColor(secondaryColor).font('Helvetica')
       .text('Document genere par la plateforme Samalocation. Modele personnalise.', { align: 'center' });
    doc.text('(c) Samalocation - Tous droits reserves', { align: 'center' });

    return doc;
}

// ── Shared Puppeteer Browser Singleton (Fast Reuse) ───────────────────
let cachedBrowser = null;
let browserInitializing = null;

async function getSharedBrowser() {
    if (cachedBrowser && cachedBrowser.connected) {
        return cachedBrowser;
    }
    if (browserInitializing) {
        return await browserInitializing;
    }
    const puppeteer = require('puppeteer');
    browserInitializing = (async () => {
        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote'
                ]
            });
            browser.on('disconnected', () => {
                cachedBrowser = null;
                browserInitializing = null;
            });
            cachedBrowser = browser;
            return browser;
        } catch (err) {
            cachedBrowser = null;
            throw err;
        } finally {
            browserInitializing = null;
        }
    })();
    return await browserInitializing;
}

/**
 * Génère un PDF depuis un contenu HTML personnalisé (TipTap/Rich Editor)
 * en utilisant Puppeteer (Chrome headless) optimisé pour un rendu instantané.
 * @param {string} htmlContent - HTML produit par TipTap
 * @param {object} meta - Métadonnées (contract_number, owner_name, tenant_name, etc.)
 * @returns {Promise<Buffer>} Buffer du PDF
 */
async function generateCustomContractPDFWithBrowser(htmlContent, meta = {}) {
    // ── Generate QR code as data URI ──
    let qrDataUri = '';
    try {
        const qrId = meta.contract_id || meta.id;
        if (qrId) {
            let baseUrl = process.env.FRONTEND_URL || 'https://samalocation.com';
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            qrDataUri = await QRCode.toDataURL(`${baseUrl}/verify/contract/${qrId}`);
        }
    } catch (err) {
        console.error('QR generation error:', err);
    }

    // ── Document hash ──
    const rawData = `${meta.contract_number || ''}${meta.contract_id || meta.id || ''}`;
    const docHash = crypto.createHash('sha256').update(rawData).digest('hex');

    // ── Owner signature block ──
    let ownerSignatureHtml = '';
    const ownerSignedDate = meta.created_at ? format(new Date(meta.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '';
    const safeOwnerId = (meta.id || meta.contract_number || 'CONTRAT').toString().substring(0, 13).toUpperCase();

    const ownerSigDataUri = await resolveSignatureDataUri(meta.owner_signature);

    if (ownerSigDataUri) {
        ownerSignatureHtml = `<img src="${ownerSigDataUri}" alt="Signature Bailleur" style="max-height: 75px; max-width: 220px; display: block; margin: 0 auto;" />`;
    } else {
        ownerSignatureHtml = `
            <p style="color: #059669; font-weight: bold; font-size: 11pt; margin: 0 0 4px 0;">SIGNE ELECTRONIQUEMENT</p>
            ${ownerSignedDate ? `<p style="font-size: 9pt; margin: 2px 0;">Date : ${ownerSignedDate}</p>` : ''}
            <p style="font-size: 9pt; margin: 2px 0;">Par le bailleur : ${escapeHtml(meta.owner_name || '')}</p>
            <p style="font-size: 9pt; margin: 2px 0;">ID : ${safeOwnerId}</p>
            <p style="font-size: 8pt; font-style: italic; color: #666; margin-top: 4px;">Signature electronique du bailleur integree au contrat.</p>
        `.trim();
    }

    // ── Tenant signature block ──
    let tenantSignatureHtml = '<p style="color: #999; font-style: italic; margin: 0;">(En attente de signature du locataire)</p>';
    if (meta.tenant_signed) {
        const signedAt = meta.tenant_signed_at ? new Date(meta.tenant_signed_at) : new Date();
        const day = String(signedAt.getDate()).padStart(2, '0');
        const month = String(signedAt.getMonth() + 1).padStart(2, '0');
        const year = signedAt.getFullYear();
        const hours = String(signedAt.getHours()).padStart(2, '0');
        const minutes = String(signedAt.getMinutes()).padStart(2, '0');
        const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
        const safeId = (meta.id || meta.contract_number || 'CONTRAT').toString().substring(0, 13).toUpperCase();

        tenantSignatureHtml = `
            <p style="color: #059669; font-weight: bold; font-size: 11pt; margin: 0 0 4px 0;">SIGNE ELECTRONIQUEMENT</p>
            <p style="font-size: 9pt; margin: 2px 0;">Date : ${formattedDate}</p>
            <p style="font-size: 9pt; margin: 2px 0;">IP : Trace protegee</p>
            <p style="font-size: 9pt; margin: 2px 0;">ID : ${safeId}</p>
            <p style="font-size: 8pt; font-style: italic; color: #666; margin-top: 4px;">Signature electronique simple conformement aux dispositions relatives aux transactions electroniques en vigueur.</p>
        `.trim();
    }

    // ── Establishment date ──
    let establishedDate = '';
    try {
        if (meta.created_at) {
            establishedDate = format(new Date(meta.created_at), 'dd MMMM yyyy', { locale: fr });
        } else if (meta.start_date) {
            establishedDate = format(new Date(meta.start_date), 'dd MMMM yyyy', { locale: fr });
        }
    } catch (e) {
        establishedDate = '';
    }

    const contractIdDisplay = (meta.contract_id || meta.id || '').toString();

    const signaturePageHtml = `
<div class="signature-page">
  <h2 style="text-align: center; margin-bottom: 24px;">SIGNATURES</h2>

  <div style="text-align: center; font-size: 10pt; color: #333; margin-bottom: 24px;">
    Contrat n° <strong>${escapeHtml(meta.contract_number || '')}</strong>
    ${contractIdDisplay ? `&mdash; ID : <strong>${escapeHtml(contractIdDisplay.substring(0, 13).toUpperCase())}</strong>` : ''}
    ${establishedDate ? `&mdash; Fait le <strong>${escapeHtml(establishedDate)}</strong>` : ''}
  </div>

  <div style="display: flex; gap: 40px; justify-content: center;">
    <div style="flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 16px; text-align: center; min-height: 160px;">
      <div style="font-weight: bold; font-size: 11pt; margin-bottom: 12px; text-align: center;">LE BAILLEUR</div>
      <div style="min-height: 80px; display: flex; align-items: center; justify-content: center;">
        ${ownerSignatureHtml}
      </div>
      <div style="margin-top: 12px; font-size: 10pt; border-top: 1px solid #eee; padding-top: 8px;">
        ${escapeHtml(meta.owner_name || '')}
      </div>
    </div>
    <div style="flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 16px; text-align: center; min-height: 160px;">
      <div style="font-weight: bold; font-size: 11pt; margin-bottom: 12px; text-align: center;">LE LOCATAIRE</div>
      <div style="min-height: 80px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        ${tenantSignatureHtml}
      </div>
      <div style="margin-top: 12px; font-size: 10pt; border-top: 1px solid #eee; padding-top: 8px;">
        ${escapeHtml(meta.tenant_name || '')}
      </div>
    </div>
  </div>

  <div style="margin-top: 32px; text-align: center; font-size: 9pt; color: #666; word-break: break-all;">
    <strong>Hash de securite :</strong> ${docHash}
  </div>

  ${qrDataUri ? `
  <div style="text-align: center; margin-top: 16px;">
    <img src="${qrDataUri}" alt="QR Code" style="width: 120px; height: 120px;" />
    <p style="font-size: 8pt; color: #666; margin-top: 4px;">Scanner pour verifier l'authenticite</p>
  </div>` : ''}

  <div style="margin-top: 32px; font-size: 8pt; color: #666; font-style: italic; text-align: justify; line-height: 1.4;">
    AVIS DE NON-RESPONSABILITE : Ce document est un modele genere automatiquement par Samalocation. Il a un caractere purement indicatif. Les parties sont seules responsables du contenu et de la legalite des clauses inserees. Il est recommande de faire enregistrer tout contrat de bail aupres des services fiscaux competents.
  </div>

  <div style="margin-top: 16px; text-align: center; font-size: 8pt; color: #666; border-top: 1px solid #ccc; padding-top: 12px;">
    Document genere par la plateforme Samalocation. Modele personnalise.<br>
    &copy; Samalocation - Tous droits reserves
  </div>
</div>`;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {
    margin: 40px 50px;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    margin: 0;
    padding: 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .header {
    font-size: 9pt;
    color: #666;
    text-align: right;
    border-bottom: 1px solid #ccc;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  h1 { font-size: 22pt; font-weight: bold; margin: 16px 0 8px 0; }
  h2 { font-size: 16pt; font-weight: bold; margin: 12px 0 6px 0; }
  h3 { font-size: 13pt; font-weight: bold; margin: 10px 0 4px 0; }
  h4 { font-size: 12pt; font-weight: bold; margin: 8px 0 4px 0; }
  p { margin: 0 0 6px 0; }
  ul, ol { list-style: none; margin: 4px 0 8px 0; padding-left: 0; }
  li { margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #eee; font-weight: bold; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  .signature-page {
    page-break-before: always;
    padding-top: 20px;
  }
</style>
</head>
<body>
  <div class="header">
    Contrat n&deg; : ${escapeHtml(meta.contract_number || '')} | ${escapeHtml(meta.owner_name || '')} - ${escapeHtml(meta.tenant_name || '')}
  </div>
  ${htmlContent}
  ${signaturePageHtml}
</body>
</html>`;

    try {
        const browser = await getSharedBrowser();
        const page = await browser.newPage();
        try {
            // Sécurité (anti-SSRF) : le HTML vient de l'utilisateur. Pas de JavaScript, et aucune
            // requête réseau hormis les data: URIs et les images Cloudinary.
            await page.setJavaScriptEnabled(false);
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                const url = request.url();
                const isAllowed = url.startsWith('data:')
                    || url === 'about:blank'
                    || (url.startsWith('https://res.cloudinary.com/') && request.resourceType() === 'image');
                if (isAllowed) {
                    request.continue();
                } else {
                    console.warn(`[PDF] Requête bloquée pendant le rendu du contrat : ${url.substring(0, 200)}`);
                    request.abort();
                }
            });
            await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
            const buffer = await page.pdf({
                format: 'A4',
                margin: { top: '40px', bottom: '40px', left: '50px', right: '50px' },
                printBackground: true
            });
            return buffer;
        } finally {
            await page.close();
        }
    } catch (browserErr) {
        console.warn('Browser PDF rendering unavailable, using fallback renderer:', browserErr.message);
        const doc = generateCustomContractPDF(htmlContent, meta);
        return new Promise((resolve, reject) => {
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.end();
        });
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

module.exports = { generateContractPDF, generateCustomContractPDF, generateCustomContractPDFWithBrowser };
