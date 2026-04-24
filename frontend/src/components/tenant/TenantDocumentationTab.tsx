import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  CreditCard, 
  Wrench, 
  MessageSquare, 
  AlertTriangle, 
  Download,
  Smartphone,
  Monitor,
  Lightbulb,
  ArrowRight,
  Info,
  CheckCircle2
} from "lucide-react";

export const TenantDocumentationTab = () => {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const sections = [
    {
      id: "search-apply",
      title: "Postuler à une annonce",
      icon: <Search className="h-5 w-5 text-blue-500" />,
      purpose: "Trouver le logement idéal et envoyer votre candidature en quelques clics sans paperasse inutile.",
      steps: [
        "Utilisez la barre de recherche pour filtrer par zone, prix ou type de bien.",
        "Cliquez sur un bien pour voir les détails et photos.",
        "Cliquez sur le bouton 'Postuler'.",
        "Remplissez votre profil locataire (cela servira pour toutes vos futures candidatures).",
        "Attendez la réponse du propriétaire via la messagerie ou par email."
      ],
      tip: "Complétez bien votre profil ! Un dossier complet a 5x plus de chances d'être accepté."
    },
    {
      id: "payments-receipts",
      title: "Suivi des paiements & Quittances",
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
      purpose: "Consultez l'historique de vos loyers payés et téléchargez vos quittances officielles à tout moment.",
      steps: [
        "Allez dans votre 'Tableau de bord'.",
        "Consultez la section 'Mes Paiements'.",
        "Cliquez sur l'icône de téléchargement à côté d'un mois payé.",
        "Votre quittance PDF est générée instantanément avec la signature du propriétaire."
      ]
    },
    {
      id: "maintenance",
      title: "Signaler un problème (Maintenance)",
      icon: <Wrench className="h-5 w-5 text-orange-500" />,
      purpose: "Une fuite d'eau ? Une panne d'électricité ? Informez votre propriétaire officiellement et suivez l'avancée des réparations.",
      steps: [
        "Allez dans l'onglet 'Maintenance'.",
        "Cliquez sur 'Nouvelle demande'.",
        "Décrivez le problème et prenez une photo (indispensable pour aider le propriétaire).",
        "Suivez le statut de votre demande (En attente, En cours, Résolu)."
      ]
    },
    {
      id: "chatbot",
      title: "Utiliser le Chatbot IA",
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      purpose: "Votre assistant personnel pour vous aider à naviguer, répondre à vos questions sur un quartier ou vous expliquer vos droits.",
      steps: [
        "Cliquez sur l'icône de bulle en bas à droite de votre écran.",
        "Posez votre question (ex: 'Comment télécharger ma quittance ?' ou 'Quelles sont les écoles à proximité de Mermoz ?').",
        "L'IA vous répond instantanément en se basant sur les données de SamaLocation."
      ]
    },
    {
      id: "report",
      title: "Signaler un propriétaire",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      purpose: "Pour garantir la sécurité de tous, vous pouvez signaler un propriétaire en cas d'annonce frauduleuse, de comportement abusif ou de non-respect des engagements.",
      steps: [
        "Allez sur le profil de l'agence ou du propriétaire.",
        "Cliquez sur le bouton 'Signaler' (si disponible) ou contactez directement le support.",
        "Expliquez clairement le motif (Tentative d'arnaque, Logement non conforme, etc.).",
        "Joignez des preuves (captures d'écran, photos) si nécessaire.",
        "Notre équipe de modération traitera votre demande sous 24h."
      ],
      tip: "Ne versez JAMAIS d'argent avant d'avoir visité le bien. SamaLocation ne vous demandera jamais de payer pour une simple visite."
    },
    {
      id: "install",
      title: "Installer SamaLocation sur votre téléphone",
      icon: <Download className="h-5 w-5 text-pink-500" />,
      purpose: "Accédez à vos quittances et messages plus rapidement en ajoutant l'application sur votre écran d'accueil.",
      subSections: [
        {
          title: "Sur iPhone (Safari)",
          content: "Cliquez sur 'Partager' (carré avec flèche), puis sur 'Sur l'écran d'accueil'."
        },
        {
          title: "Sur Android (Chrome)",
          content: "Cliquez sur les 3 points en haut à droite, puis sur 'Installer l'application'."
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Guide Locataire</h2>
          <p className="text-muted-foreground mt-1">Tout ce qu'il faut savoir pour bien gérer votre location.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button 
            variant={device === "desktop" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setDevice("desktop")}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" /> Ordinateur
          </Button>
          <Button 
            variant={device === "mobile" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setDevice("mobile")}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" /> Mobile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-none bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <Lightbulb className="h-10 w-10 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Une question ?</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Si vous ne trouvez pas la réponse ici, notre équipe est là pour vous aider.
              </p>
              <Button variant="secondary" className="w-full text-primary font-bold gap-2" asChild>
                <Link to="/contact">
                  Contacter le support <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Accordion type="single" collapsible className="w-full space-y-4 border-none" defaultValue="search-apply">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id} id={section.id} className="border rounded-xl bg-card shadow-sm px-2">
                <AccordionTrigger className="hover:no-underline py-4 px-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2 rounded-full bg-muted">
                      {section.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{section.title}</h4>
                      <p className="text-sm text-muted-foreground font-normal line-clamp-1">{section.purpose.substring(0, 80)}...</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-6">
                  <div className="space-y-6 pt-4">
                    <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border-l-4 border-primary/30">
                      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm mb-1 uppercase tracking-tight">À quoi ça sert ?</p>
                        <p className="text-muted-foreground leading-relaxed">{section.purpose}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h5 className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Comment faire ?
                        </h5>
                        <ul className="space-y-3">
                          {section.steps?.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground mt-0.5">{step}</span>
                            </li>
                          ))}
                        </ul>

                        {section.subSections?.map((sub, i) => (
                          <div key={i} className="space-y-2 pt-2">
                            <h6 className="font-bold text-sm">{sub.title}</h6>
                            <p className="text-sm text-muted-foreground">{sub.content}</p>
                          </div>
                        ))}

                        {section.tip && (
                          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20 flex gap-3">
                            <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0" />
                            <p className="text-xs text-yellow-800 dark:text-yellow-500 italic">
                              <strong>Conseil :</strong> {section.tip}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="relative group">
                        <div className="aspect-video bg-muted rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/20 flex items-center justify-center relative">
                          <div className="text-center p-6">
                             {device === "desktop" ? <Monitor className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" /> : <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" />}
                             <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Capture {device}</p>
                             <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Simulation Locataire...</p>
                          </div>
                          <div className="absolute top-2 left-2 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                          </div>
                        </div>
                        <Badge className="absolute -top-2 -right-2 shadow-lg" variant="secondary">Illustration</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};
