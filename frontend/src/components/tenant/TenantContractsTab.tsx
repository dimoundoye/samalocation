import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { getTenantContracts, signContract, downloadContract } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RentalContract } from "@/types";

export const TenantContractsTab = () => {
    const { toast } = useToast();
    const [contracts, setContracts] = useState<RentalContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [signingId, setSigningId] = useState<string | null>(null);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        try {
            setLoading(true);
            const data = await getTenantContracts();
            setContracts(data);
        } catch (error) {
            console.error("Error loading contracts:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger vos contrats",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async (contractId: string) => {
        if (!confirm("En signant ce contrat, vous acceptez les termes et conditions définis. Voulez-vous continuer ?")) {
            return;
        }

        try {
            setSigningId(contractId);
            await signContract(contractId);
            toast({
                title: "Succès",
                description: "Contrat signé avec succès",
            });
            loadContracts();
        } catch (error) {
            console.error("Error signing contract:", error);
            toast({
                title: "Erreur",
                description: "La signature du contrat a échoué",
                variant: "destructive"
            });
        } finally {
            setSigningId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">Vous n'avez aucun contrat de location pour le moment.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Redundant title removed */}

            <div className="grid gap-6">
                {contracts.map((contract) => (
                    <Card key={contract.id} className="overflow-hidden border-l-4 border-l-primary">
                        <div className="md:flex">
                            <div className="flex-1 p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <CardTitle className="text-xl mb-1">
                                            Contrat de bail - {contract.property_name}
                                        </CardTitle>
                                        <CardDescription>
                                            Réf: {contract.contract_number} • Unité {contract.unit_number}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {contract.status === 'active' ? (
                                            <Badge className="bg-green-500 gap-1">
                                                <CheckCircle className="h-3 w-3" /> Actif
                                            </Badge>
                                        ) : contract.status === 'pending_signature' ? (
                                            <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1">
                                                <Clock className="h-3 w-3" /> Signature attendue
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">{contract.status}</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-y my-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Date d'effet</p>
                                        <p className="text-sm font-semibold">{format(new Date(contract.start_date), 'dd MMMM yyyy', { locale: fr })}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Loyer mensuel</p>
                                        <p className="text-sm font-semibold">{Number(contract.rent_amount).toLocaleString()} F CFA</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Caution</p>
                                        <p className="text-sm font-semibold">{Number(contract.deposit_amount).toLocaleString()} F CFA</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Propriétaire</p>
                                        <p className="text-sm font-semibold">{contract.owner_name}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        className="gap-2 w-full sm:w-auto"
                                        onClick={() => downloadContract(contract.id, contract.contract_number)}
                                    >
                                        <Download className="h-4 w-4" /> Voir le PDF
                                    </Button>

                                    {!contract.tenant_signed && contract.status === 'pending_signature' && (
                                        <Button
                                            className="gap-2 w-full sm:w-auto"
                                            onClick={() => handleSign(contract.id)}
                                            disabled={signingId === contract.id}
                                        >
                                            {signingId === contract.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                            Signer le contrat
                                        </Button>
                                    )}

                                    {contract.tenant_signed && (
                                        <div className="flex items-center text-green-600 font-medium text-xs gap-1 py-1 sm:ml-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Signé le {format(new Date(contract.tenant_signed_at!), 'dd/MM/yyyy')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                    <strong>Note juridique :</strong> La signature électronique effectuée sur cette plateforme a valeur d'acceptation
                    numérique des conditions du bail. Elle vous engage au même titre qu'une signature manuscrite.
                </p>
            </div>
        </div>
    );
};
