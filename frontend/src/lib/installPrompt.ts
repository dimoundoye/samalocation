import { useSyncExternalStore } from "react";

// Bouton « Installer l'application » (Chrome/Edge Android et ordinateur, événement beforeinstallprompt).
// L'événement arrive tôt, souvent avant l'affichage des paramètres : on l'écoute dès le chargement (import dans main.tsx).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); // pas de mini-bannière automatique : l'installation est proposée dans les paramètres
  deferredPrompt = event as BeforeInstallPromptEvent;
  notify();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  notify();
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** true quand le navigateur permet d'installer l'app via un bouton */
export const useCanInstall = () => useSyncExternalStore(subscribe, () => deferredPrompt !== null);

export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null; // utilisable une seule fois
  notify();
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  return outcome === "accepted";
};
