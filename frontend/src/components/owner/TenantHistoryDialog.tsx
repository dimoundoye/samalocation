import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Download, FileText, Calendar, Share2, ExternalLink, Ban, AlertTriangle, Loader2, Info, ShieldCheck, Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Tenant } from "@/types";
import { downloadReceipt, openReceiptInNewTab, cancelReceipt, openDepositSettlementInNewTab, downloadDepositSettlement, cancelDepositSettlement } from "@/lib/api";
import { ReceiptPreviewModal } from "@/components/receipts/ReceiptPreviewModal";
import { DepositSettlementDialog } from "./DepositSettlementDialog";
import {
    isDepositReceipt,
    getDepositStatus,
    DEPOSIT_STATUS_LABELS,
    DEPOSIT_STATUS_CLASSES,
    buildDepositShareText,
    buildSettlementShareText,
} from "@/lib/deposits";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface TenantHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: Tenant | null;
    receipts: Receipt[];
    currency?: string;
    onRefresh?: () => void;
}

export const TenantHistoryDialog = ({
    open,
    onOpenChange,
    tenant,
    receipts,
    currency,
    onRefresh
}: TenantHistoryDialogProps) => {
    const { toast } = useToast();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [receiptToCancel, setReceiptToCancel] = useState<Receipt | null>(null);
    const [cancellationReasonOption, setCancellationReasonOption] = useState<string>("Erreur de montant");
    const [customReasonText, setCustomReasonText] = useState<string>("");
    const [isCancelling, setIsCancelling] = useState(false);

    const [reasonModalOpen, setReasonModalOpen] = useState(false);
    const [selectedReasonReceipt, setSelectedReasonReceipt] = useState<Receipt | null>(null);

    const [selectedPreviewReceipt, setSelectedPreviewReceipt] = useState<{ id: string; number?: string; date?: string } | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const [settleReceipt, setSettleReceipt] = useState<Receipt | null>(null);
    const [settlementToCancel, setSettlementToCancel] = useState<Receipt | null>(null);
    const [settlementCancelReason, setSettlementCancelReason] = useState("");
    const [isCancellingSettlement, setIsCancellingSettlement] = useState(false);

    if (!tenant) return null;

    const tenantReceipts = receipts
        .filter((r) =>
            r.tenant_id === tenant.id ||
            (r.tenant_id === tenant.user_id && r.property_id === tenant.property_id && r.unit_id === tenant.unit_id)
        )
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    // Cautions valides du locataire (détenues ou restituées), présentées à part de l'historique des loyers
    const tenantDeposits = tenantReceipts.filter(r => isDepositReceipt(r) && r.status !== 'cancelled');

    const getMonthName = (month: number, year: number) => {
        const date = new Date(year, month - 1, 1);
        return format(date, "MMMM yyyy", { locale: fr });
    };

    // Libellé de la colonne « Période » : un reçu de caution n'a pas de période
    const getPeriodLabel = (receipt: Receipt) =>
        isDepositReceipt(receipt) ? "Caution" : getMonthName(receipt.month, receipt.year);

    const formatDate = (value?: string | null) => (value ? format(new Date(value), "dd/MM/yyyy") : "");

    const handlePreview = async (receipt: Receipt) => {
        try {
            await openReceiptInNewTab(receipt.id);
        } catch (error) {
            console.error("Error opening receipt:", error);
        }
    };

    const handleDownload = async (receiptId: string, receiptNumber?: string, paymentDate?: string) => {
        try {
            await downloadReceipt(receiptId, receiptNumber, paymentDate);
        } catch (error) {
            // Silently fail
        }
    };

    const shareText = async (title: string, text: string) => {
        const phone = tenant.phone?.replace(/[\s\(\)\-\+]/g, '') || '';
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                return;
            } catch (err) { /* fallback */ }
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareReceipt = async (receipt: Receipt) => {
        if (isDepositReceipt(receipt)) {
            await shareText('Reçu de caution Samalocation', buildDepositShareText(tenant.full_name, receipt, currency));
            return;
        }
        const monthLabel = getMonthName(receipt.month, receipt.year);
        const amount = formatCurrency(receipt.amount, currency);
        await shareText(
            'Quittance Samalocation',
            `Bonjour ${tenant.full_name}, votre quittance de loyer pour le mois de ${monthLabel} (${amount}) est disponible sur votre compte Samalocation: https://samalocation.com. Merci !`
        );
    };

    const shareSettlement = (receipt: Receipt) =>
        shareText('Restitution de caution Samalocation', buildSettlementShareText(tenant.full_name, receipt, currency));

    const handleConfirmCancelSettlement = async () => {
        if (!settlementToCancel?.settlement_id || !settlementCancelReason.trim()) return;
        try {
            setIsCancellingSettlement(true);
            await cancelDepositSettlement(settlementToCancel.settlement_id, settlementCancelReason.trim());
            toast({
                title: "Restitution annulée",
                description: "La caution est de nouveau détenue. Vous pouvez enregistrer une nouvelle restitution.",
            });
            setSettlementToCancel(null);
            onRefresh?.();
        } catch (error: any) {
            toast({
                title: "Erreur d'annulation",
                description: error.message || "Impossible d'annuler la restitution.",
                variant: "destructive"
            });
        } finally {
            setIsCancellingSettlement(false);
        }
    };

    const handleOpenCancelModal = (receipt: Receipt) => {
        setReceiptToCancel(receipt);
        setCancellationReasonOption("Erreur de montant");
        setCustomReasonText("");
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!receiptToCancel) return;

        let finalReason = cancellationReasonOption;
        if (cancellationReasonOption === "Autre motif") {
            finalReason = customReasonText.trim();
        } else if (customReasonText.trim()) {
            finalReason = `${cancellationReasonOption} (${customReasonText.trim()})`;
        }

        if (!finalReason) {
            toast({
                title: "Motif d'annulation requis",
                description: "Veuillez préciser la raison de l'annulation.",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsCancelling(true);
            await cancelReceipt(receiptToCancel.id, finalReason);
            toast({
                title: isDepositReceipt(receiptToCancel) ? "Reçu de caution annulé" : "Quittance annulée",
                description: `${isDepositReceipt(receiptToCancel) ? "Le reçu de caution" : "La quittance"} N° ${receiptToCancel.receipt_number} a été annulé${isDepositReceipt(receiptToCancel) ? "" : "e"}. Une trace indélébile a été enregistrée.`,
            });
            setCancelModalOpen(false);
            setReceiptToCancel(null);
            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error("Cancellation error:", error);
            toast({
                title: "Erreur d'annulation",
                description: error.message || "Impossible d'annuler la quittance.",
                variant: "destructive"
            });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                    {/* Header */}
                    <DialogHeader className="px-4 sm:px-6 pr-12 sm:pr-12 pt-5 pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg leading-snug">
                            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="min-w-0 break-words">Historique — {tenant.full_name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm mt-1">
                            Consultez, téléchargez ou annulez les reçus délivrés pour ce locataire.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 sm:p-6">
                        {tenantDeposits.length > 0 && (
                            <div className="mb-5 space-y-2">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    Caution
                                </h3>
                                {tenantDeposits.map((deposit) => {
                                    const status = getDepositStatus(deposit);
                                    return (
                                        <div key={deposit.id} className="rounded-xl border bg-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-primary">{formatCurrency(deposit.amount, currency)}</span>
                                                    <Badge variant="outline" className={`text-[10px] font-semibold ${DEPOSIT_STATUS_CLASSES[status]}`}>
                                                        {DEPOSIT_STATUS_LABELS[status]}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Reçu N° {deposit.receipt_number} — versée le {formatDate(deposit.payment_date)}
                                                </p>
                                                {deposit.settlement_id && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Rendu : <strong className="text-foreground">{formatCurrency(Number(deposit.settlement_refunded_amount) || 0, currency)}</strong>
                                                        {" · "}Retenu : <strong className="text-foreground">{formatCurrency(Number(deposit.settlement_retained_amount) || 0, currency)}</strong>
                                                        {" · "}le {formatDate(deposit.settlement_date)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 sm:justify-end shrink-0">
                                                {status === 'held' ? (
                                                    <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setSettleReceipt(deposit)}>
                                                        <Undo2 className="h-3.5 w-3.5" />
                                                        Restituer la caution
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                                            onClick={() => openDepositSettlementInNewTab(deposit.settlement_id!).catch(() => undefined)}
                                                            title="Ouvrir le décompte de restitution"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            Décompte
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                                            onClick={() => shareSettlement(deposit)}
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                            Partager
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                                            onClick={() => downloadDepositSettlement(deposit.settlement_id!, deposit.settlement_number).catch(() => undefined)}
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            PDF
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40"
                                                            onClick={() => {
                                                                setSettlementToCancel(deposit);
                                                                setSettlementCancelReason("");
                                                            }}
                                                            title="Annuler cette restitution avec motif"
                                                        >
                                                            <Ban className="h-3.5 w-3.5" />
                                                            Annuler
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {tenantReceipts.length === 0 ? (
                            <div className="text-center py-12 border rounded-xl bg-muted/20">
                                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                                <p className="text-muted-foreground text-sm">Aucun reçu trouvé pour ce locataire.</p>
                            </div>
                        ) : (
                            <>
                                {/* ── MOBILE: Card list ── */}
                                <div className="flex flex-col gap-3 sm:hidden">
                                    {tenantReceipts.map((receipt) => {
                                        const isCancelled = receipt.status === 'cancelled';
                                        return (
                                            <div
                                                key={receipt.id}
                                                className={`rounded-xl border p-4 space-y-3 shadow-sm ${
                                                    isCancelled ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40' : 'bg-card border-border'
                                                }`}
                                            >
                                                {/* Top row: number + amount */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                        {receipt.receipt_number}
                                                    </span>
                                                    <span className={`font-bold text-sm ${isCancelled ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                                                        {formatCurrency(receipt.amount, currency)}
                                                    </span>
                                                </div>

                                                {/* Period + Date */}
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <Badge variant="secondary" className="text-xs capitalize font-medium">
                                                        {getPeriodLabel(receipt)}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(receipt.payment_date), "dd/MM/yyyy")}
                                                    </span>
                                                </div>

                                                {/* Actions 2 par 2 */}
                                                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold justify-center"
                                                        onClick={() => handlePreview(receipt)}
                                                        title="Ouvrir le reçu"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Voir
                                                    </Button>
                                                    {isCancelled ? (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 font-semibold justify-center"
                                                                onClick={() => {
                                                                    setSelectedReasonReceipt(receipt);
                                                                    setReasonModalOpen(true);
                                                                }}
                                                                title="Voir le motif d'annulation"
                                                            >
                                                                <Info className="h-3.5 w-3.5" />
                                                                Motif
                                                            </Button>
                                                            <Badge variant="destructive" className="col-span-2 justify-center py-1 text-[10px] font-bold uppercase bg-red-600 text-white rounded-md">
                                                                ANNULÉ
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 justify-center"
                                                                onClick={() => shareReceipt(receipt)}
                                                            >
                                                                <Share2 className="h-3.5 w-3.5" />
                                                                Partager
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 justify-center"
                                                                onClick={() => handleDownload(receipt.id, receipt.receipt_number, receipt.payment_date)}
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                                PDF
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40 justify-center"
                                                                onClick={() => handleOpenCancelModal(receipt)}
                                                                disabled={!!receipt.settlement_id}
                                                                title={receipt.settlement_id ? "Annulez d'abord la restitution de cette caution" : "Annuler ce reçu avec motif"}
                                                            >
                                                                <Ban className="h-3.5 w-3.5" />
                                                                Annuler
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                 {/* ── DESKTOP: Table ── */}
                                 <div className="hidden sm:block rounded-xl border overflow-hidden">
                                     <Table>
                                         <TableHeader>
                                             <TableRow className="bg-muted/50">
                                                 <TableHead className="w-[130px]">N° Reçu</TableHead>
                                                 <TableHead>Période</TableHead>
                                                 <TableHead>Paiement</TableHead>
                                                 <TableHead>Montant</TableHead>
                                                 <TableHead className="text-right w-[180px]">Actions</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                             {tenantReceipts.map((receipt) => {
                                                 const isCancelled = receipt.status === 'cancelled';
                                                 return (
                                                     <TableRow key={receipt.id} className={isCancelled ? "bg-red-50/40 dark:bg-red-950/10 opacity-80" : ""}>
                                                         <TableCell className="font-mono text-xs">{receipt.receipt_number}</TableCell>
                                                         <TableCell className="capitalize">
                                                             {getPeriodLabel(receipt)}
                                                         </TableCell>
                                                         <TableCell>
                                                             {format(new Date(receipt.payment_date), "dd/MM/yyyy")}
                                                         </TableCell>
                                                         <TableCell className={`font-semibold ${isCancelled ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                                                             {formatCurrency(receipt.amount, currency)}
                                                         </TableCell>
                                                         <TableCell className="text-right">
                                                             <div className="grid grid-cols-2 gap-1.5 w-[180px] ml-auto">
                                                                 <Button
                                                                     variant="outline"
                                                                     size="sm"
                                                                     className="h-8 text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold justify-center px-2"
                                                                     onClick={() => handlePreview(receipt)}
                                                                     title="Ouvrir le reçu dans un nouvel onglet"
                                                                 >
                                                                     <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                                     Voir
                                                                 </Button>
                                                                 {isCancelled ? (
                                                                     <>
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-8 text-xs px-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 justify-center font-semibold"
                                                                             onClick={() => {
                                                                                 setSelectedReasonReceipt(receipt);
                                                                                 setReasonModalOpen(true);
                                                                             }}
                                                                             title="Voir le motif d'annulation"
                                                                         >
                                                                             <Info className="h-3.5 w-3.5 mr-1" />
                                                                             Motif
                                                                         </Button>
                                                                         <Badge variant="destructive" className="col-span-2 justify-center py-1 text-[10px] font-bold uppercase bg-red-600 text-white rounded-md">
                                                                             ANNULÉ
                                                                         </Badge>
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-8 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 justify-center px-2"
                                                                             onClick={() => shareReceipt(receipt)}
                                                                             title="Partager la quittance"
                                                                         >
                                                                             <Share2 className="h-3.5 w-3.5 mr-1" />
                                                                             Partager
                                                                         </Button>
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-8 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 shadow-sm justify-center px-2"
                                                                             onClick={() => handleDownload(receipt.id, receipt.receipt_number, receipt.payment_date)}
                                                                             title="Télécharger le PDF"
                                                                         >
                                                                             <Download className="h-3.5 w-3.5 mr-1" />
                                                                             PDF
                                                                         </Button>
                                                                         <Button
                                                                             variant="outline"
                                                                             size="sm"
                                                                             className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40 justify-center px-2"
                                                                             onClick={() => handleOpenCancelModal(receipt)}
                                                                disabled={!!receipt.settlement_id}
                                                                             title={receipt.settlement_id ? "Annulez d'abord la restitution de cette caution" : "Annuler ce reçu avec motif"}
                                                                         >
                                                                             <Ban className="h-3.5 w-3.5 mr-1" />
                                                                             Annuler
                                                                         </Button>
                                                                     </>
                                                                 )}
                                                             </div>
                                                         </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </div>

                    <ReceiptPreviewModal
                        open={previewOpen}
                        onOpenChange={setPreviewOpen}
                        receiptId={selectedPreviewReceipt?.id || null}
                        receiptNumber={selectedPreviewReceipt?.number}
                        paymentDate={selectedPreviewReceipt?.date}
                    />
                </DialogContent>
            </Dialog>

            {/* ── MODAL D'ANNULATION DE QUITTANCE AVEC MOTIF ── */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>Annuler {receiptToCancel && isDepositReceipt(receiptToCancel) ? "le reçu de caution" : "la quittance"} N° {receiptToCancel?.receipt_number}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-2">
                            {receiptToCancel && isDepositReceipt(receiptToCancel)
                                ? "La caution ne sera plus considérée comme versée. Une trace indélébile sera conservée dans le journal d'activité du patron."
                                : "L'annulation retirera cette somme des revenus enregistrés et conservera une trace indélébile dans le journal d'activité du patron."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Motif principal d'annulation *</Label>
                            <Select value={cancellationReasonOption} onValueChange={setCancellationReasonOption}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un motif" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Erreur de montant">Erreur de montant</SelectItem>
                                    <SelectItem value="Erreur de date ou de période">Erreur de date ou de période</SelectItem>
                                    <SelectItem value="Paiement rejeté / Chèque sans provision">Paiement rejeté / Chèque sans provision</SelectItem>
                                    <SelectItem value="Quittance générée en double">Quittance générée en double</SelectItem>
                                    <SelectItem value="Autre motif">Autre motif...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">
                                {cancellationReasonOption === "Autre motif" ? "Précisez le motif *" : "Détails complémentaires (optionnel)"}
                            </Label>
                            <Textarea
                                placeholder="ex: Erreur de saisie lors du virement bancaire..."
                                value={customReasonText}
                                onChange={(e) => setCustomReasonText(e.target.value)}
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setCancelModalOpen(false)}
                            disabled={isCancelling}
                        >
                            Retour
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Annulation...
                                </>
                            ) : (
                                <>
                                    <Ban className="h-4 w-4" />
                                    Confirmer l'annulation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── MODAL DÉTAILS DU MOTIF D'ANNULATION ── */}
            <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-lg shrink-0">
                                <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>Motif d'annulation de quittance</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Quittance N° <span className="font-mono font-semibold text-foreground">{selectedReasonReceipt?.receipt_number}</span> {selectedReasonReceipt ? `— ${getPeriodLabel(selectedReasonReceipt)}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2">
                            <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                                Raison enregistrée :
                            </p>
                            <p className="text-sm font-medium text-red-950 dark:text-red-100 leading-relaxed whitespace-pre-wrap">
                                "{selectedReasonReceipt?.cancellation_reason || 'Aucun motif renseigné'}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/50">
                            <div>
                                <span className="text-muted-foreground block">Montant annulé :</span>
                                <span className="font-bold text-foreground">{selectedReasonReceipt ? formatCurrency(selectedReasonReceipt.amount, currency) : ''}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Date de paiement initiale :</span>
                                <span className="font-medium text-foreground">
                                    {selectedReasonReceipt?.payment_date ? format(new Date(selectedReasonReceipt.payment_date), "dd/MM/yyyy") : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setReasonModalOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── RESTITUTION D'UNE CAUTION ── */}
            <DepositSettlementDialog
                open={!!settleReceipt}
                onOpenChange={(isOpen) => { if (!isOpen) setSettleReceipt(null); }}
                receipt={settleReceipt}
                currency={currency}
                onSuccess={onRefresh}
            />

            {/* ── ANNULATION D'UNE RESTITUTION DE CAUTION ── */}
            <Dialog open={!!settlementToCancel} onOpenChange={(isOpen) => { if (!isOpen) setSettlementToCancel(null); }}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>Annuler la restitution N° {settlementToCancel?.settlement_number}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-2">
                            La caution redeviendra détenue et vous pourrez enregistrer une nouvelle restitution. Le décompte annulé reste consultable et une trace est conservée dans le journal d'activité.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label className="text-xs font-semibold">Motif de l'annulation *</Label>
                        <Textarea
                            placeholder="ex : Erreur sur le montant d'une retenue…"
                            value={settlementCancelReason}
                            onChange={(e) => setSettlementCancelReason(e.target.value)}
                            rows={3}
                            className="text-sm"
                        />
                    </div>
                    <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setSettlementToCancel(null)} disabled={isCancellingSettlement}>
                            Retour
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancelSettlement}
                            disabled={isCancellingSettlement || !settlementCancelReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {isCancellingSettlement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                            Confirmer l'annulation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
