import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Clock, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon, User, Home, MoreHorizontal } from "lucide-react";
import { getOwnerMaintenanceRequests, updateMaintenanceRequestStatus } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const OwnerMaintenanceTab = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await getOwnerMaintenanceRequests();
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error("Owner maintenance requests data is not an array:", data);
                setRequests([]);
            }
        } catch (error) {
            console.error("Error loading maintenance requests:", error);
            setRequests([]);
            toast({
                title: "Erreur",
                description: "Impossible de charger les demandes de maintenance.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            setUpdatingId(id);
            await updateMaintenanceRequestStatus(id, newStatus);
            const statusLabels: Record<string, string> = {
                'pending': 'En attente',
                'in_progress': 'En cours',
                'resolved': 'Résolu',
                'cancelled': 'Annulé'
            };
            toast({
                title: "Statut mis à jour",
                description: `Le signalement est maintenant marqué comme : ${statusLabels[newStatus] || newStatus}`,
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de mettre à jour le statut.",
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredRequests = (Array.isArray(requests) && filterStatus === "all")
        ? requests
        : (Array.isArray(requests) ? requests.filter(r => r.status === filterStatus) : []);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: "En attente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500", icon: Clock };
            case 'in_progress':
                return { label: "En cours", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: Loader2 };
            case 'resolved':
                return { label: "Résolu", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500", icon: CheckCircle2 };
            case 'cancelled':
                return { label: "Annulé", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: AlertCircle };
            default:
                return { label: status, color: "bg-gray-100", icon: AlertCircle };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Gestion des Maintenances</h2>
                    <p className="text-muted-foreground">Suivez et résolvez les incidents de vos locataires</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filtrer :</span>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="resolved">Résolu</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (!Array.isArray(filteredRequests) || filteredRequests.length === 0) ? (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold text-lg">Aucune demande trouvée</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {filterStatus === "all"
                                ? "Aucun locataire n'a encore signalé d'incident. Bon travail !"
                                : `Aucune demande avec le statut "${filterStatus}".`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {Array.isArray(filteredRequests) && filteredRequests.map((request) => {
                        const status = getStatusInfo(request.status);
                        const StatusIcon = status.icon;

                        return (
                            <Card key={request.id} className="overflow-hidden shadow-soft hover:shadow-md transition-all">
                                <div className="p-1 md:p-0 flex flex-col md:flex-row">
                                    {/* Left Status Bar */}
                                    <div className={`w-full md:w-2 ${status.color.split(' ')[0]}`} />

                                    <div className="flex-1 p-5">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className={`${status.color} border-none`}>
                                                        <StatusIcon className={`h-3 w-3 mr-1 ${request.status === 'in_progress' ? 'animate-spin' : ''}`} />
                                                        {status.label}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                        Priorité : {request.priority === 'urgent' ? 'Urgent' :
                                                            request.priority === 'high' ? 'Haute' :
                                                                request.priority === 'medium' ? 'Moyenne' : 'Faible'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Signalé le {request.created_at ? format(new Date(request.created_at), "PPP", { locale: fr }) : "Date inconnue"}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mt-2">{request.title}</h3>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="gap-2" disabled={updatingId === request.id}>
                                                            {updatingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                                            Statut
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'pending')}>
                                                            Mettre en attente
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'in_progress')}>
                                                            Marquer "En cours"
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'resolved')}>
                                                            Marquer "Résolu"
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(request.id, 'cancelled')}>
                                                            Annuler
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                                    {request.description}
                                                </p>

                                                {Array.isArray(request.photos) && request.photos.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {request.photos.map((url: string, idx: number) => (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                                <img
                                                                    src={url}
                                                                    alt="Incident"
                                                                    className="w-20 h-20 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-muted/30 p-4 rounded-lg space-y-3 h-fit">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="h-4 w-4 text-primary" />
                                                    <span className="font-semibold">{request.tenant_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                                                    <span>{request.tenant_phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm pt-2 border-t">
                                                    <Home className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{request.property_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                                                    <span>Unité : {request.unit_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
