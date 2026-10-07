// Liste les textes affichés à l'utilisateur qui ne passent pas par t() (textes JSX, attributs
// comme placeholder/title/alt, messages de toast…).
// Usage : npm run i18n:scan                 → résumé par fichier
//         npm run i18n:scan -- src/pages/X.tsx  → détail ligne par ligne des fichiers donnés
import ts from "typescript";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_ATTRIBUTES = new Set(["title", "placeholder", "alt", "aria-label", "label", "description", "tooltip", "emptyMessage"]);
const MESSAGE_PROPERTIES = new Set(["title", "description", "message", "label", "placeholder", "text"]);

// Texte "humain" : au moins une lettre, et soit un espace, soit un accent, soit un mot capitalisé
const looksHuman = (s) => {
    const t = s.trim();
    if (t.length < 2 || !/\p{L}/u.test(t)) return false;
    if (/^(https?:|\/|#|\.|@|[\w-]+\.(png|jpe?g|svg|webp|pdf)$)/i.test(t)) return false;
    if (/^[a-z0-9_.-]+$/.test(t)) return false;              // identifiants, clés, classes
    if (/^[A-Z0-9_]+$/.test(t) && t.length < 4) return false; // sigles courts
    return /\s/.test(t) || /[À-ÿ]/.test(t) || /^[A-ZÀ-Ý][a-zà-ÿ]/.test(t);
};

// Nom de marque et textes techniques qui ne se traduisent pas
const IGNORED = new Set(["Samalocation", "Logo", "WhatsApp", "PayDunya", "Wave", "Orange Money"]);

// Littéral qui n'est pas affiché : comparaison (e.key === "Enter") ou valeur de repli t('x') || "Texte"
const isNotDisplayed = (node) => {
    const p = node.parent;
    if (!ts.isBinaryExpression(p)) return false;
    const op = p.operatorToken.kind;
    if ([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
         ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(op)) return true;
    if ([ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(op) && p.right === node) {
        return ts.isCallExpression(p.left) && /(^|\.)t$/.test(p.left.expression.getText());
    }
    return false;
};

const isInsideTCall = (node) => {
    for (let n = node.parent; n; n = n.parent) {
        if (ts.isCallExpression(n)) {
            const name = n.expression.getText();
            if (/(^|\.)t$/.test(name) || name === "i18n.t") return true;
        }
        if (ts.isJsxAttribute(n) && n.name.getText() === "className") return true;
    }
    return false;
};

const scanFile = (file) => {
    const src = readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found = [];
    const add = (node, text) => {
        const clean = text.trim().replace(/\s+/g, " ");
        if (!IGNORED.has(clean)) found.push({ line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, text: clean });
    };

    const visit = (node) => {
        if (ts.isJsxText(node) && looksHuman(node.text)) add(node, node.text);
        else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && looksHuman(node.text) && !isInsideTCall(node) && !isNotDisplayed(node)) {
            const p = node.parent;
            const inJsxAttr = ts.isJsxAttribute(p) && TEXT_ATTRIBUTES.has(p.name.getText());
            const inJsxExpr = ts.isJsxExpression(p) || (ts.isConditionalExpression(p) && ts.isJsxExpression(p.parent)) || ts.isBinaryExpression(p);
            const inMessageProp = ts.isPropertyAssignment(p) && MESSAGE_PROPERTIES.has(p.name.getText());
            const inCall = ts.isCallExpression(p) && /toast|alert|confirm|Error/.test(p.expression.getText());
            const inNew = ts.isNewExpression(p) && /Error/.test(p.expression.getText());
            if (inJsxAttr || inJsxExpr || inMessageProp || inCall || inNew) add(node, node.text);
        } else if (ts.isTemplateExpression(node) && !isInsideTCall(node) && looksHuman(node.head.text + node.templateSpans.map(s => s.literal.text).join(" "))) {
            const p = node.parent;
            if (ts.isJsxExpression(p) || ts.isPropertyAssignment(p) || ts.isCallExpression(p)) add(node, node.getText());
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return found;
};

const walk = (dir) => readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "ui" ? [] : walk(p); // composants shadcn génériques
    return /\.tsx$/.test(name) ? [p] : [];
});

const args = process.argv.slice(2);
if (args.length) {
    for (const f of args) {
        const items = scanFile(join(root, f));
        console.log(`\n${f} — ${items.length} texte(s)`);
        for (const i of items) console.log(`  ${i.line}: ${i.text}`);
    }
} else {
    const rows = walk(join(root, "src")).map(f => ({ f: relative(root, f).replace(/\\/g, "/"), n: scanFile(f).length })).filter(r => r.n > 0).sort((a, b) => b.n - a.n);
    for (const r of rows) console.log(String(r.n).padStart(5), r.f);
    console.log(`\n${rows.reduce((s, r) => s + r.n, 0)} textes non traduits dans ${rows.length} fichiers.`);
}
