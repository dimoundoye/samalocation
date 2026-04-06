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
import { Download, FileText, Calendar, Send } from "lucide-react";
import { Receipt, Tenant } from "@/types";
import { downloadReceipt } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TenantHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: Tenant | null;
    receipts: Receipt[];
}

export const TenantHistoryDialog = ({
    open,
    onOpenChange,
    tenant,
    receipts,
}: TenantHistoryDialogProps) => {
    if (!tenant) return null;

    const tenantReceipts = receipts
        .filter((r) => r.tenant_id === tenant.user_id || r.tenant_id === tenant.id)
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            maximumFractionDigits: 0,
        })
            .format(amount)
            .replace("XOF", "F CFA");
    };

    const getMonthName = (month: number) => {
        const date = new Date(2000, month - 1, 1);
        return format(date, "MMMM", { locale: fr });
    };

    const handleDownload = async (receiptId: string, receiptNumber?: string, paymentDate?: string) => {
        try {
            await downloadReceipt(receiptId, receiptNumber, paymentDate);
        } catch (error) {
            // Silently fail or simple generic feedback
        }
    };

    const shareOnWhatsApp = (receipt: Receipt) => {
        if (!tenant) return;
        
        const phone = tenant.phone?.replace(/[\s\(\)\-\+]/g, '') || '';
        const monthLabel = getMonthName(receipt.month);
        const amount = formatCurrency(receipt.amount);
        
        const text = `Bonjour ${tenant.full_name}, votre quittance de loyer pour le mois de ${monthLabel} ${receipt.year} (${amount}) est maintenant disponible sur votre compte Samalocation. Vous pouvez la consulter et la télécharger dès maintenant sur https://samalocation.com. Merci pour votre confiance !`;
        
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Historique des paiements - {tenant.full_name}
                    </DialogTitle>
                    <DialogDescription>
                        Consultez et téléchargez les reçus délivrés pour ce locataire.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {tenantReceipts.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/20">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">Aucun reçu trouvé pour ce locataire.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
                                <Table className="min-w-[650px]">
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[120px]">N° Reçu</TableHead>
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
                                                {getMonthName(receipt.month)} {receipt.year}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(receipt.payment_date), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                {formatCurrency(receipt.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10"
                                                        onClick={() => shareOnWhatsApp(receipt)}
                                                        title="Partager via WhatsApp"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(receipt.id, receipt.receipt_number, receipt.payment_date)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Télécharger
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
