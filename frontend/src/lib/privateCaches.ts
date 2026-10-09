/**
 * Caches du service worker qui contenaient des données privées : les anciennes versions de l'application
 * y gardaient les réponses de l'API (reçus, profil, messages…) et les PDF de reçus, par adresse et non
 * par compte. Sur un appareil partagé, un compte pouvait donc voir les données du précédent.
 * Ces réponses ne sont plus mises en cache (vite.config.ts) ; on supprime ce qui reste sur les appareils.
 */
const PRIVATE_CACHE_NAMES = ["api-cache", "receipt-pdfs"];

export const clearPrivateCaches = async () => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    await Promise.all(PRIVATE_CACHE_NAMES.map((name) => caches.delete(name).catch(() => false)));
};
