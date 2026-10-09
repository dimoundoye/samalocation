import { Receipt } from "@/types";
import { formatCurrency } from "@/lib/utils";

/**
 * Cautions (dépôts de garantie) : un reçu de type 'deposit' n'est pas un loyer.
 * Il est exclu des revenus et des mois payés, et suit son propre cycle : détenue, puis restituée.
 */

export const isDepositReceipt = (r: Pick<Receipt, "receipt_type">) => r.receipt_type === "deposit";

/** Quittance de loyer valide : compte dans les revenus et marque la période comme payée */
export const isPaidRentReceipt = (r: Pick<Receipt, "receipt_type" | "status">) =>
    r.status !== "cancelled" && !isDepositReceipt(r);

export type DepositStatus = "held" | "refunded" | "partial" | "retained" | "cancelled";

export const getDepositStatus = (r: Receipt): DepositStatus => {
    if (r.status === "cancelled") return "cancelled";
    if (!r.settlement_id) return "held";
    const refunded = Number(r.settlement_refunded_amount) || 0;
    const retained = Number(r.settlement_retained_amount) || 0;
    if (retained <= 0) return "refunded";
    if (refunded <= 0) return "retained";
    return "partial";
};

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
    held: "Détenue",
    refunded: "Restituée",
    partial: "Restituée en partie",
    retained: "Retenue en totalité",
    cancelled: "Annulée",
};

export const DEPOSIT_STATUS_CLASSES: Record<DepositStatus, string> = {
    held: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    refunded: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    partial: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
    retained: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    cancelled: "bg-muted text-muted-foreground border-border",
};

/** Message prédéfini pour partager un reçu de caution */
export const buildDepositShareText = (tenantName: string, receipt: Receipt, currency?: string) =>
    `Bonjour ${tenantName}, le reçu de votre caution N° ${receipt.receipt_number} (${formatCurrency(Number(receipt.amount), currency)}) est disponible sur votre compte Samalocation : https://samalocation.com. Cette caution vous sera restituée en fin de bail, déduction faite des sommes éventuellement dues. Merci !`;

/** Message prédéfini pour partager le décompte de restitution d'une caution */
export const buildSettlementShareText = (tenantName: string, receipt: Receipt, currency?: string) => {
    const refunded = formatCurrency(Number(receipt.settlement_refunded_amount) || 0, currency);
    const retained = formatCurrency(Number(receipt.settlement_retained_amount) || 0, currency);
    const status = getDepositStatus(receipt);
    const outcome =
        status === "refunded"
            ? `vous a été restituée en totalité (${refunded})`
            : status === "retained"
                ? `a été retenue en totalité (${retained} de retenues)`
                : `vous a été restituée en partie : ${refunded} rendus, ${retained} retenus`;
    return `Bonjour ${tenantName}, votre caution ${outcome}. Le décompte de restitution N° ${receipt.settlement_number} est disponible sur votre compte Samalocation : https://samalocation.com. Merci !`;
};
