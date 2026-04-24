import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Home,
  Users,
  PenTool,
  FileText,
  Wrench,
  Layers,
  Receipt,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Info,
  Smartphone,
  Monitor,
  Lightbulb,
  ArrowRight,
  Download
} from "lucide-react";

export const OwnerDocumentationTab = () => {
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

  const sections = [
    {
      id: "add-property",
      title: "Comment ajouter un bien",
      icon: <Home className="h-5 w-5 text-blue-500" />,
      purpose: "Cette fonctionnalité vous permet de numériser votre patrimoine immobilier. Une fois ajouté, votre bien devient une entité gérable : vous pouvez y affecter des locataires, suivre les paiements et, si vous le souhaitez, le publier pour attirer de nouveaux candidats.",
      steps: [
        "Allez dans l'onglet 'Mes logements'.",
        "Cliquez sur le bouton '+ Ajouter un logement'.",
        "Remplissez les informations de base (Nom, Adresse, Type de bien).",
        "Ajoutez des photos de haute qualité (le système les optimisera automatiquement).",
        "Configurez les unités (ex: Appartement A1, Studio B2) avec leurs loyers respectifs."
      ],
      tip: "Utilisez des photos lumineuses. Un bien avec de belles photos reçoit 3x plus de candidatures."
    },
    {
      id: "register-tenants",
      title: "Enregistrer mes locataires",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      purpose: "L'enregistrement lie un locataire à une unité spécifique. C'est l'étape indispensable pour générer des quittances automatiques et suivre l'historique des paiements.",
      subSections: [
        {
          title: "Avec compte SamaLocation",
          content: "Recherchez le locataire par son ID (ex: SL12345) ou son email. Cela lui permet de recevoir ses quittances directement dans son espace et de communiquer avec vous via la messagerie intégrée."
        },
        {
          title: "Sans compte (Gestion manuelle)",
          content: "Si votre locataire n'est pas technophile, vous pouvez l'enregistrer manuellement en créant un compte pour lui et lui donner un login et un mot de passe temporaire. Vous pourrez toujours générer ses quittances en PDF pour lui envoyer par WhatsApp ou lui remettre en main propre."
        }
      ]
    },
    {
      id: "signature",
      title: "Configurer une signature numérique",
      icon: <PenTool className="h-5 w-5 text-orange-500" />,
      purpose: "La signature numérique automatise la validation de vos documents. Une fois configurée, elle sera apposée sur chaque quittance et contrat généré, vous évitant des heures d'impression et de scan manuel.",
      steps: [
        "Allez dans 'Paramètres' > 'Profil'.",
        "Cliquez sur 'Scanner ma signature'.",
        "Prenez une photo de votre signature (ou cachet d'entreprise) sur une feuille de papier BLANCHE.",
        "Ajustez le curseur de 'Seuil' pour rendre le fond transparent et le trait bien net.",
        "Enregistrez. Elle est prête !"
      ],
      tip: "Signez avec un stylo noir ou bleu foncé pour un meilleur contraste lors du scan."
    },
    {
      id: "contracts",
      title: "Faire un contrat de location",
      icon: <FileText className="h-5 w-5 text-emerald-500" />,
      purpose: "Le contrat digitalisé sécurise votre location. Il définit les règles, le loyer et les charges, tout en étant consultable à tout moment par les deux parties.",
      steps: [
        "Sélectionnez un locataire actif.",
        "Allez dans l'onglet 'Documents' ou 'Contrats'.",
        "Choisissez un modèle de contrat (Premium ou Standard).",
        "Remplissez les dates et conditions spécifiques.",
        "Générez le PDF. Si vous avez configuré votre signature, il sera déjà signé !"
      ]
    },
    {
      id: "maintenance",
      title: "Gérer la maintenance",
      icon: <Wrench className="h-5 w-5 text-red-500" />,
      purpose: "Centralisez toutes les pannes (fuites, électricité, etc.). Vos locataires peuvent vous envoyer des photos du problème, et vous suivez la résolution jusqu'à la clôture.",
      steps: [
        "Consultez les demandes entrantes dans 'Maintenance'.",
        "Changez le statut en 'En cours' une fois le technicien dépêché.",
        "Ajoutez des notes ou des photos de la réparation terminée.",
        "Marquez comme 'Résolu' pour archiver la demande."
      ]
    },
    {
      id: "gerance",
      title: "Gérance & Organisation",
      icon: <Layers className="h-5 w-5 text-indigo-500" />,
      purpose: "Pour les propriétaires gérant plusieurs immeubles, cette fonction permet de structurer votre patrimoine pour ne jamais vous perdre.",
      steps: [
        "Regroupez vos unités par 'Bâtiment' ou 'Résidence'.",
        "Utilisez les filtres de recherche pour voir instantanément qui a payé dans quel bâtiment.",
        "Visualisez votre taux d'occupation global par zone géographique."
      ]
    },
    {
      id: "receipts",
      title: "Générer une quittance",
      icon: <Receipt className="h-5 w-5 text-green-500" />,
      purpose: "La quittance est la preuve légale du paiement. Sur SamaLocation, elle est générée en 2 secondes, éliminant les carnets de quittances papier.",
      steps: [
        "Allez sur la fiche du locataire.",
        "Cliquez sur 'Générer Quittance'.",
        "Vérifiez le montant et la période.",
        "Validez. Le locataire reçoit une notification et le PDF est archivé."
      ]
    },
    {
      id: "collaborators",
      title: "Ajouter un collaborateur",
      icon: <Briefcase className="h-5 w-5 text-slate-500" />,
      purpose: "Déléguez la gestion quotidienne (quittances, maintenance) à un gérant ou une secrétaire, tout en gardant un œil sur les finances.",
      steps: [
        "Allez dans 'Abonnement' > 'Équipe' (selon votre plan).",
        "Ajoutez l'email de votre collaborateur.",
        "Définissez ses droits (lecture seule, gestion quittances, etc.)."
      ]
    },
    {
      id: "badge",
      title: "Demande de Badge Vérifié",
      icon: <ShieldCheck className="h-5 w-5 text-cyan-500" />,
      purpose: "Le badge 'Vérifié' est un gage de confiance ultime. Il rassure les locataires sur le fait que vous êtes un propriétaire réel et sérieux.",
      steps: [
        "Allez dans vos Paramètres.",
        "Téléchargez votre pièce d'identité et un justificatif de propriété (facture eau/élec ou titre foncier).",
        "Prenez un selfie de vérification.",
        "Notre équipe valide votre dossier sous 24/48h."
      ]
    },
    {
      id: "install",
      title: "Installer l'application (PWA)",
      icon: <Download className="h-5 w-5 text-pink-500" />,
      purpose: "SamaLocation est une Application Web Progressive (PWA). Cela signifie que vous pouvez l'installer sur votre téléphone ou ordinateur sans passer par l'App Store ou le Play Store. Elle sera accessible via une icône sur votre écran d'accueil, comme une application classique.",
      subSections: [
        {
          title: "Sur Android (Chrome)",
          content: "Ouvrez samalocation.com, cliquez sur les 3 petits points en haut à droite, puis sur 'Installer l'application' ou 'Ajouter à l'écran d'accueil'."
        },
        {
          title: "Sur iPhone / iPad (Safari)",
          content: "Ouvrez samalocation.com dans Safari, cliquez sur l'icône de partage (le carré avec une flèche vers le haut), puis faites défiler et cliquez sur 'Sur l'écran d'accueil'."
        },
        {
          title: "Sur Windows ou MacBook (Chrome/Edge)",
          content: "Dans la barre d'adresse, une petite icône avec un '+' ou une flèche apparaîtra à droite. Cliquez dessus pour installer SamaLocation sur votre ordinateur."
        }
      ],
      tip: "L'installation PWA prend moins de 1 Mo d'espace et vous permet d'ouvrir l'application instantanément sans retaper l'adresse."
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Guide d'utilisation</h2>
          <p className="text-muted-foreground mt-1">Apprenez à maîtriser SamaLocation pour simplifier votre gestion.</p>
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
              <h3 className="font-bold text-lg mb-2">Besoin d'aide ?</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Ce guide couvre les fonctions essentielles. Si vous avez une question spécifique, notre chatbot IA est disponible 24h/24 en bas à droite de votre écran.
              </p>
              <Button variant="secondary" className="w-full text-primary font-bold gap-2" asChild>
                <Link to="/contact">
                  Contacter le support <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="hidden lg:block space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Sommaire</p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              >
                {s.icon}
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Accordion type="single" collapsible className="w-full space-y-4 border-none" defaultValue="add-property">
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
                          {/* Placeholder for the screenshot */}
                          <div className="text-center p-6">
                            {device === "desktop" ? <Monitor className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" /> : <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" />}
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Capture {device}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Simulation de l'interface en cours...</p>
                          </div>

                          {/* Decorative elements to make it look like a real app capture */}
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
