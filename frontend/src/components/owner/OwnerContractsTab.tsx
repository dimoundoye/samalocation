import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Plus, Search, Loader2, AlertCircle, Info, AlertTriangle, Send, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getOwnerContracts, downloadContract } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RentalContract } from "@/types";
import { CreateContractDialog } from "./CreateContractDialog";

export const OwnerContractsTab = () => {
    const { toast } = useToast();
    const [contracts, setContracts] = useState<RentalContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        loadContracts();
    }, []);

    const shareOnWhatsApp = (contract: RentalContract) => {
        const verifyUrl = `https://samalocation.com/verify/contract/${contract.id}`;

        let message = `Bonjour ${contract.tenant_name}, voici votre contrat de location pour ${contract.property_name} (Unité ${contract.unit_number}). `;

        if (contract.status === 'pending_signature') {
            message += `Il est en attente de votre signature numérique.Vous pouvez la consulter et la télécharger dès maintenant sur https://samalocation.com dans la section mes contrats.`;
        } else {
            message += `Vous pouvez consulter et vérifier sa validité ici : ${verifyUrl} . Merci d'utiliser Samalocation.com !`;
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    const loadContracts = async () => {
        try {
            setLoading(true);
            const data = await getOwnerContracts();
            setContracts(data);
        } catch (error) {
            console.error("Error loading contracts:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les contrats",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredContracts = contracts.filter(c =>
        c.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contract_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Actif</Badge>;
            case 'pending_signature':
                return <Badge variant="outline" className="text-amber-600 border-amber-600">Attente signature</Badge>;
            case 'terminated':
                return <Badge variant="secondary">Terminé</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="font-bold text-xs">Rappel : Enregistrement DGID</AlertTitle>
                    <AlertDescription className="text-[10px] leading-tight">
                        Pour être pleinement opposable, tout contrat de bail au Sénégal doit être enregistré auprès des services fiscaux (DGID) et les signatures légalisées à la mairie ou sous-préfecture.
                    </AlertDescription>
                </Alert>

                <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="font-bold text-xs uppercase tracking-tight">Pour local & garage</AlertTitle>
                    <AlertDescription className="text-[10px] leading-tight">
                        Samalocation ne fournit pas de modèle de contrat pour les locaux commerciaux ou garages. Les parties doivent établir un contrat adapté.
                    </AlertDescription>
                </Alert>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un contrat, locataire..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto gap-2">
                    <Plus className="h-4 w-4" /> Nouveau Contrat
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Liste des contrats de location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">Aucun contrat trouvé</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {filteredContracts.map((contract) => (
                                    <div key={contract.id} className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{contract.contract_number}</div>
                                                <div className="font-semibold text-lg">{contract.property_name}</div>
                                                <div className="text-xs text-muted-foreground">Unité {contract.unit_number}</div>
                                            </div>
                                            {getStatusBadge(contract.status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 py-2 border-y border-dashed">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Locataire</div>
                                                <div className="text-sm font-medium">{contract.tenant_name}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Loyer</div>
                                                <div className="text-sm font-medium text-primary">{Number(contract.rent_amount).toLocaleString('fr-FR')} F</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-1">
                                            <div className="text-xs text-muted-foreground">
                                                Début : {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: fr })}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => shareOnWhatsApp(contract)}
                                                    className="gap-2 h-8 text-green-600 border-green-200 hover:bg-green-50"
                                                >
                                                    <Send className="h-3.5 w-3.5" /> Partager
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadContract(contract.id, contract.contract_number)}
                                                    className="gap-2 h-8"
                                                >
                                                    <Download className="h-3.5 w-3.5" /> PDF
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N° Contrat</TableHead>
                                            <TableHead>Bien</TableHead>
                                            <TableHead>Locataire</TableHead>
                                            <TableHead>Début</TableHead>
                                            <TableHead>Loyer</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredContracts.map((contract) => (
                                            <TableRow key={contract.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{contract.contract_number}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[80px]" title={contract.id}>ID: {contract.id.substring(0, 8)}...</span>
                                                        <Badge variant="outline" className={`w-fit mt-1 text-[9px] px-1 py-0 h-4 ${contract.contract_type === 'premium' ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground'}`}>
                                                            {contract.contract_type === 'premium' ? 'Premium 💎' : 'Standard'}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{contract.property_name}</span>
                                                        <span className="text-xs text-muted-foreground">Unité {contract.unit_number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{contract.tenant_name}</TableCell>
                                                <TableCell>{format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                                                <TableCell>{Number(contract.rent_amount).toLocaleString('fr-FR')} F</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {getStatusBadge(contract.status)}
                                                        {contract.status === 'active' && (
                                                            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                                                                <AlertCircle className="h-3 w-3" /> À légaliser
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => shareOnWhatsApp(contract)}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        title="Partager sur WhatsApp"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => downloadContract(contract.id, contract.contract_number)}
                                                        title="Télécharger"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateContractDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={loadContracts}
                propertyId="" // To be improved: selected from a list if empty
                propertyName="un bien"
            />
        </div>
    );
};
