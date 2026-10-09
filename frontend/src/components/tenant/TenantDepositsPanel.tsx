import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ShieldCheck, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { downloadReceipt, openReceiptInNewTab, openDepositSettlementInNewTab, downloadDepositSettlement } from "@/lib/api";
import { getDepositStatus, DEPOSIT_STATUS_LABELS, DEPOSIT_STATUS_CLASSES } from "@/lib/deposits";
import { Receipt } from "@/types";

interface TenantDepositsPanelProps {
    /** Reçus de caution du locataire (valides ou annulés) */
    deposits: Receipt[];
    currency?: string;
    /** Version resserrée pour le détail du bail */
    compact?: boolean;
}

const formatDate = (value?: string | null) => (value ? format(new Date(value), "dd/MM/yyyy") : "");

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    virement: "Virement bancaire",
    especes: "Espèces",
    cheque: "Chèque",
    mobile: "Paiement mobile",
};

/**
 * Cautions du locataire : reçu de caution, statut et, une fois restituée, le détail du décompte
 */
export const TenantDepositsPanel = ({ deposits, currency, compact = false }: TenantDepositsPanelProps) => {
    const { toast } = useToast();

    const run = (action: () => Promise<unknown>) => async () => {
        try {
            await action();
        } catch (error) {
            toast({
                title: "Document indisponible",
                description: error instanceof Error ? error.message : "Impossible d'ouvrir le document.",
                variant: "destructive",
            });
        }
    };

    if (deposits.length === 0) {
        return (
            <div className={`text-center text-muted-foreground border rounded-xl bg-muted/20 ${compact ? "py-10" : "py-12"}`}>
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucune caution enregistrée.</p>
                <p className="text-xs mt-1 px-6">Le reçu apparaîtra ici quand votre propriétaire l'aura émis.</p>
            </div>
        );
    }

    const sorted = [...deposits].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    return (
        <div className="space-y-3">
            {sorted.map((deposit) => {
                const status = getDepositStatus(deposit);
                const isCancelled = status === "cancelled";
                const amountCurrency = (deposit as Receipt & { currency?: string }).currency || currency;
                const deductions = Array.isArray(deposit.settlement_deductions) ? deposit.settlement_deductions : [];

                return (
                    <div
                        key={deposit.id}
                        className={`rounded-xl border p-4 space-y-3 ${
                            isCancelled ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40" : "bg-card"
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-base ${isCancelled ? "line-through text-muted-foreground" : "text-primary"}`}>
                                        {formatCurrency(Number(deposit.amount), amountCurrency)}
                                    </span>
                                    {isCancelled ? (
                                        <Badge variant="destructive" className="text-[10px] font-bold uppercase bg-red-600 text-white">ANNULÉ</Badge>
                                    ) : (
                                        <Badge variant="outline" className={`text-[10px] font-semibold ${DEPOSIT_STATUS_CLASSES[status]}`}>
                                            {DEPOSIT_STATUS_LABELS[status]}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Reçu de caution N° {deposit.receipt_number} — versée le {formatDate(deposit.payment_date)}
                                </p>
                                {deposit.property_name && !compact && (
                                    <p className="text-xs text-muted-foreground">{deposit.property_name}</p>
                                )}
                                {isCancelled && deposit.cancellation_reason && (
                                    <p className="text-xs text-red-700 dark:text-red-300">Motif d'annulation : {deposit.cancellation_reason}</p>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 sm:flex-initial h-8 text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                    onClick={run(() => openReceiptInNewTab(deposit.id))}
                                    title="Ouvrir le reçu de caution"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Voir
                                </Button>
                                {!isCancelled && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 sm:flex-initial h-8 text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                                        onClick={run(() => downloadReceipt(deposit.id, deposit.receipt_number, deposit.payment_date))}
                                        title="Télécharger le reçu de caution"
                                    >
                                        <Download className="h-3.5 w-3.5 mr-1" />
                                        PDF
                                    </Button>
                                )}
                            </div>
                        </div>

                        {status === "held" && (
                            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
                                Votre propriétaire conserve cette caution pendant le bail. Elle vous sera restituée en fin de bail,
                                déduction faite des sommes éventuellement dues, avec un décompte détaillé.
                            </p>
                        )}

                        {deposit.settlement_id && (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <p className="text-xs font-semibold flex items-center gap-1.5">
                                        <Undo2 className="h-3.5 w-3.5 text-primary" />
                                        Décompte de restitution N° {deposit.settlement_number} — le {formatDate(deposit.settlement_date)}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 sm:flex-initial h-7 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                            onClick={run(() => openDepositSettlementInNewTab(deposit.settlement_id!))}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                            Voir
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 sm:flex-initial h-7 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                            onClick={run(() => downloadDepositSettlement(deposit.settlement_id!, deposit.settlement_number))}
                                        >
                                            <Download className="h-3.5 w-3.5 mr-1" />
                                            PDF
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Caution versée</span>
                                        <span className="font-medium">{formatCurrency(Number(deposit.amount), amountCurrency)}</span>
                                    </div>
                                    {deductions.map((d, i) => (
                                        <div key={i} className="flex justify-between gap-3">
                                            <span className="text-muted-foreground break-words min-w-0">Retenue : {d.label}</span>
                                            <span className="font-medium text-rose-600 shrink-0">- {formatCurrency(Number(d.amount), amountCurrency)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between gap-3 border-t pt-1">
                                        <span className="font-semibold">Montant rendu</span>
                                        <span className="font-bold text-emerald-600">
                                            {formatCurrency(Number(deposit.settlement_refunded_amount) || 0, amountCurrency)}
                                        </span>
                                    </div>
                                    {deposit.settlement_payment_method && Number(deposit.settlement_refunded_amount) > 0 && (
                                        <p className="text-muted-foreground">
                                            Mode de remboursement : {PAYMENT_METHOD_LABELS[deposit.settlement_payment_method] || deposit.settlement_payment_method}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
