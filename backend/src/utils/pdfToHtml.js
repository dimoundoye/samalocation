let pdfjs = null;
async function getPdfjs() {
    if (!pdfjs) {
        const { DOMMatrix } = require('canvas');
        globalThis.DOMMatrix = DOMMatrix;
        const mod = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs = mod.getDocument ? mod : mod.default;
    }
    return pdfjs;
}

function round(n, step = 0.1) {
    return Math.round(n / step) * step;
}

// ─── PROFIL DE POLICE GLOBAL ────────────────────────────────
// Analyse toutes les pages pour déterminer body font et bold fonts

function buildFontProfile(pages) {
    const usage = {};
    for (const content of pages) {
        for (const item of content.items) {
            const fn = item.fontName;
            if (!fn || !item.height) continue;
            if (!usage[fn]) usage[fn] = { heights: [], count: 0 };
            usage[fn].heights.push(item.height);
            usage[fn].count++;
        }
    }
    let bodyFont = null, maxCount = 0, bodyAvg = 10;
    for (const [fn, u] of Object.entries(usage)) {
        if (u.count > maxCount) { maxCount = u.count; bodyFont = fn; }
    }
    if (bodyFont) {
        bodyAvg = usage[bodyFont].heights.reduce((a, b) => a + b, 0) / usage[bodyFont].heights.length;
    }
    const boldFonts = new Set();
    for (const [fn, u] of Object.entries(usage)) {
        if (fn === bodyFont) continue;
        const avg = u.heights.reduce((a, b) => a + b, 0) / u.heights.length;
        if (avg > bodyAvg * 1.15) boldFonts.add(fn);
    }
    return { boldFonts, bodySize: bodyAvg };
}

// ─── GROUPEMENT EN LIGNES ───────────────────────────────────

function groupByLines(items) {
    const lines = [];
    let currentY = null, currentLine = [];
    const sorted = [...items]
        .filter(i => i.str.trim() && i.height > 0)
        .sort((a, b) => {
            const yd = round(b.transform[5]) - round(a.transform[5]);
            if (Math.abs(yd) > 1) return yd;
            return a.transform[4] - b.transform[4];
        });
    for (const item of sorted) {
        const y = round(item.transform[5]);
        if (currentY === null) currentY = y;
        if (Math.abs(y - currentY) > 3) {
            if (currentLine.length) lines.push({ y: currentY, items: currentLine });
            currentLine = [item]; currentY = y;
        } else {
            currentLine.push(item);
        }
    }
    if (currentLine.length) lines.push({ y: currentY, items: currentLine });
    return lines;
}

// ─── STYLE PAR LIGNE ────────────────────────────────────────

function getLineStyle(items, boldFonts) {
    let boldCount = 0, totalSize = 0;
    for (const item of items) {
        if (boldFonts.has(item.fontName)) boldCount++;
        totalSize += item.height || 12;
    }
    return { bold: boldCount > items.length * 0.6, fontSize: items.length ? totalSize / items.length : 12 };
}

// ─── GÉNÉRATION HTML ────────────────────────────────────────

function buildHtmlFromLines(lines, boldFonts, bodySize) {
    const parts = [];
    let paraLines = [];

    function flushPara() {
        if (!paraLines.length) return;
        const partsInner = paraLines.map((l, idx) => {
            let txt = l.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (l.bold) txt = '<strong>' + txt + '</strong>';
            return txt + (idx < paraLines.length - 1 ? ' ' : '');
        });
        const inner = partsInner.join('').replace(/\s+/g, ' ').trim();
        if (!inner) { paraLines = []; return; }

        const relSize = paraLines[0].fontSize / bodySize;
        let tag = 'p';
        if (relSize > 1.8) tag = 'h1';
        else if (relSize > 1.4) tag = 'h2';
        else if (relSize > 1.15) tag = 'h3';

        parts.push('<' + tag + '>' + inner + '</' + tag + '>');
        paraLines = [];
    }

    for (let i = 0; i < lines.length; i++) {
        const items = lines[i].items;
        const text = items.map((it, idx, arr) => {
            if (idx === 0) return it.str;
            const prev = arr[idx - 1];
            const gap = it.transform[4] - (prev.transform[4] + (prev.width || 0));
            return (gap > 1 ? ' ' : '') + it.str;
        }).join('').replace(/\s+/g, ' ').trim();
        if (!text) { flushPara(); continue; }

        const style = getLineStyle(items, boldFonts);
        const nextY = (i + 1 < lines.length) ? lines[i + 1].y : (lines[i].y - 999);
        const gap = Math.abs(lines[i].y - nextY);
        const isNewPara = gap > style.fontSize * 1.5;

        if (paraLines.length) {
            const prevBold = paraLines[paraLines.length - 1].bold;
            if (prevBold !== style.bold) flushPara();
        }
        if (isNewPara) flushPara();
        paraLines.push({ text, bold: style.bold, fontSize: style.fontSize });
    }
    flushPara();
    return parts.join('\n');
}

// ─── API PUBLIQUE ────────────────────────────────────────────

async function pdfToHtml(buffer) {
    try {
        const pdfjsLib = await getPdfjs();
        const data = Uint8Array.from(buffer);
        const doc = await pdfjsLib.getDocument({
            data,
            standardFontDataUrl: require('path').resolve(
                require.resolve('pdfjs-dist/package.json'),
                '../standard_fonts/'
            ).replace(/\\/g, '/') + '/',
        }).promise;

        // PASS 1 : collecter tout le contenu (profil global)
        const pages = [];
        for (let i = 1; i <= Math.min(doc.numPages, 50); i++) {
            const page = await doc.getPage(i);
            pages.push(await page.getTextContent());
        }

        const { boldFonts, bodySize } = buildFontProfile(pages);

        // PASS 2 : lignes
        let allLines = [];
        for (const content of pages) allLines.push(...groupByLines(content.items));

        return buildHtmlFromLines(allLines, boldFonts, bodySize);
    } catch (e) {
        console.error('[PDF->HTML ERROR]', e.message);
        return null;
    }
}

module.exports = { pdfToHtml };
