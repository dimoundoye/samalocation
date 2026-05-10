import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Building2, MapPin, Calendar, User, Receipt, FileText, Download, Loader2,
    CheckCircle2, Clock, XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getTenantContracts } from "@/api/contracts";
import { downloadReceipt } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "active":
            return (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Actif
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
}

export const LeaseDetailModal = ({ lease, open, onClose }: LeaseDetailModalProps) => {
    const { toast } = useToast();
    const [contracts, setContracts] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
                            {(lease.monthly_rent || 0).toLocaleString()} F CFA
                        </span>
                    </div>
                </div>

                <Tabs defaultValue="receipts" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="w-full">
                        <TabsTrigger value="receipts" className="flex-1 gap-2">
                            <Receipt className="w-4 h-4" />
                            Reçus de paiement
                            {receipts.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">{receipts.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="contracts" className="flex-1 gap-2">
                            <FileText className="w-4 h-4" />
                            Baux / Contrats
                            {contracts.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">{contracts.length}</Badge>
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
                                <TabsContent value="receipts" className="mt-0 space-y-3">
                                    {receipts.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Aucun reçu pour ce logement</p>
                                        </div>
                                    ) : (
                                        receipts.map((r: any) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent transition-colors">
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {r.period_label || format(new Date(r.created_at), "MMMM yyyy", { locale: fr })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(r.amount || r.monthly_rent || 0).toLocaleString()} F CFA
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2 h-8 text-xs"
                                                    onClick={() => handleDownload(r.id)}
                                                >
                                                    <Download className="w-3 h-3" />
                                                    PDF
                                                </Button>
                                            </div>
                                        ))
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
                                                {c.pdf_url && (
                                                    <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" asChild>
                                                        <a href={c.pdf_url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="w-3 h-3" />
                                                            PDF
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
