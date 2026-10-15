import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Building2, MapPin, Calendar, User, Receipt, FileText, Download, Eye, ExternalLink, Loader2,
    CheckCircle2, Clock, XCircle, CreditCard, AlertCircle, Info, ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getTenantContracts } from "@/api/contracts";
import { downloadReceipt, openReceiptInNewTab, downloadContract, openContractInNewTab } from "@/lib/api";
import { ReceiptPreviewModal } from "@/components/receipts/ReceiptPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { isDepositReceipt, isPaidRentReceipt } from "@/lib/deposits";
import { TenantDepositsPanel } from "./TenantDepositsPanel";
import { RENT_ONLINE_PAYMENT_ENABLED } from "@/lib/features";
import { RentPaymentPanel } from "./RentPaymentPanel";

export const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "active":
            return (
                <Badge variant="outline" className="bg-white text-green-600 border-green-200 gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Actif
                </Badge>
            );
        case "pending":
            return (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                    <Clock className="w-3 h-3" /> En attente
                </Badge>
            );
        case "inactive":
            return (
                <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" /> Inactif
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

interface LeaseDetailModalProps {
    lease: any;
    open: boolean;
    onClose: () => void;
    currency?: string;
}

export const LeaseDetailModal = ({ lease, open, onClose, currency = 'XOF' }: LeaseDetailModalProps) => {
    const { toast } = useToast();
    const [contracts, setContracts] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("receipts");
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [reasonModalOpen, setReasonModalOpen] = useState(false);
    const [selectedReasonReceipt, setSelectedReasonReceipt] = useState<any>(null);

    const getMonthName = (monthNum: number) => {
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        return months[monthNum - 1] || "N/A";
    };

    // L'onglet « Reçus » ne liste que les loyers ; les cautions ont leur propre onglet
    const rentReceipts = useMemo(() => receipts.filter(r => !isDepositReceipt(r)), [receipts]);
    const depositReceipts = useMemo(() => receipts.filter(r => isDepositReceipt(r)), [receipts]);

    const latestPaid = useMemo(() => {
        // Dernier loyer payé : ni reçu annulé ni caution
        const validReceipts = receipts.filter(r => isPaidRentReceipt(r));
        if (validReceipts.length === 0) return null;
        return [...validReceipts].sort((a, b) => {
            const dateA = (a.year || 0) * 12 + (a.month || 1);
            const dateB = (b.year || 0) * 12 + (b.month || 1);
            return dateB - dateA;
        })[0];
    }, [receipts]);

    useEffect(() => {
        if (latestPaid) {
            let nextMonth = (latestPaid.month || 1) + 1;
            let nextYear = latestPaid.year;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }
            setSelectedMonth(nextMonth);
            setSelectedYear(nextYear);
        } else {
            setSelectedMonth(new Date().getMonth() + 1);
            setSelectedYear(new Date().getFullYear());
        }
    }, [latestPaid]);

    useEffect(() => {
        if (open && lease) {
            loadDetails();
        }
    }, [open, lease]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const [contractsData, receiptsRes] = await Promise.allSettled([
                getTenantContracts(),
                fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/receipts/tenant`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                }).then(r => r.json())
            ]);

            if (contractsData.status === "fulfilled") {
                const allContracts = contractsData.value || [];
                setContracts(allContracts.filter((c: any) =>
                    c.tenant_id === lease.id || 
                    (c.property_id === lease.property_id && (c.tenant_user_id === lease.user_id || c.tenant_id === lease.id))
                ));
            }

            if (receiptsRes.status === "fulfilled") {
                const allReceipts = receiptsRes.value?.data || [];
                setReceipts(allReceipts.filter((r: any) => 
                    (r.tenant_id === lease.id) || 
                    (r.tenant_id === lease.user_id && r.property_id === lease.property_id)
                ));
            }
        } catch (err) {
            console.error("Error loading lease details:", err);
        } finally {
            setLoading(false);
        }
    };

    const [selectedPreviewReceipt, setSelectedPreviewReceipt] = useState<{ id: string; number?: string; date?: string } | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const handlePreview = async (receipt: any) => {
        try {
            await openReceiptInNewTab(receipt.id);
        } catch (e) {
            console.error("Error opening receipt in new tab:", e);
        }
    };

    const handleDownload = async (receiptId: string) => {
        try {
            await downloadReceipt(receiptId);
        } catch {
            toast({ title: "Erreur", description: "Impossible de télécharger le reçu.", variant: "destructive" });
        }
    };

    if (!lease) return null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="w-5 h-5 text-primary" />
                        {lease.property_name}
                    </DialogTitle>
                </DialogHeader>

                <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{lease.property_address || "Adresse non disponible"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={lease.status} />
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Arrivée : {lease.move_in_date ? format(new Date(lease.move_in_date), "dd MMM yyyy", { locale: fr }) : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Propriétaire : {lease.owner_name || "N/A"}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Loyer mensuel</span>
                        <span className="text-base font-black text-primary">
                            {formatCurrency(lease.monthly_rent || 0, currency)}
                        </span>
                    </div>
                </div>

                {/* Paiement du loyer : en ligne via PayDunya si activé, sinon paiement direct au bailleur */}
                {RENT_ONLINE_PAYMENT_ENABLED ? (() => {
                    const rentAmount = parseFloat(lease.monthly_rent) || 0;
                    const feeAmount = rentAmount * 0.025;
                    const totalAmount = rentAmount + feeAmount;

                    const handlePayment = async () => {
                        setPaymentLoading(true);
                        try {
                            const token = localStorage.getItem("auth_token");
                            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/payment/rent/request`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    tenantId: lease.user_id || lease.tenant_id,
                                    propertyId: lease.property_id,
                                    unitId: lease.unit_id,
                                    month: selectedMonth,
                                    year: selectedYear
                                })
                            });

                            const data = await response.json();
                            if (response.ok && data.status === "success" && data.data?.redirect_url) {
                                toast({
                                    title: "Redirection en cours...",
                                    description: "Vous allez être redirigé vers le guichet de paiement sécurisé.",
                                });
                                window.location.href = data.data.redirect_url;
                            } else {
                                toast({
                                    title: "Paiement impossible",
                                    description: data.message || "Une erreur est survenue.",
                                    variant: "destructive"
                                });
                            }
                        } catch (error) {
                            console.error("Payment initiation failed:", error);
                            toast({
                                title: "Erreur réseau",
                                description: "Impossible de joindre le serveur.",
                                variant: "destructive"
                            });
                        } finally {
                            setPaymentLoading(false);
                        }
                    };

                    return (
                        <div className="border rounded-xl p-4 bg-primary/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Régler mon loyer en ligne
                                </h4>
                                <Badge variant="outline" className="text-[10px] bg-white text-primary border-primary/20">
                                    PayDunya Secure
                                </Badge>
                            </div>

                            {lease.ownerProfile?.online_payment_enabled ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Mois</label>
                                            <select 
                                                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            >
                                                {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, idx) => (
                                                    <option key={idx} value={idx + 1}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Année</label>
                                            <select 
                                                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            >
                                                {[2025, 2026, 2027, 2028].map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-xs bg-white rounded-lg p-2.5 border border-primary/10">
                                        {latestPaid && (
                                            <div className="flex justify-between text-muted-foreground border-b pb-1.5 mb-1.5 font-medium">
                                                <span>Dernier loyer payé :</span>
                                                <span className="text-green-600 font-bold">{getMonthName(latestPaid.month)} {latestPaid.year}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Loyer :</span>
                                            <span>{formatCurrency(rentAmount, currency)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Frais de service en ligne (2,5%) :</span>
                                            <span>{formatCurrency(feeAmount, currency)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t pt-1.5 text-foreground">
                                            <span>Total à payer :</span>
                                            <span className="text-primary font-black">{formatCurrency(totalAmount, currency)}</span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full text-xs font-semibold h-9 rounded-lg"
                                        onClick={handlePayment}
                                        disabled={paymentLoading}
                                    >
                                        {paymentLoading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                                Initialisation...
                                            </>
                                        ) : (
                                            "Procéder au paiement (Wave, OM, Visa)"
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200/50 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-orange-600 mt-0.5" />
                                    <p className="leading-relaxed">
                                        Les paiements en ligne ne sont pas activés par votre bailleur pour ce logement. 
                                        Veuillez le contacter directement pour convenir d'un autre mode de règlement.
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })() : (
                    // Paiement direct au bailleur avec ses coordonnées
                    <RentPaymentPanel lease={lease} currency={currency} />
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="w-full bg-muted/40 p-1 rounded-xl">
                        <TabsTrigger 
                            value="receipts" 
                            className="flex-1 min-w-0 gap-1 sm:gap-2 px-1.5 sm:px-3 text-xs sm:text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                        >
                            <Receipt className="hidden sm:block w-4 h-4 shrink-0" />
                            Reçus
                            {rentReceipts.length > 0 && (
                                <Badge
                                    className={cn(
                                        "h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs transition-colors border-none shrink-0",
                                        activeTab === "receipts"
                                            ? "bg-white text-primary hover:bg-white"
                                            : "bg-slate-100 text-slate-900"
                                    )}
                                >
                                    {rentReceipts.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="deposit"
                            className="flex-1 min-w-0 gap-1 sm:gap-2 px-1.5 sm:px-3 text-xs sm:text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                        >
                            <ShieldCheck className="hidden sm:block w-4 h-4 shrink-0" />
                            Caution
                        </TabsTrigger>
                        <TabsTrigger 
                            value="contracts" 
                            className="flex-1 min-w-0 gap-1 sm:gap-2 px-1.5 sm:px-3 text-xs sm:text-sm rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                        >
                            <FileText className="hidden sm:block w-4 h-4 shrink-0" />
                            Contrats
                            {contracts.length > 0 && (
                                <Badge 
                                    className={cn(
                                        "h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs transition-colors border-none shrink-0",
                                        activeTab === "contracts"
                                            ? "bg-white text-primary hover:bg-white"
                                            : "bg-slate-100 text-slate-900"
                                    )}
                                >
                                    {contracts.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4">
                        {loading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="deposit" className="mt-0">
                                    <TenantDepositsPanel deposits={depositReceipts} currency={currency} compact />
                                </TabsContent>

                                <TabsContent value="receipts" className="mt-0 space-y-3">
                                    {rentReceipts.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Aucun reçu pour ce logement</p>
                                        </div>
                                    ) : (
                                        rentReceipts.map((r: any) => {
                                            const periodLabel = r.period_label || (r.month && r.year ? `${getMonthName(r.month)} ${r.year}` : format(new Date(r.created_at), "MMMM yyyy", { locale: fr }));
                                            const isCancelled = r.status === 'cancelled';
                                            return (
                                                <div key={r.id} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${
                                                    isCancelled ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40 opacity-85' : 'hover:bg-accent'
                                                }`}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold capitalize">
                                                                {periodLabel}
                                                            </p>
                                                            {isCancelled && (
                                                                <Badge variant="destructive" className="text-[10px] font-bold uppercase bg-red-600 text-white">
                                                                    ANNULÉ
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs ${isCancelled ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                                            {formatCurrency(r.amount || r.monthly_rent || 0, currency)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1.5 h-8 text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                                            onClick={() => handlePreview(r)}
                                                            title="Ouvrir le reçu dans un nouvel onglet"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            Voir
                                                        </Button>
                                                        {isCancelled ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1.5 h-8 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 font-semibold"
                                                                onClick={() => {
                                                                    setSelectedReasonReceipt(r);
                                                                    setReasonModalOpen(true);
                                                                }}
                                                                title="Voir le motif d'annulation"
                                                            >
                                                                <Info className="w-3.5 h-3.5" />
                                                                Motif
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1.5 h-8 text-xs"
                                                                onClick={() => handleDownload(r.id)}
                                                                title="Télécharger le PDF"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                PDF
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </TabsContent>

                                <TabsContent value="contracts" className="mt-0 space-y-3">
                                    {contracts.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Aucun bail pour ce logement</p>
                                        </div>
                                    ) : (
                                        contracts.map((c: any) => (
                                            <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent transition-colors">
                                                <div>
                                                    <p className="text-sm font-semibold">{c.title || "Bail de location"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Signé le : {c.signed_at ? format(new Date(c.signed_at), "dd/MM/yyyy") : "En attente"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1.5 h-8 text-xs bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-semibold"
                                                        onClick={() => openContractInNewTab(c.id)}
                                                        title="Ouvrir le contrat dans un nouvel onglet"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        Voir
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1.5 h-8 text-xs"
                                                        onClick={() => downloadContract(c.id, c.contract_number || 'bylocation')}
                                                        title="Télécharger le PDF"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        PDF
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </ScrollArea>
                </Tabs>
            </DialogContent>
            <ReceiptPreviewModal
                open={previewModalOpen}
                onOpenChange={setPreviewModalOpen}
                receiptId={selectedPreviewReceipt?.id || null}
                receiptNumber={selectedPreviewReceipt?.number}
                paymentDate={selectedPreviewReceipt?.date}
            />

            {/* Modal Motif d'annulation */}
            <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-lg shrink-0">
                                <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>Motif d'annulation de la quittance</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Quittance N° <span className="font-mono font-semibold text-foreground">{selectedReasonReceipt?.receipt_number}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2">
                            <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                                Raison d'annulation :
                            </p>
                            <p className="text-sm font-medium text-red-950 dark:text-red-100 leading-relaxed whitespace-pre-wrap">
                                "{selectedReasonReceipt?.cancellation_reason || 'Aucun motif renseigné'}"
                            </p>
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
        </Dialog>
    );
};
