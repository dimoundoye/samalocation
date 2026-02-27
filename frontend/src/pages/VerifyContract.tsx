import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Calendar,
    FileText,
    MapPin,
    User,
    ArrowLeft,
    Loader2,
    Lock
} from "lucide-react";
import { verifyContract } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const VerifyContract = () => {
    const { id } = useParams<{ id: string }>();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVerification = async () => {
            if (!id) {
                console.warn("VerifyContract: No ID provided in URL");
                return;
            }
            try {
                setLoading(true);
                setError(null);
                console.log(`VerifyContract: Fetching verification for ID: ${id}`);
                const data = await verifyContract(id);
                console.log("VerifyContract: Data received:", data);
                setContract(data);
            } catch (err: any) {
                console.error("VerifyContract: Fetch error:", err);
                setError(err.message || "Impossible de vérifier ce contrat.");
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground font-medium">Vérification de l'authenticité en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Samalocation
                    </Link>
                </div>

                {error ? (
                    <Card className="border-red-100 shadow-xl overflow-hidden">
                        <div className="h-2 bg-red-500" />
                        <CardContent className="pt-10 pb-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Document Non Certifié</h2>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                            <Button asChild variant="outline" className="mt-4">
                                <Link to="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-2xl overflow-hidden animate-scale-in">
                        <div className="h-3 bg-gradient-to-r from-emerald-400 to-teal-500" />
                        <CardHeader className="bg-white pt-8 text-center border-b border-slate-50">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="h-10 w-10 text-emerald-600" />
                            </div>
                            <CardTitle className="text-2xl text-slate-900">Contrat Certifié & Authentique</CardTitle>
                            <CardDescription className="text-emerald-700 font-medium">
                                Document archivé numériquement sur la plateforme Samalocation
                            </CardDescription>
                            <div className="mt-4 flex justify-center">
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 px-4 py-1 text-sm gap-1.5 uppercase tracking-wider">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {contract.status === 'active' ? 'Contrat Actif' : 'En attente'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-8">
                            {/* Main Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6 text-sm">
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-slate-500 font-medium mb-1 uppercase tracking-tight text-[10px]">Référence Contrat</p>
                                            <p className="text-slate-900 font-bold text-lg">{contract.contract_number}</p>
                                            <p className="text-[10px] text-slate-400 font-mono break-all">ID: {contract.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-slate-500 font-medium mb-1 uppercase tracking-tight text-[10px]">Type de Contrat</p>
                                            <Badge variant="outline" className={contract?.contract_type === 'premium' ? 'border-primary text-primary bg-primary/5' : 'border-slate-300 text-slate-600'}>
                                                {contract?.contract_type === 'premium' ? 'Premium 💎' : 'Standard'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-slate-500 font-medium mb-1 uppercase tracking-tight text-[10px]">Date d'effet</p>
                                            <p className="text-slate-900 font-bold">
                                                {contract?.start_date ? format(new Date(contract.start_date), 'dd MMMM yyyy', { locale: fr }) : 'Non définie'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-slate-500 font-medium mb-1 uppercase tracking-tight text-[10px]">Propriété</p>
                                            <p className="text-slate-900 font-bold">{contract?.property_name}</p>
                                            <p className="text-slate-600 text-xs">{contract?.property_address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-slate-500 font-medium mb-1 uppercase tracking-tight text-[10px]">Parties contractantes</p>
                                            <p className="text-slate-900 font-bold italic">Bailleur : <span className="not-italic">{contract?.owner_name}</span></p>
                                            <p className="text-slate-900 font-bold italic">Locataire : <span className="not-italic">{contract?.tenant_name}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Clauses Summary */}
                            <div className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-100 space-y-4">
                                <h4 className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Clauses de protection incluses
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-emerald-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                        État des lieux & Entretien (Art. 5)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                        Interdiction de sous-location
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                        Limitation d'occupation
                                    </div>
                                    {contract.contract_type === 'premium' && (
                                        <div className="flex items-center gap-2 font-bold">
                                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                            Clauses Résolutoires (Art. 6)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Digital Proof Section */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
                                <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                    <Lock className="h-4 w-4 text-emerald-600" />
                                    Preuves de validité numérique
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-lg flex flex-col gap-1 ${contract?.owner_signed ? 'bg-white shadow-sm border-l-4 border-l-emerald-500' : 'bg-slate-100 opacity-50'}`}>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Signature Bailleur</p>
                                        <p className="text-xs text-slate-700">{contract?.owner_signed ? `Confirmée le ${format(new Date(contract.owner_signed_at), 'dd/MM/yyyy HH:mm')}` : 'En attente'}</p>
                                    </div>

                                    <div className={`p-4 rounded-lg flex flex-col gap-1 ${contract?.tenant_signed ? 'bg-white shadow-sm border-l-4 border-l-emerald-500' : 'bg-slate-100 opacity-50'}`}>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Signature Locataire</p>
                                        <p className="text-xs text-slate-700">{contract?.tenant_signed ? `Confirmée le ${format(new Date(contract.tenant_signed_at), 'dd/MM/yyyy HH:mm')}` : 'En attente'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 text-center">
                                <p className="text-[10px] text-slate-400 italic">
                                    Ce document est protégé par certificat Samalocation et ne peut être falsifié.
                                    En cas de doute, veuillez contacter le support.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="text-center text-slate-400 text-sm">
                    © {new Date().getFullYear()} Samalocation. Platforme immobilière de confiance au Sénégal.
                </div>
            </div>
        </div>
    );
};

export default VerifyContract;
