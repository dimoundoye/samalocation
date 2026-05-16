import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Loader2, User, Eye, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getSharedDossiers, getSharedDossierDetails, updateSharedDossierStatus } from "@/api/dossier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const OwnerSharedDossiersTab = () => {
    const [dossiers, setDossiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDossier, setSelectedDossier] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { hasFeature } = useSubscription();
    const canConsult = hasFeature('dossier_consultation');

    useEffect(() => {
        loadDossiers();
    }, []);

    const loadDossiers = async () => {
        try {
            const data = await getSharedDossiers();
            setDossiers(data);
        } catch (error) {
            console.error("Error loading shared dossiers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (dossierId: string) => {
        if (!canConsult) {
            toast({
                title: "Fonctionnalité Premium",
                description: "La consultation détaillée des dossiers (documents PDF, fiches de paie, etc.) est réservée aux abonnés Premium.",
                variant: "default",
            });
            navigate("/owner-dashboard/subscription");
            return;
        }

        try {
            setDetailsLoading(true);
            const details = await getSharedDossierDetails(dossierId);
            setSelectedDossier(details);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de charger les détails du dossier.",
                variant: "destructive"
            });
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleUpdateStatus = async (dossierId: string, newStatus: string) => {
        try {
            await updateSharedDossierStatus(dossierId, newStatus);
            toast({
                title: "Statut mis à jour",
                description: `Le dossier a été marqué comme : ${
                    newStatus === 'accepted' ? 'Accepté' : 
                    newStatus === 'rejected' ? 'Refusé' : 'En attente'
                }`,
            });
            loadDossiers();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut.",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Accepté</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Refusé</Badge>;
            default:
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">En attente</Badge>;
        }
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Dossiers Locatifs Partagés</h2>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {dossiers.length} Candidatures Rapides
                </Badge>
            </div>

            {!canConsult && dossiers.length > 0 && (
                <Alert className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Shield className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold text-primary flex items-center gap-2">
                        Fonctionnalité Premium
                        <Badge className="bg-primary text-white text-[10px] h-4">OFFRE</Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-sm">
                            Vous avez reçu <strong>{dossiers.length} dossier(s)</strong> de candidats. Pour consulter les documents (CNI, fiches de paie) et les détails complets, vous devez passer à un abonnement <strong>Premium</strong>.
                        </p>
                        <Button 
                            size="sm" 
                            className="gradient-accent text-white font-bold shrink-0 shadow-soft hover:shadow-medium transition-all"
                            onClick={() => navigate("/owner-dashboard/subscription")}
                        >
                            Passer Premium
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {dossiers.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <h3 className="font-bold text-lg">Aucun dossier partagé</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                            Les dossiers partagés par les candidats via la "Candidature Rapide" apparaîtront ici.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dossiers.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{item.tenant_name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">{item.tenant_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(item.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Profession</p>
                                        <p className="text-sm font-medium">{item.profession}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Revenus</p>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(item.monthly_income || 0)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t gap-2">
                                    <div className="flex gap-1">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(item.dossier_id, 'accepted')}
                                            className="h-8 px-2 text-[10px] sm:text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 gap-1 sm:gap-2 sm:px-3"
                                        >
                                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Accepter</span>
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(item.dossier_id, 'rejected')}
                                            className="h-8 px-2 text-[10px] sm:text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1 sm:gap-2 sm:px-3"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Refuser</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                            {format(new Date(item.shared_at), 'dd/MM/yyyy')}
                                        </span>
                                        <Button 
                                             size="sm" 
                                             onClick={() => handleViewDetails(item.dossier_id)}
                                             className={`h-8 gap-2 ${!canConsult ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                                         >
                                             {!canConsult ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                             {!canConsult ? "Débloquer" : "Détails"}
                                         </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Détails du Dossier */}
            <Dialog open={!!selectedDossier} onOpenChange={(open) => !open && setSelectedDossier(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedDossier && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Dossier de {dossiers.find(d => d.dossier_id === selectedDossier.id)?.tenant_name}
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6 pt-4">
                                {/* Situation Pro */}
                                <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Situation Professionnelle
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Employeur / École</p>
                                            <p className="font-medium">{selectedDossier.employer_name || "Non renseigné"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contrat</p>
                                            <p className="font-medium">{selectedDossier.contract_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Nombre d'occupants</p>
                                            <p className="font-medium">{selectedDossier.occupants_count || 1} personne(s)</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Statut matrimonial</p>
                                            <p className="font-medium">{selectedDossier.marital_status || "Célibataire"}</p>
                                        </div>
                                        {selectedDossier.guarantor_relationship && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Garant</p>
                                                <p className="font-medium text-primary">{selectedDossier.guarantor_relationship}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="space-y-3">
                                    <h3 className="font-bold">Documents Justificatifs</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedDossier.cni_url && (
                                            <a href={selectedDossier.cni_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium">Pièce d'Identité</span>
                                                </div>
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </a>
                                        )}
                                        {selectedDossier.last_three_payslips?.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium">Fiche de paie #{i+1}</span>
                                                </div>
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </a>
                                        ))}
                                        {selectedDossier.proof_of_residence_url && (
                                            <a href={selectedDossier.proof_of_residence_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium">Justificatif de domicile</span>
                                                </div>
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {selectedDossier.has_guarantor && (
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4" />
                                            Informations Garant
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Ce candidat dispose d'un garant.</p>
                                    </div>
                                )}

                                <div className="pt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <AlertCircle className="w-4 h-4" />
                                    Ces documents sont confidentiels et réservés à votre usage exclusif pour l'étude de ce dossier.
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OwnerSharedDossiersTab;
