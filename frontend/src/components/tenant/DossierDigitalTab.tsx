import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, CheckCircle2, AlertCircle, Building2, Briefcase, Wallet, Users, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getMyDossier, saveDossier, getMyShares, revokeShare, TenantDossier } from "@/api/dossier";
import { baseClient } from "@/api/baseClient";
import { Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DossierDigitalTab = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shares, setShares] = useState<any[]>([]);
    const [loadingShares, setLoadingShares] = useState(true);
    const [dossier, setDossier] = useState<Partial<TenantDossier>>({
        profession: "",
        contract_type: "CDI",
        employer_name: "",
        monthly_income: 0,
        last_three_payslips: [],
        has_guarantor: false,
        guarantor_info: {},
        occupants_count: 1,
        guarantor_relationship: "",
        marital_status: "Célibataire"
    });

    useEffect(() => {
        loadDossier();
        loadShares();
    }, []);

    const loadDossier = async () => {
        try {
            const data = await getMyDossier();
            if (data) setDossier(data);
        } catch (error) {
            console.error("Failed to load dossier:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadShares = async () => {
        try {
            setLoadingShares(true);
            const data = await getMyShares();
            setShares(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load shares:", error);
        } finally {
            setLoadingShares(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('photos', file));

        try {
            toast({ title: "Téléchargement...", description: "Veuillez patienter." });
            const responseData = await baseClient('/upload', {
                method: 'POST',
                body: formData
            });

            if (field === 'last_three_payslips') {
                setDossier(prev => ({
                    ...prev,
                    last_three_payslips: [...(prev.last_three_payslips || []), ...(responseData?.urls || [])]
                }));
            } else {
                if (responseData?.urls?.[0]) {
                    setDossier(prev => ({ ...prev, [field]: responseData.urls[0] }));
                }
            }

            toast({ title: "Succès", description: "Document ajouté au dossier." });
        } catch (error) {
            toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveDossier(dossier);
            toast({ title: "Dossier enregistré", description: "Vos informations ont été mises à jour." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'enregistrer.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleRevoke = async (ownerId: string, propertyId?: string) => {
        try {
            await revokeShare(ownerId, propertyId);
            toast({ title: "Accès révoqué", description: "Le propriétaire n'a plus accès à votre dossier." });
            loadShares();
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de révoquer l'accès.", variant: "destructive" });
        }
    };

    const calculateCompletion = () => {
        let score = 0;
        if (dossier.profession) score += 20;
        if (dossier.monthly_income) score += 20;
        if (dossier.cni_url) score += 20;
        if (dossier.last_three_payslips?.length) score += 20;
        if (dossier.proof_of_residence_url) score += 20;
        if (dossier.occupants_count) score += 5;
        return Math.min(100, score);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const completion = calculateCompletion();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Mon Dossier Digital</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Vos données sont chiffrées et sécurisées.
                    </p>
                </div>
                <div className="bg-card p-4 rounded-2xl border shadow-sm min-w-[200px]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Complétion</span>
                        <span className="text-sm font-bold text-primary">{completion}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completion}%` }}
                            className="h-full bg-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-4">
                    <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-0">
                            <div className="p-6 bg-primary/5">
                                <h3 className="font-bold mb-1">Pourquoi ce dossier ?</h3>
                                <p className="text-xs text-muted-foreground">Postulez instantanément sans renvoyer vos documents à chaque fois.</p>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span>Gain de temps (One-Click)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <span>Données protégées</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shared Access Section */}
                    <Card className="overflow-hidden border-amber-200">
                        <CardContent className="p-0">
                            <div className="p-6 bg-amber-100/50">
                                <h3 className="font-bold mb-1 text-amber-900">Partages actifs</h3>
                                <p className="text-xs text-amber-800 font-medium">Propriétaires ayant actuellement accès à vos documents.</p>
                            </div>
                            <div className="p-4 space-y-4">
                                {loadingShares ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                                    </div>
                                ) : shares.length === 0 ? (
                                    <p className="text-center py-4 text-xs text-muted-foreground">Aucun partage actif</p>
                                ) : (
                                    shares.map((share) => (
                                        <div key={`${share.owner_id}-${share.property_id}`} className="flex flex-col gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{share.owner_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{share.owner_email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRevoke(share.owner_id, share.property_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] text-muted-foreground uppercase font-medium">Partagé le</span>
                                                <span className="text-[9px] font-bold">
                                                    {format(new Date(share.shared_at), "dd MMM yyyy", { locale: fr })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Form Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Section: Profession */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Situation Professionnelle</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card p-6 rounded-3xl border">
                            <div className="space-y-2">
                                <Label>Profession</Label>
                                <Input
                                    placeholder="Ex: Comptable, Développeur..."
                                    value={dossier.profession}
                                    onChange={(e) => setDossier({ ...dossier, profession: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Revenu Mensuel</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 500000"
                                    value={dossier.monthly_income}
                                    onChange={(e) => setDossier({ ...dossier, monthly_income: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type de contrat</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                    value={dossier.contract_type}
                                    onChange={(e) => setDossier({ ...dossier, contract_type: e.target.value })}
                                >
                                    <option value="CDI">CDI</option>
                                    <option value="CDD">CDD</option>
                                    <option value="Freelance">Freelance / Indépendant</option>
                                    <option value="Etudiant">Étudiant</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Statut Matrimonial</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border bg-background"
                                    value={dossier.marital_status}
                                    onChange={(e) => setDossier({ ...dossier, marital_status: e.target.value })}
                                >
                                    <option value="Célibataire">Célibataire</option>
                                    <option value="Marié">Marié(e)</option>
                                    <option value="Divorcé">Divorcé(e)</option>
                                    <option value="Veuf">Veuf/Veuve</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Employeur / Établissement</Label>
                                <Input
                                    placeholder={dossier.contract_type === 'Etudiant' ? "Nom de votre école/université" : "Nom de l'entreprise"}
                                    value={dossier.employer_name}
                                    onChange={(e) => setDossier({ ...dossier, employer_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nombre d'occupants prévus</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={dossier.occupants_count}
                                    onChange={(e) => setDossier({ ...dossier, occupants_count: Number(e.target.value) })}
                                />
                            </div>
                            {(dossier.contract_type === 'Etudiant' || dossier.has_guarantor) && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Qui est votre garant ?</Label>
                                    <Input
                                        placeholder="Ex: Papa, Maman, Oncle, Tuteur..."
                                        value={dossier.guarantor_relationship}
                                        onChange={(e) => setDossier({ ...dossier, guarantor_relationship: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section: Documents */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Pièces Justificatives</h2>
                        </div>

                        <div className="space-y-4">
                            {/* CNI */}
                            <div className="bg-card p-4 rounded-2xl border flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                        <Users className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Pièce d'Identité (CNI / Passeport)</h4>
                                        <p className="text-xs text-muted-foreground">{dossier.cni_url ? "Document chargé" : "Format JPG, PNG ou PDF"}</p>
                                    </div>
                                </div>
                                <label className="cursor-pointer">
                                    <Input type="file" className="hidden" onChange={(e) => handleUpload(e, 'cni_url')} />
                                    <div className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dossier.cni_url ? "bg-green-500/10 text-green-600" : "bg-primary text-white"}`}>
                                        {dossier.cni_url ? "Modifier" : "Télécharger"}
                                    </div>
                                </label>
                            </div>

                            {/* Fiches de paie */}
                            <div className="bg-card p-4 rounded-2xl border flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">3 dernières fiches de paie</h4>
                                            <p className="text-xs text-muted-foreground">Chargé : {dossier.last_three_payslips?.length || 0}/3</p>
                                        </div>
                                    </div>
                                    <label className="cursor-pointer">
                                        <Input type="file" multiple className="hidden" onChange={(e) => handleUpload(e, 'last_three_payslips')} />
                                        <div className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold">
                                            Ajouter
                                        </div>
                                    </label>
                                </div>
                                {dossier.last_three_payslips && dossier.last_three_payslips.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {dossier.last_three_payslips.map((url, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-lg bg-muted border overflow-hidden shrink-0">
                                                <img src={url} className="w-full h-full object-cover" alt="Fiche paie" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Justificatif domicile */}
                            <div className="bg-card p-4 rounded-2xl border flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Justificatif de domicile</h4>
                                        <p className="text-xs text-muted-foreground">Facture Senelec/Sonatel de moins de 3 mois</p>
                                    </div>
                                </div>
                                <label className="cursor-pointer">
                                    <Input type="file" className="hidden" onChange={(e) => handleUpload(e, 'proof_of_residence_url')} />
                                    <div className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dossier.proof_of_residence_url ? "bg-green-500/10 text-green-600" : "bg-primary text-white"}`}>
                                        {dossier.proof_of_residence_url ? "Modifier" : "Télécharger"}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <div className="pt-8 border-t flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            Pensez à enregistrer vos modifications
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-white px-8 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer mon dossier
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DossierDigitalTab;
