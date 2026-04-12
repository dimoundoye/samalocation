import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Home,
  Users,
  CheckCircle2,
  Zap,
  Search,
  CreditCard,
  FileText,
  TrendingUp,
  Globe,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              À Propos de Samalocation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              La solution moderne pour digitaliser et simplifier la gestion immobilière au Sénégal.
              Nous connectons propriétaires et locataires en toute transparence.
            </p>
          </div>

          {/* Introduction Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Home className="text-primary h-8 w-8" />
                Qu'est-ce que Samalocation ?
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed text-justify">
                <p>
                  Samalocation est une plateforme technologique innovante dédiée à l'écosystème immobilier.
                  Née de la volonté de résoudre les défis complexes du marché locatif, notre plateforme
                  offre des outils intuitifs pour automatiser les tâches répétitives et sécuriser chaque échange.
                </p>
                <p>
                  Que vous soyez un propriétaire gérant un vaste patrimoine ou un étudiant à la recherche de son
                  premier studio, Samalocation est conçu pour vous offrir une expérience fluide, sans tracas et
                  totalement transparente, adaptée aux réalités du marché sénégalais.
                </p>
                <p>
                  Notre mission est de restaurer la confiance entre les acteurs du secteur en utilisant
                  la technologie pour éliminer les ambiguïtés et simplifier chaque étape du processus locatif,
                  de la mise en ligne de l'annonce jusqu'à la signature digitale des contrats.
                </p>
              </div>
            </div>
            <div className="bg-secondary/5 rounded-3xl p-8 border border-border/50 shadow-sm">
              <h3 className="text-2xl font-bold mb-4 text-primary">Notre Vision</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Nous croyons en un futur où trouver un logement ou gérer son patrimoine immobilier ne devrait plus être
                une source de stress. Samalocation se positionne comme le pont numérique essentiel entre les besoins des
                locataires et les exigences des propriétaires, garantissant équité et rapidité.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">Vision Locale, <br/>Standards Globaux</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">Innovation <br/>Technologique</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nos Valeurs Section */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold mb-12 text-center">Nos Valeurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Confiance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nous plaçons la sécurité et l'intégrité au cœur de chaque transaction entre propriétaires et locataires professionnels.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Innovation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nous utilisons les meilleures technologies pour digitaliser l'immobilier sénégalais et simplifier votre quotidien.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">Proximité</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Notre équipe locale comprend parfaitement les réalités du marché et reste à votre écoute pour un accompagnement personnalisé.
                </p>
              </div>
            </div>
          </div>

          {/* Objectives Section */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold mb-12 text-center">Nos Objectifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-soft bg-secondary/10">
                <CardContent className="p-8 text-center pt-10">
                  <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Transparence Totale</h3>
                  <p className="text-muted-foreground">
                    Éliminer les zones d'ombre dans les relations locatives grâce à des contrats clairs et un suivi des paiements en temps réel.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft bg-secondary/10">
                <CardContent className="p-8 text-center pt-10">
                  <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Efficacité Accrue</h3>
                  <p className="text-muted-foreground">
                    Réduire le temps passé sur l'administratif pour permettre aux propriétaires de se concentrer sur l'essentiel.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft bg-secondary/10">
                <CardContent className="p-8 text-center pt-10">
                  <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Accessibilité</h3>
                  <p className="text-muted-foreground">
                    Rendre la recherche de logement accessible à tous, peu importe le budget, avec des outils numériques performants.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mb-24 bg-primary/5 rounded-3xl p-8 md:p-16 border border-primary/10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Pourquoi choisir Samalocation ?</h2>
              <p className="text-muted-foreground text-lg">
                Nous ne sommes pas seulement un site d'annonces, nous sommes un partenaire de gestion.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="bg-primary/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Paiements Sécurisés (Prochainement)</h3>
                  <p className="text-muted-foreground">Nous travaillons à l'intégration des solutions locales (Wave, Orange Money) pour automatiser vos transactions en toute sécurité.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Quittances Automatiques</h3>
                  <p className="text-muted-foreground">Plus besoin de papier. Générez et envoyez des quittances numériques conformes en un clic.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Support Prioritaire</h3>
                  <p className="text-muted-foreground">Notre équipe est disponible pour vous accompagner dans chaque étape du processus.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Sécurité des Données</h3>
                  <p className="text-muted-foreground">Vos informations et documents sont chiffrés et protégés selon les normes internationales.</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Roles Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            {/* Owner Details */}
            <div className="space-y-6">
              <div className="bg-primary/10 w-fit p-4 rounded-2xl mb-4">
                <Home className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Côté Propriétaire</h2>
              <p className="text-muted-foreground text-lg italic">
                Reprenez le contrôle sur vos biens immobiliers.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/10 text-green-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Gestion des annonces :</strong> Publiez et mettez à jour vos biens avec des photos haute définition.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/10 text-green-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Suivi des paiements :</strong> Visualisez l'état des loyers (payés, en retard, en attente) en un coup d'œil.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/10 text-green-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Gestion de l'équipe :</strong> Ajoutez des agents ou des co-gestionnaires pour vous aider dans vos tâches.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/10 text-green-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Rapports Financiers :</strong> Exportez des bilans mensuels ou annuels pour votre comptabilité.</span>
                </li>
              </ul>
            </div>

            {/* Tenant Details */}
            <div className="space-y-6">
              <div className="bg-primary/10 w-fit p-4 rounded-2xl mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Côté Locataire</h2>
              <p className="text-muted-foreground text-lg italic">
                Trouvez votre prochain foyer en toute simplicité.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-500/10 text-blue-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Recherche Intelligente :</strong> Filtrez par quartier, budget, type de bien et commodités.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-500/10 text-blue-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Messagerie Intégrée :</strong> Échangez directement avec les propriétaires sans partager votre numéro personnel.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-500/10 text-blue-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Historique de Location :</strong> Accédez à toutes vos quittances et contrats de bail dans votre espace personnel.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-500/10 text-blue-600 rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span><strong>Système de Rappels :</strong> Ne manquez plus une échéance grâce aux notifications automatiques.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Process Section */}
          <div className="mb-32">
            <h2 className="text-4xl font-bold mb-16 text-center">Comment ça marche ?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Owner Process */}
              <div className="space-y-12">
                <h3 className="text-2xl font-bold text-primary flex items-center gap-3 bg-primary/5 w-fit px-6 py-2 rounded-full mx-auto md:mx-0">
                  <Home className="h-6 w-6" /> Pour le Propriétaire
                </h3>
                <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/20">
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-primary/30">1</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Inscription gratuite</h4>
                      <p className="text-muted-foreground">Créez votre compte en quelques secondes et accédez à votre tableau de bord sécurisé.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-primary/30">2</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Publication sans frais</h4>
                      <p className="text-muted-foreground">Ajoutez vos biens avec photos et descriptions détaillées pour attirer les meilleurs locataires.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-primary/30">3</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Gérance simplifiée</h4>
                      <p className="text-muted-foreground">Suivez vos paiements, générez vos quittances et gérez votre parc jusqu'à 5 logements gratuitement.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Process */}
              <div className="space-y-12">
                <h3 className="text-2xl font-bold text-accent flex items-center gap-3 bg-accent/5 w-fit px-6 py-2 rounded-full mx-auto md:mx-0">
                  <Search className="h-6 w-6" /> Pour le Locataire
                </h3>
                <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-accent/20">
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-accent/30">1</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Recherche intelligente</h4>
                      <p className="text-muted-foreground">Utilisez nos filtres avancés pour trouver le logement idéal selon votre budget et quartier.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-accent/30">2</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Contact direct</h4>
                      <p className="text-muted-foreground">Discutez en toute sécurité avec le propriétaire via notre messagerie interne sans intermédiaire.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 relative">
                    <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0 z-10 shadow-lg shadow-accent/30">3</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Installation & Quittances</h4>
                      <p className="text-muted-foreground">Emménagez sereinement et retrouvez tout l'historique de vos paiements dans votre espace.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold mb-12 text-center">Questions Fréquentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Est-ce que Samalocation est gratuit ?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  L'inscription, la recherche et l'ajout de biens sont 100% gratuits. La gestion complète (quittances, suivi) est gratuite jusqu'à 5 logements. Au-delà, un abonnement premium est nécessaire pour accéder aux outils avancés.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Comment mes données sont-elles protégées ?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nous utilisons des protocoles de chiffrement avancés (SSL/TLS) et un hachage sécurisé pour vos mots de passe. Vos documents personnels sont stockés de manière isolée et ne sont accessibles qu'aux administrateurs habilités pour la vérification.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Puis-je payer mon loyer via l'application ?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Cette fonctionnalité est actuellement en cours de développement. Bientôt, vous pourrez régler vos loyers via Wave ou Orange Money directement depuis votre tableau de bord et recevoir vos quittances numériques.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Comment devenir un propriétaire vérifié ?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Il vous suffit de soumettre vos documents (CNI, preuve de propriété) dans votre espace profil. Notre équipe validera votre badge en moins de 24h pour renforcer votre crédibilité.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center pt-10 border-t">
            <h2 className="text-3xl font-bold mb-6">Prêt à simplifier votre gestion immobilière ?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8">
                <Link to="/auth">Créer un compte</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link to="/search">Parcourir les annonces</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
