import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getVerifications, updateVerificationStatus } from "@/api/admin";
import { Check, X, ExternalLink, User, Clock, ShieldCheck, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VerificationsManagement = () => {
    const { toast } = useToast();
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("pending");

    useEffect(() => {
        fetchVerifications(currentTab);
    }, [currentTab]);

    const fetchVerifications = async (status: string) => {
        try {
            setLoading(true);
            const data = await getVerifications(status);
            setVerifications(data || []);
        } catch (error) {
            console.error("Error fetching verifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (ownerId: string, status: 'verified' | 'rejected') => {
        try {
            await updateVerificationStatus(ownerId, status);
            toast({
                title: status === 'verified' ? "Propriétaire vérifié" : "Demande rejetée",
                description: `Le statut a été mis à jour avec succès.`,
            });
            fetchVerifications(currentTab);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Action impossible.",
                variant: "destructive",
            });
        }
    };

    const renderTable = (data: any[], type: 'pending' | 'verified') => {
        if (loading) {
            return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
        }

        if (data.length === 0) {
            return (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-8 w-8 opacity-20" />
                    <span>Aucune demande {type === 'verified' ? 'vérifiée' : 'en attente'}</span>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Propriétaire</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>{type === 'verified' ? 'Date de vérification' : 'Date de soumission'}</TableHead>
                        <TableHead>Justificatif</TableHead>
                        <TableHead className="text-right">Statut / Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{item.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{item.company_name || "-"}</TableCell>
                            <TableCell>
                                {format(new Date(type === 'verified' ? (item.verified_at || item.updated_at) : item.updated_at), "d MMM yyyy HH:mm", { locale: fr })}
                            </TableCell>
                            <TableCell>
                                {item.id_card_url ? (
                                    <div className="flex flex-col gap-1">
                                        <a
                                            href={item.id_card_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium"
                                        >
                                            <FileText className="h-3.5 w-3.5" /> Voir le document <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic text-xs">Aucun document</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {type === 'pending' ? (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAction(item.id, 'verified')}
                                            className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Approuver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAction(item.id, 'rejected')}
                                            className="border-red-200 text-red-600 hover:bg-red-50 h-8 gap-1"
                                        >
                                            <X className="h-3.5 w-3.5" /> Rejeter
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Vérifié
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Gestion des Vérifications</h2>
                <p className="text-sm text-muted-foreground">Approuvez ou gérez les demandes d'identité des propriétaires.</p>
            </div>

            <Tabs defaultValue="pending" onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="pending">En attente</TabsTrigger>
                    <TabsTrigger value="verified">Propriétaires vérifiés</TabsTrigger>
                </TabsList>

                <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
                    <TabsContent value="pending" className="m-0 border-none outline-none">
                        {renderTable(verifications, 'pending')}
                    </TabsContent>
                    <TabsContent value="verified" className="m-0 border-none outline-none">
                        {renderTable(verifications, 'verified')}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default VerificationsManagement;
