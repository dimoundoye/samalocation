/**
 * Fonctionnalités activables par variable d'environnement.
 */

// Paiement du loyer en ligne + onglet portefeuille propriétaire.
// Désactivé par défaut : la plateforme ne doit pas détenir l'argent des loyers.
export const RENT_ONLINE_PAYMENT_ENABLED = import.meta.env.VITE_RENT_ONLINE_PAYMENT_ENABLED === "true";
