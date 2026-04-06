import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, QrCode, Smartphone, Info, ExternalLink, Phone, Zap } from "lucide-react";
import { notifyPayment, initializePaytechPayment } from "@/api/subscription";
import { useToast } from "@/hooks/use-toast";

interface ManualPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: {
        name: string;
        price: number;
        id: string;
    };
    onSuccess?: () => void;
}

export const ManualPaymentModal = ({ open, onOpenChange, plan, onSuccess }: ManualPaymentModalProps) => {
    const [view, setView] = useState<'choice' | 'manual'>('choice');
    const [transactionId, setTransactionId] = useState("");
    const [senderPhone, setSenderPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Reset view when modal closes/opens
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) setView('choice');
        onOpenChange(isOpen);
    };

    const getWaveLink = (price: number) => {
        return `https://pay.wave.com/m/M_sn_JG5-cxcdVaME/c/sn/?amount=${price}`;
    };

    const handlePaytechPayment = async () => {
        setLoading(true);
        try {
            const period = plan.id === 'premium' || plan.id === 'professional' ? (plan.price > 15000 ? 'annual' : 'monthly') : 'monthly';
            const res = await initializePaytechPayment({
                planId: plan.id,
                period: period as 'monthly' | 'annual'
            });

            console.log("PayTech Response received by frontend:", res);

            // baseClient returns data.data directly if status is success
            // But sometimes it returns the whole object. Let's handle both.
            const url = res?.redirect_url || res?.data?.redirect_url;
            
            if (url) {
                console.log("Redirecting to:", url);
                window.location.assign(url); // Plus robuste que .href
            } else {
                console.error("No URL found in response", res);
                throw new Error("Lien de paiement non trouvé dans la réponse du serveur");
            }
        } catch (error: any) {
            console.error("PayTech error:", error);
            toast({
                title: "Erreur",
                description: "Impossible d'initialiser le paiement automatique.",
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!transactionId.trim()) {
            toast({
                title: "ID manquant",
                description: "Veuillez saisir l'ID de la transaction Wave.",
                variant: "destructive",
            });
            return;
        }

        if (!senderPhone.trim()) {
            toast({
                title: "Numéro manquant",
                description: "Veuillez saisir le numéro de téléphone utilisé pour le transfert.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await notifyPayment({
                planName: plan.name,
                price: plan.price,
                transactionId: transactionId.trim(),
                senderPhone: senderPhone.trim()
            });

            toast({
                title: "Notification envoyée",
                description: "Votre paiement a été signalé avec succès. L'administrateur validera sous 24h.",
            });

            handleOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("ManualPaymentModal error:", error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'envoyer la notification de paiement.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[550px] rounded-[2.5rem] p-0 border-none shadow-strong bg-white overflow-hidden"
                style={{ display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}
            >
                {/* Header fixe */}
                <DialogHeader className="p-8 pb-4 shrink-0 bg-white">
                    <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                        <Zap className="h-8 w-8 text-primary fill-primary/20" />
                        Plan {plan.name}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground/80">
                        {view === 'choice'
                            ? "Choisissez votre méthode de paiement préférée au Sénégal."
                            : "Suivez les étapes pour valider votre paiement manuel."
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Zone scrollable */}
                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {view === 'choice' ? (
                        <div className="space-y-4 pt-2">
                            {/* Option Automatique */}
                            <button
                                onClick={handlePaytechPayment}
                                disabled={loading}
                                className="w-full relative group p-6 rounded-[2rem] border-2 border-primary/10 hover:border-accent bg-white transition-all duration-300 text-left hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                            >
                                <div className="absolute top-4 right-6 bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                    Recommandé
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                        <Zap className="h-8 w-8 fill-accent/10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black tracking-tight">Automatique (Instant)</h4>
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            Payez via <strong>Wave, Orange Money, Free Money</strong> ou <strong>Carte</strong>. Activation immédiate.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex gap-2 opacity-60 grayscale group-hover:grayscale-0 transition-all">
                                        {/* Icons for payment methods could go here */}
                                        <Smartphone className="h-4 w-4" />
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-accent font-black text-xs uppercase tracking-widest flex items-center gap-1">
                                        Continuer <ExternalLink className="h-3 w-3" />
                                    </span>
                                </div>
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border/50"></div>
                                <span className="mx-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">ou</span>
                                <div className="flex-grow border-t border-border/50"></div>
                            </div>

                            {/* Option Manuelle */}
                            <button
                                onClick={() => setView('manual')}
                                className="w-full group p-6 rounded-[2rem] border-2 border-border/50 hover:border-primary/50 bg-secondary/5 transition-all duration-300 text-left hover:shadow-lg hover:bg-white"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Smartphone className="h-8 w-8 opacity-70" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black tracking-tight">Manuel via Wave</h4>
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            Transfert direct et envoi de l'ID de transaction. Validation sous 24h.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <span className="text-primary font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Saisir l'ID <Info className="h-3 w-3" />
                                    </span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 pt-2">
                            {/* Retour au choix */}
                            <button
                                onClick={() => setView('choice')}
                                className="text-xs font-black text-primary uppercase underline tracking-widest hover:text-accent transition-colors mb-4 inline-flex items-center gap-2"
                            >
                                ← Revenir au choix du mode
                            </button>

                            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em]">FACTURE À RÉGLER</span>
                                    <Badge className="text-2xl font-black bg-primary text-white border-none px-6 py-2 rounded-2xl">
                                        {plan.price.toLocaleString()} F
                                    </Badge>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary/40 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                                    <div className="space-y-3 flex-1">
                                        <p className="text-sm leading-relaxed">Cliquez ci-dessous pour payer via Wave :</p>
                                        <Button asChild variant="outline" className="w-full h-12 border-primary/20 hover:bg-primary/5 rounded-2xl font-bold group">
                                            <a href={getWaveLink(plan.price)} target="_blank" rel="noopener noreferrer">
                                                Lien Wave Direct ({plan.price.toLocaleString()} F)
                                                <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary/40 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                                    <div className="text-sm space-y-2 flex-1">
                                        <p> Ou effectuez le transfert au numéro :</p>
                                        <div className="bg-white p-3 rounded-xl border-2 border-primary/20 w-fit">
                                            <span className="text-xl font-black text-primary tracking-tighter">76 162 95 29</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary/40 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                                    <div className="text-sm flex-1">
                                        Rejoignez votre numéro et l'ID de transaction reçu par SMS ou sur votre facture.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm ml-1 uppercase text-muted-foreground tracking-wider">Votre numéro Wave</Label>
                                    <Input
                                        placeholder="Ex: 77 123 45 67"
                                        value={senderPhone}
                                        onChange={(e) => setSenderPhone(e.target.value)}
                                        className="h-14 rounded-2xl border-2 border-border/50 focus-visible:ring-primary pl-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm ml-1 uppercase text-muted-foreground tracking-wider">ID Transaction</Label>
                                    <Input
                                        placeholder="Ex: ABC-123456789"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="h-14 rounded-2xl border-2 border-border/50 focus-visible:ring-primary pl-4 font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1 pt-1 italic">
                                        <Info className="h-3 w-3" /> Activation sous 24h après vérification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer fixe */}
                <DialogFooter className="p-6 pt-4 border-t bg-secondary/5 flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenChange(false)}
                        className="rounded-2xl h-14 px-8 font-bold"
                    >
                        Annuler
                    </Button>
                    {view === 'manual' && (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 gradient-primary text-white rounded-2xl h-14 font-black shadow-strong uppercase tracking-widest text-sm"
                        >
                            {loading ? "Vérification..." : "Confirmer le paiement"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
