import { useState } from "react";
import { CheckCircle2, Circle, Home, Users, Settings, PenTool, ArrowRight, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingChecklistProps {
    stats: {
        totalProperties: number;
        activeTenants: number;
    };
    ownerProfile: any;
    onAction: (tab: string) => void;
    onAddProperty: () => void;
}

export const OnboardingChecklist = ({ stats, ownerProfile, onAction, onAddProperty }: OnboardingChecklistProps) => {
    const { hasFeature } = useSubscription();
    const canBranding = hasFeature('branding');

    const steps = [
        {
            id: "profile",
            title: canBranding ? "Compléter votre profil d'agence" : "Compléter votre profil",
            description: canBranding 
                ? "Ajoutez le nom de votre agence et votre logo pour personnaliser vos reçus."
                : "Ajoutez le nom de votre structure pour personnaliser vos documents.",
            completed: canBranding 
                ? !!(ownerProfile?.company_name && ownerProfile?.logo_url)
                : !!ownerProfile?.company_name,
            action: () => onAction("settings"),
            icon: Settings,
        },
        {
            id: "property",
            title: "Ajouter votre première propriété",
            description: "Créez un immeuble ou une villa pour commencer à gérer vos locations.",
            completed: stats.totalProperties > 0,
            action: onAddProperty,
            icon: Home,
        },
        {
            id: "tenant",
            title: "Enregistrer un locataire",
            description: "Attribuez un locataire à une unité pour générer vos premiers contrats.",
            completed: stats.activeTenants > 0,
            action: () => onAction("properties"),
            icon: Users,
        },
        {
            id: "signature",
            title: "Configurer votre signature numérique",
            description: "Essentiel pour valider vos contrats et quittances électroniquement.",
            completed: !!ownerProfile?.signature_url,
            action: () => onAction("settings"),
            icon: PenTool,
        },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    if (progress === 100) return null;

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-white to-accent/5 overflow-hidden mb-8 border-l-4 border-l-primary animate-in fade-in slide-in-from-top duration-500">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                                <Zap className="h-5 w-5 text-primary fill-primary" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                Bienvenue sur Samalocation !
                            </h2>
                        </div>
                        <p className="text-[12px] sm:text-sm text-muted-foreground ml-9 sm:ml-9">
                            Suivez ces étapes pour configurer votre compte professionnel en quelques minutes.
                        </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 sm:mt-1 ml-9 sm:ml-0">
                        <div className="flex items-center gap-2 text-[12px] sm:text-sm font-bold whitespace-nowrap">
                            <span className="text-primary">{completedCount} sur {steps.length} complété</span>
                            <span className="text-slate-400">({Math.round(progress)}%)</span>
                        </div>
                        <Progress value={progress} className="w-full max-w-[200px] sm:w-48 h-1.5 sm:h-2 bg-slate-100" />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`relative group p-4 rounded-xl border transition-all duration-300 ${step.completed
                                    ? "bg-emerald-50/50 border-emerald-100"
                                    : "bg-white border-slate-100 hover:border-primary/30 hover:shadow-md cursor-pointer"
                                }`}
                            onClick={() => !step.completed && step.action()}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 shrink-0 ${step.completed ? "text-emerald-500" : "text-slate-300 group-hover:text-primary transition-colors"}`}>
                                    {step.completed ? <CheckCircle2 className="h-5 w-5 fill-emerald-50" /> : <Circle className="h-5 w-5" />}
                                </div>

                                <div className="space-y-1">
                                    <p className={`text-sm font-bold leading-tight ${step.completed ? "text-emerald-900" : "text-slate-900"}`}>
                                        {step.title}
                                    </p>
                                    <p className="text-[12px] text-muted-foreground leading-snug">
                                        {step.description}
                                    </p>

                                    {!step.completed && (
                                        <div className="pt-2 flex items-center text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                            Commencer <ArrowRight className="ml-1 h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {step.completed && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-emerald-500/10 text-emerald-600 p-1 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
