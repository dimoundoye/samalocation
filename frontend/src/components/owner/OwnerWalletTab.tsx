import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
    Loader2, Smartphone, History, CheckCircle2, 
    XCircle, Clock, Lock, Shield
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

export const OwnerWalletTab = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const activeContext = localStorage.getItem("active_context") || "personal";
    const isInPatronContext = !!user?.parentId && activeContext !== "personal";

    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<any>({
        balance: 0,
        currency: "XOF",
        online_payment_enabled: false,
        transactions: [],
        withdrawals: []
    });

    // Formulaire de retrait
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [withdrawProvider, setWithdrawProvider] = useState("wave");
    const [withdrawRecipient, setWithdrawRecipient] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawPassword, setWithdrawPassword] = useState("");
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    // Paramètres
    const [toggleLoading, setToggleLoading] = useState(false);

    useEffect(() => {
        if (!isInPatronContext) {
            loadWalletData();
        } else {
            setLoading(false);
        }
    }, [isInPatronContext]);

    const loadWalletData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/withdrawals/wallet`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.status === "success") {
                setWalletData(data.data || {});
            } else {
                toast({
                    title: "Erreur",
                    description: data.message || "Impossible de charger les données du portefeuille.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error loading wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePayment = async (checked: boolean) => {
        setToggleLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/withdrawals/toggle-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ enabled: checked })
            });

            const data = await response.json();
            if (response.ok && data.status === "success") {
                setWalletData((prev: any) => ({
                    ...prev,
                    online_payment_enabled: data.data.online_payment_enabled
                }));
                toast({
                    title: "Paramètres mis à jour",
                    description: checked 
                        ? "Les paiements de loyer en ligne sont maintenant activés pour vos locataires." 
                        : "Les paiements de loyer en ligne sont désactivés.",
                });
            } else {
                toast({
                    title: "Erreur",
                    description: data.message || "Impossible de modifier ce paramètre.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error toggling payment settings:", error);
        } finally {
            setToggleLoading(false);
        }
    };

    const handleWithdrawSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const balance = walletData?.balance || 0;
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Montant invalide", description: "Veuillez saisir un montant supérieur à 0.", variant: "destructive" });
            return;
        }

        if (amount > balance) {
            toast({ title: "Solde insuffisant", description: "Le montant demandé dépasse votre solde disponible.", variant: "destructive" });
            return;
        }

        const MIN_WITHDRAWAL = 1000;
        if (amount < MIN_WITHDRAWAL) {
            toast({ title: "Montant insuffisant", description: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL} F CFA.`, variant: "destructive" });
            return;
        }

        const LIMIT_DAILY = 2000000;
        if (amount > LIMIT_DAILY) {
            toast({ title: "Limite dépassée", description: `Le montant maximum de retrait est de ${LIMIT_DAILY} F CFA par transaction.`, variant: "destructive" });
            return;
        }

        if (!withdrawRecipient.trim()) {
            toast({ title: "Coordonnées requises", description: "Veuillez saisir les coordonnées de réception.", variant: "destructive" });
            return;
        }

        const cleanPhone = withdrawRecipient.replace(/\s+/g, '');
        const senegalPhoneRegex = /^(77|78|76|75|70)\d{7}$/;
        if (!senegalPhoneRegex.test(cleanPhone)) {
            toast({ title: "Numéro de téléphone invalide", description: "Le numéro doit comporter 9 chiffres et commencer par 77, 78, 76, 75 ou 70.", variant: "destructive" });
            return;
        }

        if (!withdrawPassword) {
            toast({ title: "Mot de passe requis", description: "Veuillez saisir votre mot de passe de connexion pour confirmer.", variant: "destructive" });
            return;
        }

        setWithdrawLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/withdrawals/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    provider: withdrawProvider,
                    recipientDetails: withdrawRecipient,
                    password: withdrawPassword
                })
            });

            const data = await response.json();
            if (response.ok && data.status === "success") {
                toast({
                    title: "Demande réussie",
                    description: "Votre transfert d'argent a été initié et traité avec succès !",
                });
                setWithdrawDialogOpen(false);
                setWithdrawAmount("");
                setWithdrawRecipient("");
                setWithdrawPassword("");
                loadWalletData();
            } else {
                toast({
                    title: "Virement échoué",
                    description: data.message || "Impossible de finaliser le retrait.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error requesting withdrawal:", error);
            toast({ title: "Erreur réseau", description: "Impossible de joindre le serveur.", variant: "destructive" });
        } finally {
            setWithdrawLoading(false);
        }
    };

    const balance = walletData?.balance || 0;
    const currency = "XOF";
    const online_payment_enabled = walletData?.online_payment_enabled || false;
    const transactions = walletData?.transactions || [];
    const withdrawals = walletData?.withdrawals || [];

    const rentAmount = parseFloat(withdrawAmount) || 0;
    const feeAmount = rentAmount * 0.025;
    const netWithdrawAmount = Math.max(0, rentAmount - feeAmount);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge variant="outline" className="bg-white text-green-600 border-green-200 font-bold">Réussi</Badge>;
            case "failed":
                return <Badge className="bg-red-100 text-red-700 border-red-200">Échoué</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">En cours</Badge>;
        }
    };

    if (isInPatronContext) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary" />
                        Mon Portefeuille
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gérez vos gains locatifs, configurez les paiements de loyer en ligne et transférez vos fonds vers Wave ou Orange Money.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-6 py-20 text-center bg-background rounded-2xl border border-border/40 shadow-soft">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-lg font-bold">Mon Portefeuille</h3>
                        <p className="text-sm text-muted-foreground">
                            Vous êtes actuellement dans l'espace de votre patron. Vous ne pouvez pas accéder au portefeuille de l'entreprise.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Basculez vers votre espace personnel pour accéder à votre propre portefeuille.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Titre */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Wallet className="w-8 h-8 text-primary" />
                    Mon Portefeuille
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Gérez vos gains locatifs, configurez les paiements de loyer en ligne et transférez vos fonds vers Wave ou Orange Money.
                </p>
            </div>

            {/* Cartes supérieures (Solde & Options) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Carte Solde avec dégradé premium */}
                <Card className="md:col-span-2 overflow-hidden border-none bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white shadow-lg relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/80 text-xs font-bold uppercase tracking-wider">Solde Disponible</CardDescription>
                        <CardTitle className="text-4xl md:text-5xl font-black pt-1">
                            {formatCurrency(balance, currency)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                        <div className="flex items-center gap-2 text-white/90 text-xs">
                            <ShieldCheck className="w-4 h-4 text-green-300" />
                            Fonds protégés et prêts pour le virement
                        </div>
                        <Button 
                            className="bg-white text-primary hover:bg-white/90 font-bold px-6 h-10 shadow-md transition-all text-xs rounded-xl"
                            onClick={() => setWithdrawDialogOpen(true)}
                            disabled={balance <= 0}
                        >
                            <ArrowUpRight className="w-4 h-4 mr-1.5" />
                            Retirer mes fonds
                        </Button>
                    </CardContent>
                </Card>

                {/* Paramètres rapides */}
                <Card className="shadow-soft flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Option d'encaissement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                            <p className="text-sm font-bold text-foreground">Paiement en ligne</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Permet à vos locataires de payer directement en ligne sur la plateforme SamaLocation par Mobile Money (Wave, OM) ou Visa.
                            </p>
                            <p className="text-[12px] text-red-600 font-semibold mt-1">
                                NB: cette option est reservée aux propriétaires du Sénégal. 
                            </p>
                            <p className="text-[10px] text-primary font-semibold mt-1">
                                ℹ️ Les retraits de fonds de votre portefeuille vers votre numéro Mobile Money sont soumis à des frais de service de 2,5%.
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                                {online_payment_enabled ? "Activé" : "Désactivé"}
                            </span>
                            <Switch 
                                checked={online_payment_enabled}
                                onCheckedChange={handleTogglePayment}
                                disabled={toggleLoading}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Note d'information sur la devise (sur toute la longueur, en dessous des cartes) */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-foreground">Note sur la devise de gestion</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        Actuellement, toutes les transactions de votre portefeuille (loyers collectés en ligne et demandes de retrait) sont traitées et exprimées exclusivement en <strong className="text-foreground">Franc CFA (XOF)</strong>. Si votre profil utilise une autre devise, les montants affichés ici restent exprimés en Franc CFA pour garantir l'exactitude des virements.
                    </p>
                </div>
            </div>

            {/* Listes des Transactions & Historique */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Historique des mouvements (Ledger) */}
                <Card className="shadow-soft">
                    <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <div>
                            <CardTitle className="text-sm font-bold">Historique du portefeuille</CardTitle>
                            <CardDescription className="text-[11px]">Tous les mouvements de fonds récents</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            {transactions.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Aucune transaction enregistrée</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {transactions.map((tx: any) => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${
                                                    tx.type === 'pay_rent' 
                                                        ? 'bg-green-50 text-green-600' 
                                                        : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                    {tx.type === 'pay_rent' ? (
                                                        <ArrowDownLeft className="w-4 h-4" />
                                                    ) : (
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">{tx.description}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-black ${
                                                    tx.type === 'pay_rent' ? 'text-green-600' : 'text-orange-600'
                                                }`}>
                                                    {tx.type === 'pay_rent' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                                                </p>
                                                {parseFloat(tx.fee) > 0 && (
                                                    <p className="text-[9px] text-muted-foreground">
                                                        Frais : {formatCurrency(tx.fee, currency)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Historique des virements sortants */}
                <Card className="shadow-soft">
                    <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <div>
                            <CardTitle className="text-sm font-bold">Suivi des retraits</CardTitle>
                            <CardDescription className="text-[11px]">Statut de vos demandes de virement Wave / OM</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Aucune demande de retrait effectuée</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {withdrawals.map((w: any) => (
                                        <div key={w.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-secondary/50 text-muted-foreground">
                                                    {getStatusIcon(w.status)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">
                                                        Virement {w.provider.toUpperCase()}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Vers {w.recipient_details} • {new Date(w.created_at).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-xs font-black text-foreground">
                                                    {formatCurrency(w.net_amount, currency)}
                                                </p>
                                                <div>{getStatusBadge(w.status)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Demande de Retrait */}
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                            Retirer mes fonds
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Sélectionnez votre moyen de réception et indiquez le montant. La confirmation requiert votre mot de passe de connexion.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
                        {/* Solde rappel */}
                        <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-semibold">Solde disponible :</span>
                            <span className="font-black text-primary">{formatCurrency(balance, currency)}</span>
                        </div>

                        {/* Fournisseur */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moyen de virement</Label>
                            <select 
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={withdrawProvider}
                                onChange={(e) => setWithdrawProvider(e.target.value)}
                            >
                                <option value="wave">Wave</option>
                                <option value="orange_money">Orange Money</option>
                                <option value="free_money">Free Money</option>
                            </select>
                        </div>

                        {/* Coordonnées de réception */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Numéro de téléphone Wave/OM</Label>
                            <Input 
                                type="number"
                                placeholder="Ex: 771234567"
                                className="rounded-xl h-10 text-xs"
                                value={withdrawRecipient}
                                onChange={(e) => setWithdrawRecipient(e.target.value)}
                                required
                            />
                        </div>

                        {/* Montant brut */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Montant à retirer (FCFA)</Label>
                            <Input 
                                type="number"
                                placeholder="Ex: 50000"
                                className="rounded-xl h-10 text-xs"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                required
                            />
                        </div>

                        {/* Résumé des frais transparents */}
                        {rentAmount > 0 && (
                            <div className="space-y-1.5 text-xs bg-muted/40 rounded-xl p-3 border">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Montant demandé :</span>
                                    <span>{formatCurrency(rentAmount, currency)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Frais de virement (2,5%) :</span>
                                    <span>{formatCurrency(feeAmount, currency)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-1.5 text-foreground">
                                    <span>Montant net à recevoir :</span>
                                    <span className="text-primary font-black">{formatCurrency(netWithdrawAmount, currency)}</span>
                                </div>
                            </div>
                        )}

                        {/* Double confirmation par mot de passe */}
                        <div className="space-y-1.5 border-t pt-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-primary" />
                                Mot de passe de connexion
                            </Label>
                            <Input 
                                type="password"
                                placeholder="Saisir votre mot de passe pour confirmer"
                                className="rounded-xl h-10 text-xs"
                                value={withdrawPassword}
                                onChange={(e) => setWithdrawPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-10 rounded-xl text-xs font-bold mt-2" 
                            disabled={withdrawLoading || rentAmount <= 0 || rentAmount > balance}
                        >
                            {withdrawLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                    Virement en cours...
                                </>
                            ) : (
                                "Confirmer le retrait"
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
