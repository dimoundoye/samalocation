import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Crown, CheckCircle2, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    feature?: string;
}

export const UpgradeModal = ({ open, onOpenChange, title, description, feature }: UpgradeModalProps) => {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-secondary/20 border-primary/20">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-bounce-slow">
                        <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-primary">{title}</DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            Passer au Plan Premium
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Gestion illimitée de vos logements
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Jusqu'à 15 locataires actifs
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Assistant IA Gemini illimité
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Quittances PDF illimitées
                            </li>
                        </ul>
                    </div>

                    <p className="text-center text-xs text-muted-foreground italic">
                        Boostez votre gestion et gagnez du temps dès aujourd'hui.
                    </p>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="sm:mr-auto"
                    >
                        Plus tard
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            navigate("/pricing");
                        }}
                        className="gradient-primary text-white shadow-medium group"
                    >
                        Voir les offres
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
