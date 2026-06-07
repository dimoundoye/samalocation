import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    FileText, Plus, Pencil, Trash2, Loader2, AlertTriangle, Lock, Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    ContractTemplate,
    getContractTemplates,
    deleteContractTemplate
} from "@/api/contractTemplates";

interface ContractTemplatesManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isProfessional?: boolean;
}

export function ContractTemplatesManager({
    open,
    onOpenChange,
    isProfessional = false,
}: ContractTemplatesManagerProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && isProfessional) {
            loadTemplates();
        }
    }, [open, isProfessional]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await getContractTemplates();
            setTemplates(data);
        } catch (err: any) {
            if (!err.message?.includes("403")) {
                toast({ title: "Erreur", description: "Impossible de charger les modèles.", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer ce modèle de contrat ?")) return;
        try {
            await deleteContractTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast({ title: "Modèle supprimé" });
        } catch (err: any) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Mes modèles de contrat
                        <Badge className="ml-2 text-xs bg-amber-500 text-white gap-1">
                            <Crown className="h-3 w-3" /> Professionnel
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {!isProfessional && (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                                <Lock className="h-8 w-8 text-amber-500" />
                            </div>
                            <h3 className="font-semibold text-xl">Fonctionnalité réservée</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Les modèles de contrat personnalisés sont disponibles uniquement pour les abonnés au plan <strong>Professionnel</strong>.
                            </p>
                            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 mt-2">
                                <Crown className="h-4 w-4" /> Passer au plan Professionnel
                            </Button>
                        </div>
                    )}

                    {isProfessional && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Créez et gérez vos propres modèles de bail. Vous pourrez les utiliser à la place du modèle standard lors de la création d'un contrat.
                                </p>
                                <Button onClick={() => navigate("/owner-dashboard/contracts/contract-editor")} className="gap-2 shrink-0 ml-4">
                                    <Plus className="h-4 w-4" /> Nouveau modèle
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                                    <p className="text-muted-foreground">Aucun modèle de contrat pour l'instant.</p>
                                    <p className="text-xs text-muted-foreground">
                                        Créez votre premier modèle ou importez un PDF / fichier Word existant.
                                    </p>
                                    <Button variant="outline" onClick={() => navigate("/owner-dashboard/contracts/contract-editor")} className="gap-2 mt-2">
                                        <Plus className="h-4 w-4" /> Créer mon premier modèle
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {templates.map(template => (
                                        <Card key={template.id} className="group hover:shadow-md transition-shadow border">
                                            <CardContent className="p-4 flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{template.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Modifié le {format(new Date(template.updated_at), "dd MMM yyyy", { locale: fr })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary"
                                                        onClick={() => navigate(`/owner-dashboard/contracts/contract-editor/${template.id}`)}
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        onClick={() => handleDelete(template.id)}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 items-start bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md p-3 text-xs text-amber-800 dark:text-amber-200 mt-4">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>
                                    Vos modèles personnalisés remplacent le modèle standard lors de la création d'un contrat. Samalocation n'est pas responsable du contenu juridique de vos modèles. Consultez un professionnel du droit si nécessaire.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
