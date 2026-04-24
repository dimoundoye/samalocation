import { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { Check, Zap, Shield, Crown, Building2, HelpCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ManualPaymentModal } from "@/components/ManualPaymentModal";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const Pricing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(false);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const { toast } = useToast();
    const isAgent = user?.parentId != null;

    const handlePlanSelect = (plan: any) => {
        if (plan.id === 'free') {
            if (user) {
                navigate("/dashboard-proprietaire");
            } else {
                navigate("/auth?mode=signup");
            }
            return;
        }

        if (plan.id === 'professional' && isAgent) {
            toast({
                title: "Accès restraint",
                description: "Les comptes 'Agent/Collaborateur' ne peuvent pas souscrire à une offre Entreprise.",
                variant: "destructive"
            });
            return;
        }

        if (user) {
            setSelectedPlanDetails(plan);
            setPaymentModalOpen(true);
        } else {
            navigate(`/auth?mode=signup&plan=${plan.id}`);
        }
    };

    const plans = [
        {
            name: "Gratuit",
            id: "free",
            price: 0,
            description: "Offre de lancement : Gérez vos premiers locataires gratuitement !",
            icon: <Shield className="w-8 h-8 text-blue-500" />,
            features: [
                "Logements ILLIMITÉS (Publication)",
                "Gestion de 5 locataires (Gérance)",
                "Messagerie locataires",
                "Gestion des maintenances",
                "Génération de reçus (5/mois)",
                "Génération de baux (Standard)",
                "Signature électronique",
                "Support communautaire"
            ],
            notIncluded: [
                "Assistant IA Gemini",
                "Import Excel de masse",
                "Branding personnalisé"
            ],
            cta: "Saisir l'offre gratuite",
            highlight: false
        },
        {
            name: "Premium",
            id: "premium",
            price: isAnnual ? 54000 : 5000,
            period: isAnnual ? "/an" : "/mois",
            description: "Pour les propriétaires indépendants voulant automatiser leur gérance.",
            icon: <Zap className="w-8 h-8 text-accent" />,
            features: [
                "Logements ILLIMITÉS (Publication)",
                "Gestion de 15 locataires (Gérance)",
                "Reçus illimités & PDF",
                "Génération de contrats PDF",
                "Signature électronique (Scan)",
                "Assistant IA Gemini (15 / mois)",
                "Maintenance avec Photos",
                "Support WhatsApp prioritaire"
            ],
            notIncluded: [
                "Import Excel de masse",
                "Gestion Multi-utilisateurs",
                "Logo & Branding personnalisé"
            ],
            cta: "Choisir Premium",
            highlight: true
        },
        {
            name: "Professionnel",
            id: "professional",
            price: isAnnual ? 162000 : 15000,
            period: isAnnual ? "/an" : "/mois",
            description: "La solution complète pour les agences et grands patrimoines.",
            icon: <Crown className="w-8 h-8 text-yellow-500" />,
            features: [
                "Logements ILLIMITÉS",
                "Gérance de locataires ILLIMITÉE",
                "Import de fichier Excel (Biens)",
                "Gestion Multi-utilisateurs (Collaborateurs)",
                "Logo & Branding sur les reçus",
                "Assistant IA Gemini ILLIMITÉ",
                "Exports Excel structurés",
                "Gestionnaire de compte dédié"
            ],
            cta: "Choisir Professionnel",
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Tarifs et Abonnements | Samalocation"
                description="Découvrez nos offres pour propriétaires et agences immobilières au Sénégal. Gérez vos locataires à partir de 0 FCFA par mois."
            />
            <Navbar />

            <main className="container mx-auto px-6 pt-24 pb-20">
                {/* Header Section */}
                <section className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight"
                    >
                        Simplifiez votre gestion,{" "}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            choisissez le bon plan
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground"
                    >
                        Que vous soyez un particulier ou une agence, nous avons une solution adaptée à vos besoins au Sénégal.
                    </motion.p>

                    {/* Toggle Annual/Monthly */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-4 pt-6"
                    >
                        <span className={`text-sm font-medium ${!isAnnual ? "text-primary" : "text-muted-foreground"}`}>Mensuel</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-7 bg-primary/20 rounded-full transition-colors flex items-center px-1"
                        >
                            <div className={`w-5 h-5 bg-primary rounded-full shadow-sm transition-transform ${isAnnual ? "translate-x-7" : "translate-x-0"}`} />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? "text-primary" : "text-muted-foreground"}`}>
                            Annuel <span className="text-green-500 font-bold ml-1">-10%</span>
                        </span>
                    </motion.div>
                </section>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, index) => {
                        const isDisabled = plan.id === 'professional' && isAgent;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                className={`relative p-8 rounded-[2.5rem] border transition-all duration-300 ${plan.highlight
                                    ? "bg-card border-primary shadow-strong scale-105 z-10"
                                    : "bg-card/50 border-border/50 hover:border-primary/20"
                                    } ${isDisabled ? "opacity-60 grayscale-[0.5]" : ""}`}
                            >
                                {isDisabled && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-[2.5rem] text-center p-6">
                                        <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                        <p className="text-sm font-bold text-muted-foreground">Non disponible pour les agents</p>
                                    </div>
                                )}
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-medium whitespace-nowrap">
                                        PLUS POPULAIRE
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="mb-4 inline-block">{plan.icon}</div>
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{plan.price.toLocaleString('fr-FR')}</span>
                                        <span className="text-xl font-bold">FCFA</span>
                                        <span className="text-muted-foreground ml-1">{plan.period}</span>
                                    </div>
                                    {isAnnual && plan.price > 0 && (
                                        <p className="text-xs text-green-600 font-medium mt-1">Facturé annuellement</p>
                                    )}
                                </div>

                                <Button
                                    onClick={() => handlePlanSelect(plan)}
                                    className={`w-full h-12 rounded-xl text-base font-bold transition-all hover:scale-105 ${plan.highlight
                                        ? "gradient-primary shadow-medium text-white"
                                        : "bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white dark:bg-card"
                                        }`}
                                >
                                    {plan.cta}
                                </Button>

                                <hr className="my-8 border-border/50" />
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium">{feature}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded?.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 opacity-60">
                                            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <span className="text-sm text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust Section */}
                <section className="mt-24 py-12 border-t border-border/50 text-center space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
                        <div className="space-y-3">
                            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                <Building2 className="text-accent w-6 h-6" />
                            </div>
                            <h4 className="font-bold">Pour les Professionnels</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Personnalisez vos documents avec votre identité visuelle et gérez des centaines de logements sans effort.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <HelpCircle className="text-blue-500 w-6 h-6" />
                            </div>
                            <h4 className="font-bold">Support 100% Local</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Une équipe basée au Sénégal pour vous accompagner sur WhatsApp et par téléphone.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                <Check className="text-green-500 w-6 h-6" />
                            </div>
                            <h4 className="font-bold">Sans engagement</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Changez de plan ou résiliez votre abonnement à tout moment depuis votre tableau de bord.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            {selectedPlanDetails && (
                <ManualPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    plan={selectedPlanDetails}
                    onSuccess={() => {
                        toast({
                            title: "Demande enregistrée",
                            description: "Votre abonnement passera en mode vérification.",
                        });
                        navigate("/owner-dashboard?tab=subscription");
                    }}
                />
            )}
        </div>
    );
};

export default Pricing;
