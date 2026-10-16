import { Receipt } from "@/types";
import { isPaidRentReceipt } from "@/lib/deposits";

/**
 * Suivi du reste à payer : un mois de loyer peut être réglé en plusieurs versements.
 * Chaque reçu fige le loyer dû (rent_due) au moment de son émission ; le dernier versement du mois fait foi.
 * Un mois dont aucun reçu ne porte de loyer dû (reçus émis avant le suivi) est considéré comme soldé.
 * Un reçu de 0 F est un avis de loyer impayé : il signale au locataire que rien n'a été versé sur le mois.
 */

export type RentMonthStatus = "paid" | "partial" | "unpaid";

export interface RentMonthBalance {
    /** paid : soldé ; partial : réglé en partie ; unpaid : rien de versé (aucun reçu, ou avis de loyer impayé) */
    status: RentMonthStatus;
    /** Il reste un montant dû sur le mois (réglé en partie ou avis de loyer impayé) */
    isDue: boolean;
    paid: number;
    rentDue: number | null;
    remaining: number;
}

const toNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    return Number.isFinite(n) ? n : 0;
};

/** Reste à payer après ce reçu, tel qu'il a été émis (0 pour un reçu soldé ou antérieur au suivi) */
export const getReceiptRemaining = (r: Pick<Receipt, "rent_due" | "paid_before" | "amount" | "receipt_type">): number => {
    if (r.receipt_type === "deposit" || r.rent_due === null || r.rent_due === undefined) return 0;
    return Math.max(Math.round((toNumber(r.rent_due) - toNumber(r.paid_before) - toNumber(r.amount)) * 100) / 100, 0);
};

/** Reçu d'acompte : il restait un montant dû après ce versement */
export const isPartialReceipt = (r: Pick<Receipt, "rent_due" | "paid_before" | "amount" | "receipt_type">) =>
    getReceiptRemaining(r) > 0 && toNumber(r.amount) > 0;

/** Avis de loyer impayé : document à 0 F émis pour signaler qu'aucun versement n'a été fait sur le mois */
export const isUnpaidNotice = (r: Pick<Receipt, "rent_due" | "paid_before" | "amount" | "receipt_type">) =>
    getReceiptRemaining(r) > 0 && toNumber(r.amount) === 0;

/**
 * Solde d'un mois à partir de ses reçus (déjà filtrés sur le locataire, le logement et le mois).
 * Les cautions et reçus annulés sont ignorés.
 */
export const getRentMonthBalance = (monthReceipts: Receipt[]): RentMonthBalance => {
    const rentReceipts = monthReceipts
        .filter(isPaidRentReceipt)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const paid = Math.round(rentReceipts.reduce((sum, r) => sum + toNumber(r.amount), 0) * 100) / 100;
    if (rentReceipts.length === 0) return { status: "unpaid", isDue: false, paid: 0, rentDue: null, remaining: 0 };

    const lastWithDue = [...rentReceipts].reverse().find(r => r.rent_due !== null && r.rent_due !== undefined);
    if (!lastWithDue) return { status: "paid", isDue: false, paid, rentDue: null, remaining: 0 };

    const rentDue = toNumber(lastWithDue.rent_due);
    const remaining = Math.max(Math.round((rentDue - paid) * 100) / 100, 0);
    const status: RentMonthStatus = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
    return { status, isDue: remaining > 0, paid, rentDue, remaining };
};
