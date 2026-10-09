import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import "./lib/installPrompt";
import { registerSW } from 'virtual:pwa-register';
import { clearPrivateCaches } from "./lib/privateCaches";

// Supprime les réponses de l'API gardées sur l'appareil par les anciennes versions de l'application
void clearPrivateCaches();

// Register service worker for PWA
//registerSW({ immediate: true });
registerSW({
    immediate: true,
    onNeedRefresh() {
        window.location.reload();
    },
});

// En développement, vite-plugin-pwa n'enregistre aucun service worker : on enregistre seulement
// la gestion des notifications push (sans cache) pour pouvoir les tester avec `npm run dev`.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/push-sw.js").catch((error) => console.error("Push SW (dev) error:", error));
}

createRoot(document.getElementById("root")!).render(<App />);
