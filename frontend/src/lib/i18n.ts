import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traductions : un dossier par langue (src/locales/fr, src/locales/en…), un fichier JSON par domaine.
// Tous les fichiers d'une langue sont fusionnés dans l'espace "translation" (clés de premier niveau distinctes).
// Vérifier la cohérence entre langues : npm run i18n:check
const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', { eager: true, import: 'default' });

const resources: Record<string, { translation: Record<string, unknown> }> = {};
for (const [path, content] of Object.entries(files)) {
    const lng = path.split('/').at(-2)!;
    resources[lng] ??= { translation: {} };
    Object.assign(resources[lng].translation, content);
}

export const SUPPORTED_LANGUAGES = Object.keys(resources);

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        supportedLngs: SUPPORTED_LANGUAGES,
        nonExplicitSupportedLngs: true, // "en-US", "en-GB"… → "en"
        load: 'languageOnly',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

// Langue de la page (lecteurs d'écran, correcteur, moteurs de recherche)
const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng.split('-')[0]);
syncHtmlLang(i18n.resolvedLanguage || i18n.language || 'fr');
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
