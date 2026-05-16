import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: any, currency: string = 'XOF') {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  const value = numericValue || 0;
  
  // Forcer l'affichage de "F CFA" pour le Franc CFA (XOF/XAF)
  // car l'API Intl peut afficher "XOF" sur certains navigateurs selon les données ICU
  if (currency === 'XOF' || currency === 'XAF') {
    const formatted = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value);
    return `${formatted} F CFA`;
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
}
