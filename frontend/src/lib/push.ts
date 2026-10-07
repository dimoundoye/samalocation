import { baseClient } from "@/api/baseClient";

// Notifications push (Web Push) : détection de l'appareil, abonnement et désabonnement.

// Compte qui a activé le push sur ce navigateur : permet de réabonner silencieusement
// le même compte après une déconnexion/reconnexion, sans jamais abonner un autre compte.
const OPT_IN_KEY = "push_opt_in_user";

const safeStorage = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* stockage indisponible */ } },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch { /* stockage indisponible */ } },
};

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS se présente comme un Mac
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

/** Version d'iOS (null si inconnue, par exemple iPadOS qui se présente comme un Mac) */
export const getIOSVersion = (): number | null => {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  return match ? Number(match[1]) + Number(match[2]) / 100 : null;
};

/** L'app est ouverte depuis l'écran d'accueil (PWA installée) */
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isPushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export type PushAvailability =
  | "supported"          // l'interrupteur peut être affiché
  | "ios-needs-install"  // iPhone/iPad : installer l'app sur l'écran d'accueil d'abord
  | "ios-too-old"        // iOS < 16.4
  | "unsupported";       // navigateur sans Web Push

export const getPushAvailability = (): PushAvailability => {
  if (isIOS()) {
    const version = getIOSVersion();
    if (version !== null && version < 16.04) return "ios-too-old";
    if (!isStandalone()) return "ios-needs-install";
  }
  return isPushSupported() ? "supported" : "unsupported";
};

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const getRegistration = async () => {
  if (!isPushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
};

export const getCurrentSubscription = async () => {
  const registration = await getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
};

/**
 * Demande l'autorisation (doit être appelé suite à un clic) puis abonne l'appareil au compte connecté.
 * Retourne la permission obtenue.
 */
export const enablePush = async (userId: string): Promise<NotificationPermission> => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await subscribeDevice(userId);
  return permission;
};

// navigator.serviceWorker.ready ne se résout jamais si aucun service worker n'est enregistré
const waitForServiceWorker = () =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service worker indisponible")), 10000)
    ),
  ]);

/** Brave désactive par défaut le service push (option « Utiliser les services Google pour la messagerie push ») */
export class BravePushDisabledError extends Error {
  constructor() {
    super("Brave push messaging disabled");
    this.name = "BravePushDisabledError";
  }
}

const isBrave = async () => {
  const brave = (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave;
  try {
    return Boolean(await brave?.isBrave?.());
  } catch {
    return false;
  }
};

const subscribeDevice = async (userId: string) => {
  const registration = await waitForServiceWorker();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = await baseClient("/push/public-key");
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch (error) {
      if (await isBrave()) throw new BravePushDisabledError();
      throw error;
    }
  }
  await baseClient("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  safeStorage.set(OPT_IN_KEY, userId);
};

/**
 * Désabonne l'appareil (côté serveur puis navigateur).
 * `forget` : oublie aussi le choix du compte (désactivation volontaire), sinon il est conservé
 * pour réabonner le même compte à sa prochaine connexion (déconnexion simple).
 */
export const disablePush = async ({ forget = true } = {}) => {
  if (forget) safeStorage.remove(OPT_IN_KEY);
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  try {
    await baseClient("/push/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } finally {
    await subscription.unsubscribe();
  }
};

/**
 * À la connexion : réabonne l'appareil si ce même compte avait activé le push ici
 * et que l'autorisation du navigateur est toujours accordée.
 */
export const restorePushForUser = async (userId: string) => {
  if (getPushAvailability() !== "supported") return;
  if (Notification.permission !== "granted" || safeStorage.get(OPT_IN_KEY) !== userId) return;
  try {
    await subscribeDevice(userId);
  } catch (error) {
    console.error("Push restore error:", error);
  }
};

export const isPushOptedIn = (userId: string) => safeStorage.get(OPT_IN_KEY) === userId;
