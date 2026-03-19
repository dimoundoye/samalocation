import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, QrCode, Smartphone, Info, ExternalLink, Phone, Zap } from "lucide-react";
import { notifyPayment } from "@/lib/api";
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
    const [transactionId, setTransactionId] = useState("");
    const [senderPhone, setSenderPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const getWaveLink = (price: number) => {
        return `https://pay.wave.com/m/M_sn_JG5-cxcdVaME/c/sn/?amount=${price}`;
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

            onOpenChange(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[550px] rounded-[2.5rem] p-0 border-none shadow-strong"
                style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
            >
                {/* Header fixe */}
                <DialogHeader className="p-8 pb-4 shrink-0 bg-white border-b">
                    <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                        <Zap className="h-8 w-8 text-primary fill-primary/20" />
                        Plan {plan.name}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground/80">
                        Finalisez votre activation en suivant ces 3 étapes simples.
                    </DialogDescription>
                </DialogHeader>

                {/* Zone scrollable — utilise overflow-y-auto natif */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                    <div className="space-y-8">
                        {/* Étapes de paiement */}
                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em]">FACTURE À RÉGLER</span>
                                <Badge className="text-2xl font-black bg-primary text-white border-none px-6 py-2 rounded-2xl">
                                    {plan.price.toLocaleString()} F
                                </Badge>
                            </div>

                            <div className="space-y-5">
                                {/* Étape 1: Bouton Wave */}
                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                                    <div className="space-y-3 flex-1">
                                        <p className="text-sm leading-relaxed">
                                            Cliquez sur le bouton ci-dessous pour payer directement via <strong>Wave</strong> :
                                        </p>
                                        <Button asChild className="w-full h-14 gradient-primary text-white rounded-2xl font-bold group">
                                            <a href={getWaveLink(plan.price)} target="_blank" rel="noopener noreferrer">
                                                Payer avec Wave ({plan.price.toLocaleString()} F)
                                                <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative py-2 flex items-center">
                                    <div className="flex-grow border-t border-border/50"></div>
                                    <span className="flex-shrink mx-4 text-xs font-bold text-muted-foreground uppercase opacity-50 tracking-widest">OU</span>
                                    <div className="flex-grow border-t border-border/50"></div>
                                </div>

                                {/* Étape 2: Numéro manuel */}
                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                                    <div className="text-sm space-y-2">
                                        <p>Effectuez le transfert manuellement au numéro Business :</p>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-primary/20 w-fit">
                                            <Phone className="h-5 w-5 text-primary" />
                                            <span className="text-xl font-black text-primary tracking-tighter">76 162 95 29</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex justify-center py-2">
                                    <div className="bg-white p-3 rounded-2xl border-2 border-primary/10">
                                        <QrCode className="h-32 w-32 text-primary opacity-90" />
                                    </div>
                                </div>

                                {/* Étape 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                                    <div className="text-sm">
                                        Relevez votre <strong>numéro de téléphone</strong> et l'<strong>ID de transaction</strong> reçu par SMS, puis remplissez ci-dessous.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulaire de confirmation */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sender-phone" className="font-bold text-sm ml-1 uppercase text-muted-foreground tracking-wider">
                                    Votre numéro Wave
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="sender-phone"
                                        placeholder="Ex: 77 123 45 67"
                                        value={senderPhone}
                                        onChange={(e) => setSenderPhone(e.target.value)}
                                        className="h-14 rounded-2xl border-2 border-border/50 focus-visible:ring-primary focus-visible:border-primary pl-12"
                                    />
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transaction-id" className="font-bold text-sm ml-1 uppercase text-muted-foreground tracking-wider">
                                    ID Transaction Wave
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="transaction-id"
                                        placeholder="Ex: ABC-123456789"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="h-14 rounded-2xl border-2 border-border/50 focus-visible:ring-primary focus-visible:border-primary pl-12 font-mono"
                                    />
                                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1 pt-1 italic">
                                    <Info className="h-3 w-3" />
                                    L'activation sera effectuée dans un délai de 24h après vérification.
                                </p>
                            </div>
                        </div>

                        {/* Espaceur bas */}
                        <div className="h-2" />
                    </div>
                </div>

                {/* Footer fixe */}
                <DialogFooter className="p-6 pt-4 border-t bg-secondary/10 flex-col sm:flex-row gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-2xl h-14 px-8 font-bold hover:bg-white/50"
                    >
                        Fermer
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 gradient-primary text-white rounded-2xl h-14 font-black shadow-strong hover:scale-[1.02] transition-all uppercase tracking-widest text-sm"
                    >
                        {loading ? "Vérification..." : "Confirmer mon paiement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
