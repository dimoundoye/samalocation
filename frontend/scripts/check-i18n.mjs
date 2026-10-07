// Vérifie que toutes les langues ont exactement les mêmes clés que le français (langue de référence),
// avec les mêmes variables {{...}}. Lancer : npm run i18n:check
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "locales");
const REFERENCE = "fr";

const flatten = (obj, prefix = "") =>
    Object.entries(obj).flatMap(([k, v]) =>
        v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]]);

const variables = (text) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map(m => m[1]).sort().join(",");

const load = (lng) => {
    const entries = new Map();
    for (const file of readdirSync(join(localesDir, lng)).filter(f => f.endsWith(".json"))) {
        for (const [key, value] of flatten(JSON.parse(readFileSync(join(localesDir, lng, file), "utf8")))) {
            if (entries.has(key)) throw new Error(`${lng}/${file} : clé "${key}" déjà définie dans un autre fichier`);
            entries.set(key, { value, file });
        }
    }
    return entries;
};

const reference = load(REFERENCE);
const problems = [];
for (const lng of readdirSync(localesDir).filter(d => d !== REFERENCE)) {
    const other = load(lng);
    for (const [key, { value, file }] of reference) {
        const o = other.get(key);
        if (!o) problems.push(`[${lng}] manquante : ${key} (${file})`);
        else if (variables(o.value) !== variables(value)) problems.push(`[${lng}] variables différentes : ${key}`);
        else if (!o.value.trim()) problems.push(`[${lng}] vide : ${key}`);
    }
    for (const key of other.keys()) if (!reference.has(key)) problems.push(`[${lng}] en trop (absente du français) : ${key}`);
}

if (problems.length) {
    console.error(`❌ ${problems.length} problème(s) de traduction :\n` + problems.join("\n"));
    process.exit(1);
}
console.log(`✅ Traductions cohérentes : ${reference.size} clés.`);
