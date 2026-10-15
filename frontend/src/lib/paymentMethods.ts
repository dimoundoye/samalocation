/**
 * Paiement direct du loyer : le locataire paie le propriétaire (Wave, Orange Money, virement)
 * avec les coordonnées que celui-ci a enregistrées. Samalocation ne touche jamais l'argent.
 */

export type PaymentMethodType = "wave_link" | "wave" | "orange_money" | "bank";

export interface PaymentMethod {
    type: PaymentMethodType;
    url?: string;          // wave_link
    phone?: string;        // wave, orange_money
    holder?: string;       // titulaire (numéro ou compte)
    bank_name?: string;    // bank
    iban?: string;         // bank
    instructions?: string;
}

export const METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
    wave_link: "Lien de paiement Wave",
    wave: "Numéro Wave",
    orange_money: "Numéro Orange Money",
    bank: "Virement bancaire",
};
