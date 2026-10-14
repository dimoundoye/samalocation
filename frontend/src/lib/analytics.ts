// Mesure d'audience interne (onglet « Trafic » de l'admin) : pages vues anonymes.
// Un identifiant aléatoire, sans lien avec le compte ni l'adresse IP, est gardé dans le navigateur
// pour compter les visiteurs uniques (voir la Politique de confidentialité, section 5.2).
import { API_BASE_URL } from "@/api/baseClient";

const VISITOR_KEY = "sl_visitor_id";
let firstHit = true;

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const getVisitorId = (): string | null => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

// Le visiteur a demandé à ne pas être suivi (Do Not Track / Global Privacy Control)
const optedOut = () =>
  navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

// Regroupe les pages d'un même type : /property/3f2a… → /property/:id
export const normalizePath = (pathname: string) =>
  pathname
    .split("/")
    .map(seg => (/^[0-9a-f-]{16,}$/i.test(seg) || /^\d{3,}$/.test(seg) || (/\d/.test(seg) && seg.length >= 12) ? ":id" : seg))
    .join("/") || "/";

export const sendHit = (kind: "pageview" | "ping", pathname: string) => {
  if (optedOut() || pathname.startsWith("/admin")) return;
  const visitorId = getVisitorId();
  if (!visitorId) return;

  let token: string | null = null;
  try {
    token = localStorage.getItem("auth_token");
  } catch {
    token = null;
  }

  const body: Record<string, string> = { kind, path: normalizePath(pathname), visitorId };
  if (kind === "pageview" && firstHit) {
    body.referrer = document.referrer;
    firstHit = false;
  }

  fetch(`${API_BASE_URL}/analytics/hit`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }).catch(() => {
    // La mesure d'audience ne doit jamais gêner la navigation
  });
};
