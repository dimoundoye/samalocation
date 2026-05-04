import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background pb-12">
      <SEO 
        title="Politique de Confidentialité | Samalocation"
        description="Découvrez comment Samalocation protège vos données personnelles. Nous nous engageons à respecter la confidentialité de nos utilisateurs au Sénégal."
      />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
            <p className="text-muted-foreground italic">Dernière mise à jour : 04 Mai 2026</p>
          </div>

          <div className="mb-10 bg-secondary/30 rounded-2xl p-6 md:p-8 text-center sm:text-left border border-secondary">
            <h2 className="text-2xl font-bold text-foreground mb-3">Votre vie privée est notre priorité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous comprenons que la gestion de vos données personnelles est une question de confiance. C'est pourquoi Samalocation s'applique à respecter les normes les plus strictes de confidentialité. Nous ne collectons que ce qui est utile pour vous offrir une expérience fluide, et nous protégeons vos informations comme s'il s'agissait des nôtres.
            </p>
          </div>

          <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-10">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" /> 1. Engagement et Conformité (CDP)
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Samalocation s'engage à traiter vos données personnelles conformément à la législation sénégalaise en vigueur, notamment la loi n° 2008-12 du 25 janvier 2008 portant sur la protection des données à caractère personnel. Nous agissons sous la supervision de la Commission de Protection des Données Personnelles (CDP).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">2. Base Légale du Traitement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Le traitement de vos données repose sur :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                  <li><strong>L'exécution du contrat</strong> : Pour vous permettre d'utiliser les fonctionnalités de la plateforme.</li>
                  <li><strong>Votre consentement</strong> : Notamment pour les communications et les documents de vérification.</li>
                  <li><strong>L'intérêt légitime</strong> : Pour assurer la sécurité et la prévention des fraudes sur Samalocation.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">3. Nature des données collectées</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-secondary/10 p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Données d'Identité et de Contact</h3>
                    <p className="text-sm text-muted-foreground">Nom, prénom, email, numéro de téléphone (WhatsApp), et informations de profil.</p>
                  </div>
                  <div className="bg-secondary/10 p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Documents de Vérification et Signature</h3>
                    <p className="text-sm text-muted-foreground">Pièce d'identité, preuve de propriété (Titre foncier/Facture), selfie de contrôle (Liveness check) et signature électronique scannée.</p>
                  </div>
                  <div className="bg-secondary/10 p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Données Immobilières et de Gestion</h3>
                    <p className="text-sm text-muted-foreground">Annonces, photos, contrats, quittances de loyer générées et coordonnées GPS des biens.</p>
                  </div>
                  <div className="bg-secondary/10 p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Communications</h3>
                    <p className="text-sm text-muted-foreground">Historique des messages échangés via la messagerie interne pour assurer la sécurité des échanges.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">4. Finalités du Traitement</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Vos données sont traitées pour :
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 bg-card p-3 rounded-lg"> La mise en relation locataire/propriétaire</li>
                  <li className="flex items-center gap-2 bg-card p-3 rounded-lg"> La génération automatique de quittances</li>
                  <li className="flex items-center gap-2 bg-card p-3 rounded-lg"> La détection et prévention des arnaques</li>
                  <li className="flex items-center gap-2 bg-card p-3 rounded-lg"> L'amélioration technique du service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">5. Durée de Conservation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Données de compte</strong> : Conservées tant que votre compte est actif et jusqu'à 3 ans après la dernière interaction.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  <strong>Messages et Transactions</strong> : Conservés indéfiniment (ou jusqu'à suppression du compte) afin de garantir la sécurité et l'historique des preuves en cas de litige entre les parties.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  <strong>Documents de vérification</strong> : Conservés de manière sécurisée pendant toute la durée de validité du badge "Vérifié".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary font-bold text-red-600">Attention : Votre Sécurité Numérique</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bien que nous utilisions des protocoles de sécurité avancés, la sécurité commence par vous. Ne partagez jamais vos identifiants Samalocation. Nous ne vous demanderons JAMAIS votre mot de passe par email ou téléphone. Soyez vigilant face aux tentatives de "phishing".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">6. Partage et Sous-traitance</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Samalocation ne vend ni ne loue vos données personnelles. Pour le fonctionnement technique, nous utilisons des sous-traitants de confiance :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Cloudinary</strong> : Pour l'hébergement sécurisé de vos photos et documents.</li>
                  <li><strong>E-mail Service</strong> : Pour l'envoi de vos notifications et quittances.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">7. Sécurité et Chiffrement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Toutes les données transitent via des protocoles HTTPS sécurisés. Les mots de passe sont hachés de manière irréversible (Bcrypt). L'accès aux documents sensibles est restreint uniquement au personnel administratif habilité de Samalocation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">8. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nous utilisons des cookies essentiels pour assurer le maintien de votre session et la sécurité de votre connexion. Aucun cookie de pistage publicitaire tiers n'est utilisé sur notre plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">9. Vos Droits</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément aux lois du Sénégal, vous disposez d'un droit :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="bg-card p-3 rounded-lg">D'accès et de rectification</div>
                  <div className="bg-card p-3 rounded-lg">De suppression de compte</div>
                  <div className="bg-card p-3 rounded-lg">De portabilité de vos données</div>
                  <div className="bg-card p-3 rounded-lg">D'opposition au traitement</div>
                </div>
              </section>

              <section className="pt-10 border-t flex flex-col items-center">
                <p className="text-muted-foreground text-sm mb-4">Une question sur vos données ?</p>
                <Button variant="outline" className="gap-2" onClick={() => window.location.href = 'mailto:contact@samalocation.com'}>
                  Contactez nous
                </Button>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
