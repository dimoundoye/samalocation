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
  CheckCircle2,
  Share2,
  Shield,
  ShieldCheck,
  IdCard
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
        "Cliquez sur le bouton 'Demander à louer'.",
        "Remplissez votre dossier locataire (cela servira pour toutes vos futures candidatures).",
        "Attendez la réponse du propriétaire via la messagerie ou par email."
      ],
      tip: "Complétez bien votre dossier! Un dossier complet a 5x plus de chances d'être accepté."
    },
    {
      id: "tenant-id",
      title: "Votre identifiant Samalocation",
      icon: <IdCard className="h-5 w-5 text-primary" />,
      purpose: "Votre identifiant unique permet à votre propriétaire de retrouver votre compte et de vous rattacher à votre logement. Sans lui, il ne peut pas vous affecter.",
      steps: [
        "Tant que vous n'êtes rattaché à aucun logement, une carte 'Votre identifiant Samalocation' s'affiche en haut de votre 'Tableau de bord'.",
        "Cliquez sur 'Copier' puis collez l'identifiant dans un message à votre propriétaire, ou cliquez sur 'Partager' pour l'envoyer directement (WhatsApp, SMS...).",
        "Votre propriétaire saisit cet identifiant pour vous affecter à votre logement : vous accédez alors à vos reçus, votre caution et vos contrats.",
        "Vous retrouvez votre identifiant à tout moment : à côté de votre nom sur le 'Tableau de bord', dans le menu de votre profil (en haut à droite) ou dans 'Paramètres' > 'Informations Personnelles'. Un clic suffit pour le copier."
      ],
      tip: "Envoyez votre identifiant à votre propriétaire dès votre inscription : il pourra vous rattacher au logement sans attendre."
    },
    {
      id: "share-dossier",
      title: "Partager son dossier locataire",
      icon: <Share2 className="h-5 w-5 text-indigo-500" />,
      purpose: "Transmettre vos justificatifs (CNI, bulletins de salaire, garant...) de manière sécurisée et chiffrée à un bailleur ou une agence pour postuler en 1 clic sans renvoyer de documents.",
      steps: [
        "Rendez-vous dans l'onglet 'Mon Dossier' pour renseigner votre profil et téléverser vos pièces (CNI, bulletins de salaire, justificatif de domicile, garant).",
        "Cliquez sur 'Enregistrer le dossier' pour sauvegarder vos documents dans votre coffre-fort chiffré.",
        "Ouvrez la messagerie avec le propriétaire du logement qui vous intéresse dans l'onglet 'Messages'.",
        "Cliquez sur le bouton 'Partager mon dossier' (avec l'icône de bouclier) situé en haut à droite de la conversation.",
        "Le bailleur reçoit immédiatement un accès sécurisé à votre dossier pour étudier votre candidature.",
        "Consultez les accès accordés et révoquez-les à tout moment depuis la section 'Partages actifs' de votre dossier."
      ],
      subSections: [
        {
          title: "Partage rapide dans le Chat",
          content: "Dans l'onglet 'Messages', ouvrez la discussion avec le bailleur et cliquez sur 'Partager mon dossier' dans l'en-tête. Un message automatique de confirmation lui est aussitôt transmis."
        },
        {
          title: "Partage sécurisé via la messagerie",
          content: "Pour protéger vos données sensibles (CNI, fiches de paie), la candidature 'Demander à louer' initie la discussion. Vous partagez ensuite votre dossier en 1 clic grâce au bouton dédié dans la conversation dès que vous le souhaitez."
        },
        {
          title: "Contrôle & Révocation des accès",
          content: "Dans l'onglet 'Mon Dossier', le bloc 'Partages actifs' affiche la liste des propriétaires autorisés avec la date de partage. Vous pouvez cliquer sur l'icône corbeille pour supprimer l'accès à tout instant."
        }
      ],
      tip: "Un dossier digital complété à 100% avec des pièces lisibles multiplie par 5 vos chances d'être retenu !"
    },
    {
      id: "payments-receipts",
      title: "Suivi des paiements & Quittances",
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
      purpose: "Consultez l'historique de vos loyers payés et téléchargez vos quittances officielles à tout moment.",
      steps: [
        "Ouvrez l'onglet 'Documents', puis le sous-onglet 'Mes reçus'.",
        "Filtrez si besoin par mois ou par année pour retrouver une quittance.",
        "Cliquez sur 'Voir' pour l'afficher ou sur 'PDF' pour la télécharger. Elle porte la signature du propriétaire si son abonnement l'inclut.",
        "Une quittance annulée par le propriétaire reste visible avec la mention 'ANNULÉ' : cliquez sur 'Motif' pour connaître la raison de l'annulation."
      ],
      tip: "'Mes reçus' ne contient que vos loyers. Le reçu de votre caution se trouve dans le sous-onglet 'Caution'."
    },
    {
      id: "deposit",
      title: "Votre caution (dépôt de garantie)",
      icon: <ShieldCheck className="h-5 w-5 text-amber-500" />,
      purpose: "La caution est une somme versée en début de bail pour garantir vos obligations. Ce n'est pas un loyer : votre propriétaire la conserve pendant le bail et vous la rend en fin de bail, déduction faite des sommes éventuellement dues.",
      steps: [
        "Ouvrez l'onglet 'Documents', puis le sous-onglet 'Caution'. Vous la retrouvez aussi dans le détail de votre bail ('Mes logements').",
        "Quand vous versez votre caution, votre propriétaire vous délivre un 'Reçu de caution' : cliquez sur 'Voir' ou 'PDF' pour le consulter.",
        "Pendant le bail, votre caution est indiquée comme 'Détenue'.",
        "En fin de bail, votre propriétaire enregistre la restitution. Le statut devient 'Restituée', 'Restituée en partie' ou 'Retenue en totalité', et vous recevez une notification.",
        "Le détail s'affiche directement : caution versée, chaque retenue avec son motif et son montant, puis le montant qui vous est rendu. Le décompte officiel est disponible en PDF."
      ],
      subSections: [
        {
          title: "Pourquoi une partie peut être retenue ?",
          content: "Le propriétaire peut déduire les sommes que vous lui devez encore : loyers ou charges impayés, réparations de dégâts constatés à l'état des lieux de sortie. Chaque retenue doit être motivée et apparaît sur le décompte."
        },
        {
          title: "Vous contestez une retenue ?",
          content: "Discutez-en d'abord avec votre propriétaire via l'onglet 'Messages', en citant le numéro du décompte. Si le désaccord persiste ou si une retenue vous semble abusive, utilisez 'Signaler un propriétaire'."
        }
      ],
      tip: "Faites un état des lieux d'entrée précis (avec photos) : c'est votre meilleure protection contre des retenues injustifiées en fin de bail."
    },
    {
      id: "maintenance",
      title: "Signaler un problème (Maintenance)",
      icon: <Wrench className="h-5 w-5 text-orange-500" />,
      purpose: "Une fuite d'eau ? Une panne d'électricité ? Informez votre propriétaire officiellement et suivez l'avancée des réparations.",
      steps: [
        "Allez dans l'onglet 'Maintenance'.",
        "Cliquez sur 'Nouveau signalement'.",
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
        "Posez votre question (ex: 'Comment télécharger ma quittance ?').",
        "L'IA vous répond instantanément en se basant sur les données de Samalocation."
      ]
    },
    {
      id: "report",
      title: "Signaler un propriétaire",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      purpose: "Pour garantir la sécurité de tous, vous pouvez alerter l'équipe Samalocation en cas de comportement abusif, de non-respect du bail ou d'annonce frauduleuse. Il existe deux façons de signaler selon votre situation.",
      steps: [
        "Votre propriétaire actuel : sur votre 'Tableau de bord', cliquez sur le bouton orange 'Signaler un propriétaire' en haut de la page (il faut avoir une location active).",
        "Si vous louez auprès de plusieurs propriétaires, choisissez celui qui est concerné dans la liste.",
        "Décrivez précisément la situation (10 caractères minimum) : les faits, les dates, les montants et, si possible, les numéros de reçus ou de contrats concernés.",
        "Ajoutez jusqu'à 5 photos comme preuves (captures d'écran, photos du logement, documents) avec le bouton 'Ajouter'. Elles ne sont visibles que par l'équipe Samalocation.",
        "Cliquez sur 'Envoyer le signalement' : il est transmis à l'administrateur de Samalocation, qui l'examine."
      ],
      subSections: [
        {
          title: "Signaler une annonce suspecte",
          content: "Avant toute location, si une annonce vous paraît frauduleuse, ouvrez-la et cliquez sur 'Signaler cette annonce' (connexion requise). Choisissez le motif : arnaque, bien déjà loué, photos ou informations trompeuses, prix abusif, intermédiaire se faisant passer pour le propriétaire, contenu inapproprié ou autre. Ajoutez des précisions si besoin."
        },
        {
          title: "Quand faire un signalement ?",
          content: "Signalez les situations graves : demande d'argent suspecte, menaces ou harcèlement, entrée dans le logement sans votre accord, refus répété de délivrer vos quittances, retenue de caution abusive, logement très différent de l'annonce. Pour une panne ou une réparation, utilisez plutôt l'onglet 'Maintenance' ; pour un simple désaccord, essayez d'abord d'en parler via 'Messages'."
        },
        {
          title: "Rédiger un signalement utile",
          content: "Restez factuel et précis : que s'est-il passé, quand, et pour quel montant. Joignez vos meilleures preuves en photo (captures de messages, état du logement, reçus) et gardez les originaux : l'équipe pourra vous demander des compléments. Vos échanges dans l'onglet 'Messages' restent une trace écrite précieuse."
        },
        {
          title: "Signalements abusifs",
          content: "Un signalement doit reposer sur des faits réels. Les signalements abusifs ou malveillants peuvent entraîner la suspension de votre accès à la plateforme."
        }
      ],
      tip: "Ne versez JAMAIS d'argent avant d'avoir visité le bien et rencontré le propriétaire. Samalocation ne vous demandera jamais de payer pour une simple visite."
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

          <Card className="shadow-sm border bg-card">
            <CardContent className="p-6">
              <Share2 className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-base mb-1">Dossier Digital</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Préparez vos documents une seule fois et partagez votre dossier en 1 clic aux propriétaires.
              </p>
              <Button variant="outline" size="sm" className="w-full font-semibold gap-1 text-xs" asChild>
                <Link to="/tenant-dashboard/dossier">
                  Gérer mon dossier <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Accordion type="single" collapsible className="w-full space-y-4 border-none">
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
