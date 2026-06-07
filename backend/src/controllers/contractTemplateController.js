const ContractTemplate = require('../models/contractTemplateModel');
const response = require('../utils/response');
const multer = require('multer');

// Multer en mémoire pour l'extraction de document
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF et Word (.docx) sont acceptés.'));
        }
    }
});

const contractTemplateController = {
    // GET /api/contract-templates
    async list(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const templates = await ContractTemplate.findByOwnerId(ownerId);
            return response.success(res, templates, 'Modèles récupérés avec succès.');
        } catch (error) {
            next(error);
        }
    },

    // POST /api/contract-templates
    async create(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const { title, content } = req.body;

            if (!title || !content) {
                return response.error(res, 'Le titre et le contenu sont requis.', 400);
            }

            const template = await ContractTemplate.create(ownerId, title, content);
            return response.success(res, template, 'Modèle créé avec succès.', 201);
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/contract-templates/:id
    async update(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const { id } = req.params;
            const { title, content } = req.body;

            if (!title || !content) {
                return response.error(res, 'Le titre et le contenu sont requis.', 400);
            }

            const template = await ContractTemplate.update(id, ownerId, title, content);
            if (!template) {
                return response.error(res, 'Modèle introuvable ou non autorisé.', 404);
            }
            return response.success(res, template, 'Modèle mis à jour avec succès.');
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/contract-templates/:id
    async delete(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const { id } = req.params;

            const deleted = await ContractTemplate.delete(id, ownerId);
            if (!deleted) {
                return response.error(res, 'Modèle introuvable ou non autorisé.', 404);
            }
            return response.success(res, null, 'Modèle supprimé avec succès.');
        } catch (error) {
            next(error);
        }
    },

    // POST /api/contract-templates/extract — Extraire le texte d'un PDF ou DOCX
    uploadMiddleware: upload.single('document'),

    async extractDocument(req, res, next) {
        try {
            if (!req.file) {
                return response.error(res, 'Aucun fichier fourni.', 400);
            }

            const { mimetype, buffer } = req.file;
            let extractedText = '';

            let htmlContent = '';

            if (mimetype === 'application/pdf') {
                // Extraction PDF — avec mise en forme (gras, titres, etc.)
                const { pdfToHtml } = require('../utils/pdfToHtml');
                const html = await pdfToHtml(buffer);
                if (html) {
                    htmlContent = html;
                    extractedText = html.replace(/<[^>]+>/g, '');
                } else {
                    // Fallback : texte brut
                    const { PDFParse } = require('pdf-parse');
                    const parser = new PDFParse({ data: buffer });
                    const result = await parser.getText();
                    extractedText = result.text;
                    htmlContent = extractedText
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => `<p>${line.trim()}</p>`)
                        .join('\n');
                }
            } else {
                // Extraction DOCX (Word) — avec mise en forme (gras, tableaux, listes, etc.)
                const mammoth = require('mammoth');
                const result = await mammoth.convertToHtml({ buffer });
                let html = result.value;

                console.log('[MAMMOTH OUTPUT]', html.substring(0, 3000));

                // ── Extraire et vérifier tous les tableaux : mammoth peut ignorer des lignes vides ──
                let xmlDoc = null;
                let NSw = null;
                try {
                    const AdmZip = require('adm-zip');
                    const zipEntry = new AdmZip(buffer).getEntry('word/document.xml');
                    const xmlStr = zipEntry ? zipEntry.getData().toString('utf8') : null;
                    if (xmlStr) {
                        const { JSDOM } = require('jsdom');
                        const dom = new JSDOM(xmlStr, { contentType: 'text/xml' });
                        xmlDoc = dom.window.document;
                        NSw = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
                    }
                } catch (e) {
                    console.error('[XML PARSE ERROR]', e.message);
                }

                if (xmlDoc) {
                    // Extraire les tables HTML de mammoth
                    const htmlTables = [];
                    let processedHtml = html.replace(/<table[\s>][\s\S]*?<\/table>/gi, (m) => {
                        htmlTables.push(m);
                        return '\x00TABLE\x00';
                    });

                    const xmlTables = Array.from(xmlDoc.getElementsByTagNameNS(NSw, 'tbl'));
                    console.log(`[MAMMOTH] ${htmlTables.length} table(s) in HTML, ${xmlTables.length} table(s) in XML`);

                    const total = Math.max(htmlTables.length, xmlTables.length);
                    const rebuilt = [];

                    for (let i = 0; i < total; i++) {
                        const xmlTbl = i < xmlTables.length ? xmlTables[i] : null;
                        const htmlTbl = i < htmlTables.length ? htmlTables[i] : null;

                        if (!xmlTbl) { rebuilt.push(htmlTbl || ''); continue; }

                        const xmlRows = Array.from(xmlTbl.getElementsByTagNameNS(NSw, 'tr'));
                        const htmlRowCount = htmlTbl ? (htmlTbl.match(/<tr/gi) || []).length : 0;

                        // Log détaillé de chaque table
                        const htmlCellCount = htmlTbl ? (htmlTbl.match(/<t[dh]/gi) || []).length : 0;
                        const xmlCellCount = xmlRows.reduce((sum, row) => sum + row.getElementsByTagNameNS(NSw, 'tc').length, 0);
                        console.log(`[TABLE #${i+1}] XML: ${xmlRows.length} rows, ${xmlCellCount} cells | HTML: ${htmlRowCount} rows, ${htmlCellCount} cells`);
                        console.log(`[TABLE #${i+1}] htmlTbl exists: ${!!htmlTbl}`);

                        // Si la table n'existe pas en HTML ou si mammoth a moins de lignes/cellules → reconstruire depuis le XML
                        if (!htmlTbl || htmlRowCount < xmlRows.length || htmlCellCount < xmlCellCount) {
                            let rebuiltHtml = '<table><tbody>';
                            for (const row of xmlRows) {
                                const cells = row.getElementsByTagNameNS(NSw, 'tc');
                                rebuiltHtml += '<tr>';
                                for (const cell of Array.from(cells)) {
                                    const gridSpan = cell.getAttributeNS(NSw, 'gridSpan');
                                    const spanAttr = gridSpan ? ` colspan="${gridSpan}"` : '';
                                    // Extraire le texte du XML
                                    let cellText = '';
                                    const textEls = cell.getElementsByTagNameNS(NSw, 't');
                                    for (const t of Array.from(textEls)) {
                                        cellText += t.textContent;
                                    }
                                    const safe = cellText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                    rebuiltHtml += `<td${spanAttr}><p>${safe || '<br>'}</p></td>`;
                                }
                                rebuiltHtml += '</tr>';
                            }
                            rebuiltHtml += '</tbody></table>';
                            rebuilt.push(rebuiltHtml);
                            console.log(`[MAMMOTH] Rebuilt table #${i+1}: ${xmlRows.length} rows (HTML had ${htmlRowCount})`);
                        } else {
                            rebuilt.push(htmlTbl);
                        }
                    }

                    console.log(`[REBUILT] Total rebuilt: ${rebuilt.length}, HTML placeholders: ${(processedHtml.match(/\x00TABLE\x00/g) || []).length}`);

                    // Réinsérer les tables dans le HTML
                    let builtIndex = 0;
                    processedHtml = processedHtml.replace(/\x00TABLE\x00/g, () => {
                        if (builtIndex < rebuilt.length) {
                            console.log(`[REPLACING PLACEHOLDER] index ${builtIndex}`);
                            return rebuilt[builtIndex++];
                        }
                        return '\x00TABLE\x00';
                    });

                    // Ajouter les tables reconstruites qui n'avaient pas de placeholder
                    console.log(`[REMAINING TABLES] ${rebuilt.length - builtIndex} tables without placeholder`);
                    while (builtIndex < rebuilt.length) {
                        if (rebuilt[builtIndex]) {
                            console.log(`[APPENDING TABLE] index ${builtIndex}`);
                            processedHtml += rebuilt[builtIndex];
                        }
                        builtIndex++;
                    }
                    html = processedHtml;
                }

                // 1. Assurer que les cellules vides ne soient pas supprimées par TipTap
                html = html
                    .replace(/<td>\s*<\/td>/gi, '<td><p><br></p></td>')
                    .replace(/<th>\s*<\/th>/gi, '<th><p><br></p></th>');

                // 2. Convertir les espacements (margin) en <p><br></p> pour que TipTap les conserve
                html = html.replace(/<p([^>]*)style="([^"]*)"([^>]*)>/gi, (match, before, style, after) => {
                    let spacingBefore = '';
                    let spacingAfter = '';

                    const mt = style.match(/margin-top\s*:\s*([\d.]+)(pt|px)/i);
                    if (mt) {
                        const px = mt[2] === 'pt' ? parseFloat(mt[1]) * 1.333 : parseFloat(mt[1]);
                        if (px > 4) {
                            const count = Math.min(3, Math.max(1, Math.round(px / 12)));
                            for (let i = 0; i < count; i++) spacingBefore += '<p><br></p>';
                        }
                    }

                    const mb = style.match(/margin-bottom\s*:\s*([\d.]+)(pt|px)/i);
                    if (mb) {
                        const px = mb[2] === 'pt' ? parseFloat(mb[1]) * 1.333 : parseFloat(mb[1]);
                        if (px > 4) {
                            const count = Math.min(3, Math.max(1, Math.round(px / 12)));
                            for (let i = 0; i < count; i++) spacingAfter += '<p><br></p>';
                        }
                    }

                    const cleanTag = `<p${before}${after}>`;
                    return spacingBefore + cleanTag + spacingAfter;
                });

                // 3. Nettoyer les attributs style restants
                html = html.replace(/\s+style\s*=\s*""/gi, '');
                html = html.replace(/\s+style\s*=\s*"[^"]*"/gi, '');

                htmlContent = html;
                extractedText = result.value.replace(/<[^>]+>/g, '');
            }

            return response.success(res, { html: htmlContent, raw: extractedText }, 'Texte extrait avec succès.');
        } catch (error) {
            console.error('[ContractTemplate] Extraction error:', error.message);
            next(error);
        }
    }
};

module.exports = contractTemplateController;
