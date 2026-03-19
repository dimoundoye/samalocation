import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Crown, CheckCircle2, AlertCircle, ArrowRight, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { getMySubscription } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const OwnerSubscription = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { subscription, loading } = useSubscription();

    const getPlanIcon = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'premium': return <Zap className="h-8 w-8 text-accent" />;
            case 'professional': 
            case 'professionnel': return <Crown className="h-8 w-8 text-yellow-500" />;
            default: return <Shield className="h-8 w-8 text-blue-500" />;
        }
    };

    const formatLimit = (limit: any) => {
        if (limit === -1 || limit === null || limit?.toString() === 'Infinity') return "∞";
        return limit;
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-3xl" />
            <div className="h-64 bg-muted rounded-3xl" />
        </div>;
    }

    return (
        <div className="space-y-8 animate-fade-in text-primary">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mon Abonnement</h2>
                    <p className="text-muted-foreground">Gérez vos limites et boostez votre gérance avec nos offres.</p>
                </div>
                <Button
                    onClick={() => navigate("/pricing")}
                    className="gradient-primary text-white shadow-medium hover:scale-105 transition-all"
                >
                    Voir tous les plans
                </Button>
            </div>

            {/* Current Plan Card */}
            <Card className="border-primary/10 shadow-strong overflow-hidden bg-gradient-to-br from-card to-secondary/30 relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    {getPlanIcon(subscription?.plan_name || 'gratuit')}
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plan Actuel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                            {getPlanIcon(subscription?.plan_name || 'gratuit')}
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold capitalize">
                                {subscription?.plan_name || 'Gratuit'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {subscription?.status === 'pending' ? (
                                    <Badge className="bg-orange-500 hover:bg-orange-600 animate-pulse">
                                        <Clock className="h-3 w-3 mr-1" /> Activation en attente
                                    </Badge>
                                ) : (
                                    <Badge className="bg-green-500 hover:bg-green-600">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Actif
                                    </Badge>
                                )}
                                {subscription?.expires_at && (
                                    <span className="text-xs text-muted-foreground">
                                        Expire le {format(new Date(subscription.expires_at), "dd MMMM yyyy", { locale: fr })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-4">
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-background/50 border border-border/50">
                            <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Nombre de biens</p>
                            <div className="flex items-end gap-1.5 sm:gap-2">
                                <span className="text-xl sm:text-2xl font-bold">{subscription?.properties_count || 0}</span>
                                <span className="text-xs sm:text-base text-muted-foreground pb-0.5">/ {formatLimit(subscription?.properties_limit)}</span>
                            </div>
                            <div className="w-full h-1.5 sm:h-2 bg-secondary rounded-full mt-2 sm:mt-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ 
                                        width: (subscription?.properties_limit === -1 || subscription?.properties_limit === null) 
                                            ? "100%" 
                                            : `${Math.min(100, ((subscription?.properties_count || 0) / (subscription?.properties_limit || 1)) * 100)}%` 
                                    }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-background/50 border border-border/50">
                            <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Assistant IA Gemini</p>
                            {subscription?.limits?.ai_descriptions_per_month !== 0 ? (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 font-bold">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-base">Inclus {formatLimit(subscription?.limits?.ai_descriptions_per_month) === "∞" ? "(Illimité)" : `(${subscription?.limits?.ai_descriptions_per_month})`}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-red-500 font-bold">
                                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-base">Non inclus</span>
                                </div>
                            )}
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-2">Génération auto de descriptions par IA.</p>
                        </div>

                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-background/50 border border-border/50 col-span-2 sm:col-span-1">
                            <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">Logo et Branding</p>
                            {subscription?.limits?.custom_branding ? (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 font-bold">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-base">Inclus</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-red-500 font-bold">
                                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-base">Non inclus</span>
                                </div>
                            )}
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-2">Votre logo sur toutes vos quittances PDF.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Why Upgrade? Only show if not on max plan */}
            {subscription?.plan_name?.toLowerCase() !== 'professional' && subscription?.plan_name?.toLowerCase() !== 'professionnel' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold">Pourquoi passer au plan supérieur ?</h3>
                        <div className="space-y-4">
                            {[
                                { title: "Professionnalisme", desc: "Affichez votre logo et vos couleurs sur chaque reçu client.", icon: <Building2 className="text-primary" /> },
                                { title: "Gain de temps IA", desc: "Laissez l'IA Gemini rédiger des descriptions captivantes pour vos biens.", icon: <Zap className="text-accent" /> },
                                { title: "Rapports Excel", desc: "Exportez vos gérances en un clic pour votre comptabilité.", icon: <CreditCard className="text-blue-500" /> }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors">
                                    <div className="h-10 w-10 rounded-xl bg-background shadow-soft flex items-center justify-center shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-strong animate-float">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Zap size={200} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <Badge className="bg-accent text-white border-none">OFFRE SÉNÉGAL</Badge>
                            <h3 className="text-3xl font-bold">Passez au Plan Premium</h3>
                            <p className="text-white/80 leading-relaxed">
                                Débloquez jusqu'à 15 logements et commencez à utiliser l'IA Gemini pour attirer plus de locataires.
                            </p>
                            <div className="pt-4">
                                <div className="text-3xl font-bold mb-6">5 000 F <span className="text-lg font-normal opacity-80">/ mois</span></div>
                                <Button
                                    onClick={() => navigate("/pricing")}
                                    className="bg-white text-primary hover:bg-white/90 font-bold h-12 px-8 rounded-xl shadow-strong"
                                >
                                    Devenir Premium <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Building2 = ({ className, size = 20 }: { className?: string; size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
    </svg>
);
