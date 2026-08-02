import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { useState } from "react";
import { Download, FileText, Calendar, Share2, Eye, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Tenant } from "@/types";
import { downloadReceipt, openReceiptInNewTab } from "@/lib/api";
import { ReceiptPreviewModal } from "@/components/receipts/ReceiptPreviewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TenantHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: Tenant | null;
    receipts: Receipt[];
    currency?: string;
}

export const TenantHistoryDialog = ({
    open,
    onOpenChange,
    tenant,
    receipts,
    currency,
}: TenantHistoryDialogProps) => {
    if (!tenant) return null;

    const tenantReceipts = receipts
        .filter((r) =>
            r.tenant_id === tenant.id ||
            (r.tenant_id === tenant.user_id && r.property_id === tenant.property_id && r.unit_id === tenant.unit_id)
        )
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    const getMonthName = (month: number, year: number) => {
        const date = new Date(year, month - 1, 1);
        return format(date, "MMMM yyyy", { locale: fr });
    };

    const [selectedPreviewReceipt, setSelectedPreviewReceipt] = useState<{ id: string; number?: string; date?: string } | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

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

    const shareReceipt = async (receipt: Receipt) => {
        if (!tenant) return;
        const phone = tenant.phone?.replace(/[\s\(\)\-\+]/g, '') || '';
        const monthLabel = getMonthName(receipt.month, receipt.year);
        const amount = formatCurrency(receipt.amount, currency);
        const text = `Bonjour ${tenant.full_name}, votre quittance de loyer pour le mois de ${monthLabel} (${amount}) est maintenant disponible sur votre compte Samalocation. Vous pouvez la consulter et la télécharger dès maintenant sur https://samalocation.com. Merci pour votre confiance !`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Quittance Samalocation', text });
                return;
            } catch (err) { /* fallback */ }
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                {/* Header */}
                <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="truncate">Historique — {tenant.full_name}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm mt-1">
                        Consultez et téléchargez les reçus délivrés pour ce locataire.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 sm:p-6">
                    {tenantReceipts.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-muted/20">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground text-sm">Aucun reçu trouvé pour ce locataire.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── MOBILE: Card list ── */}
                            <div className="flex flex-col gap-3 sm:hidden">
                                {tenantReceipts.map((receipt) => (
                                    <div
                                        key={receipt.id}
                                        className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
                                    >
                                        {/* Top row: number + amount */}
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                {receipt.receipt_number}
                                            </span>
                                            <span className="font-bold text-primary text-sm">
                                                {formatCurrency(receipt.amount, currency)}
                                            </span>
                                        </div>

                                        {/* Period + Date */}
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="text-xs capitalize font-medium">
                                                {getMonthName(receipt.month, receipt.year)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(receipt.payment_date), "dd/MM/yyyy")}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1.5 pt-1 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 text-xs gap-1 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                                onClick={() => handlePreview(receipt)}
                                                title="Ouvrir le reçu dans un nouvel onglet"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Voir
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                                onClick={() => shareReceipt(receipt)}
                                            >
                                                <Share2 className="h-3.5 w-3.5" />
                                                Partager
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 text-xs gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                                onClick={() => handleDownload(receipt.id, receipt.receipt_number, receipt.payment_date)}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                PDF
                                            </Button>
                                        </div>
                                    </div>
                                ))}
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
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tenantReceipts.map((receipt) => (
                                            <TableRow key={receipt.id}>
                                                <TableCell className="font-mono text-xs">{receipt.receipt_number}</TableCell>
                                                <TableCell className="capitalize">
                                                    {getMonthName(receipt.month, receipt.year)}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(receipt.payment_date), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="font-semibold text-primary">
                                                    {formatCurrency(receipt.amount, currency)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                                            onClick={() => handlePreview(receipt)}
                                                            title="Ouvrir le reçu dans un nouvel onglet"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                            Voir
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 text-primary hover:bg-primary/10 border border-primary/20 bg-primary/5"
                                                            onClick={() => shareReceipt(receipt)}
                                                            title="Partager la quittance"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 shadow-sm"
                                                            onClick={() => handleDownload(receipt.id, receipt.receipt_number, receipt.payment_date)}
                                                        >
                                                            <Download className="h-4 w-4 mr-1.5" />
                                                            PDF
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
    );
};

