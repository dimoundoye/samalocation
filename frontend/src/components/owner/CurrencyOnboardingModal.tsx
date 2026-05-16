import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Coins, Globe, ArrowRight, Check } from "lucide-react";
import { updateOwnerProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CurrencyOnboardingModalProps {
    open: boolean;
    onClose: () => void;
    onSaved?: (currency: string) => void;
    currentCurrency?: string;
}

export const CurrencyOnboardingModal = ({ open, onClose, onSaved, currentCurrency = "XOF" }: CurrencyOnboardingModalProps) => {
    const [currency, setCurrency] = useState(currentCurrency);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateOwnerProfile({ currency });
            if (onSaved) onSaved(currency);
            toast({
                title: "Configuration enregistrée",
                description: `Votre devise par défaut est désormais le ${currency}.`,
            });
            onClose();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer votre choix.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="relative h-32 bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                        <Coins className="h-10 w-10 text-white" />
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bienvenue !</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Avant de commencer, quelle devise utilisez-vous pour gérer vos locations ?
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Devise de gestion
                            </Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger id="currency-select" className="h-12 text-base rounded-xl border-slate-200 focus:ring-primary/20">
                                    <SelectValue placeholder="Choisir une devise" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                                    <SelectItem value="XAF">Franc CFA (XAF)</SelectItem>
                                    <SelectItem value="EUR">Euro (€)</SelectItem>
                                    <SelectItem value="USD">Dollar US ($)</SelectItem>
                                    <SelectItem value="GNF">Franc Guinéen (FG)</SelectItem>
                                    <SelectItem value="MAD">Dirham Marocain (DH)</SelectItem>
                                    <SelectItem value="MRO">Ouguiya Mauritanien (UM)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                            <div className="mt-1 bg-primary/10 p-1.5 rounded-lg">
                                <Globe className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Ce choix configurera vos rapports, vos quittances et vos statistiques. Vous pourrez le modifier plus tard dans vos paramètres.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-base font-bold gradient-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
                    >
                        {loading ? "Configuration..." : "Commencer la gérance"}
                        {!loading && <ArrowRight className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
