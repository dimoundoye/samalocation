import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Home, MapPin, Calendar, User, ChevronRight, FileText, Receipt,
    Loader2, Building2, CheckCircle2, XCircle, Clock, Download
} from "lucide-react";
import { getAllMyLeases } from "@/api/tenant";
import { getTenantContracts } from "@/api/contracts";
import { downloadReceipt } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

import { LeaseDetailModal, StatusBadge } from "./LeaseDetailModal";

type FilterStatus = "all" | "active" | "pending" | "inactive";

const TenantLeasesTab = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [allLeases, setAllLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [selectedLease, setSelectedLease] = useState<any>(null);

    useEffect(() => {
        loadAllLeases();
    }, []);

    // Gérer l'ouverture automatique via URL
    useEffect(() => {
        if (!loading && allLeases.length > 0) {
            const leaseId = searchParams.get("id");
            if (leaseId) {
                const lease = allLeases.find(l => l.id === leaseId);
                if (lease) {
                    setSelectedLease(lease);
                    // Nettoyer l'URL sans rafraîchir
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("id");
                    setSearchParams(newParams, { replace: true });
                }
            }
        }
    }, [loading, allLeases, searchParams, setSearchParams]);

    const loadAllLeases = async () => {
        setLoading(true);
        try {
            const data = await getAllMyLeases();
            setAllLeases(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading all leases:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeases = allLeases.filter(l => {
        if (filter === "all") return true;
        return l.status === filter;
    });

    const counts = {
        all: allLeases.length,
        active: allLeases.filter(l => l.status === "active").length,
        pending: allLeases.filter(l => l.status === "pending").length,
        inactive: allLeases.filter(l => l.status === "inactive").length,
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mes Logements</h2>
                    <p className="text-muted-foreground text-sm">Historique complet de vos locations</p>
                </div>
                <Badge variant="outline" className="w-fit bg-primary/5 text-primary border-primary/20">
                    {counts.all} logement(s) au total
                </Badge>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
                {(["all", "active", "pending", "inactive"] as FilterStatus[]).map((f) => {
                    const labels: Record<FilterStatus, string> = {
                        all: "Tous",
                        active: "Actifs",
                        pending: "En attente",
                        inactive: "Anciens",
                    };
                    return (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            className={`gap-2 h-9 rounded-full ${filter === f ? "gradient-primary text-white shadow-soft" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {labels[f]}
                            <span className={`text-xs ${filter === f ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"} rounded-full px-1.5 py-0.5 font-bold`}>
                                {counts[f]}
                            </span>
                        </Button>
                    );
                })}
            </div>

            {/* Liste des logements */}
            {filteredLeases.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <Home className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="font-bold text-lg">Aucun logement trouvé</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filter === "all"
                                ? "Vous n'avez aucune location enregistrée."
                                : `Aucun logement avec le statut "${filter}".`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeases.map((lease) => (
                        <Card
                            key={lease.id}
                            className={`group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 ${lease.status === "active"
                                ? "border-t-green-500"
                                : lease.status === "pending"
                                    ? "border-t-amber-500"
                                    : "border-t-muted-foreground/30 opacity-75"
                                }`}
                            onClick={() => setSelectedLease(lease)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <StatusBadge status={lease.status} />
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                <CardTitle className="text-sm font-bold leading-tight line-clamp-1 mt-2">
                                    {lease.property_name || "Logement"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lease.photo_url && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                        <img
                                            src={lease.photo_url}
                                            alt="Logement"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <p className="text-muted-foreground text-[11px] flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md line-clamp-1">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {lease.property_address || "Adresse non disponible"}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Loyer</p>
                                        <p className="text-xs font-bold text-primary">
                                            {(lease.monthly_rent || 0).toLocaleString()} F CFA
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Arrivée</p>
                                        <p className="text-xs font-medium">
                                            {lease.move_in_date
                                                ? format(new Date(lease.move_in_date), "dd/MM/yyyy")
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Cliquer pour voir reçus & baux
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de détail */}
            <LeaseDetailModal
                lease={selectedLease}
                open={!!selectedLease}
                onClose={() => setSelectedLease(null)}
            />
        </div>
    );
};

export default TenantLeasesTab;
