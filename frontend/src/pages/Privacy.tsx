import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>

          <Card className="shadow-soft">
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Samalocation s'engage à protéger la vie privée de ses utilisateurs au Sénégal. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles dans le cadre de notre service de gestion locative.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">2. Collecte des données</h2>
                <p className="text-muted-foreground mb-4">
                  Nous collectons les informations nécessaires au bon fonctionnement de la plateforme :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Identité (nom complet, email, téléphone)</li>
                  <li>Informations sur les biens immobiliers (photos, descriptifs, adresses)</li>
                  <li>Documents de gestion (reçus de loyer, contrats)</li>
                  <li>Communications entre utilisateurs (conservées pendant 5 mois)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">3. Utilisation des données</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données sont traitées pour :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>La gestion technique des comptes et des annonces</li>
                  <li>La génération et la conservation des reçus de paiement</li>
                  <li>L'envoi de notifications (nouveaux messages, nouveaux reçus)</li>
                  <li>La modération via le système de signalement</li>
                  <li>L'analyse statistique de la plateforme</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">4. Protection des données</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nous utilisons des protocoles de sécurité avancés pour protéger vos informations contre tout accès non autorisé. Vos mots de passe sont cryptés et vos documents sont stockés de manière sécurisée.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">5. Durée de conservation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vos informations de compte sont conservées tant que votre compte est actif. Cependant, les messages de conversation sont automatiquement purgés après une durée de 5 mois pour des raisons de performance et de minimalisation des données.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">6. Vos droits</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément aux lois sur la protection des données, vous disposez d'un droit :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>D'accès et de rectification de vos données</li>
                  <li>De suppression complète de votre compte</li>
                  <li>D'opposition au traitement de vos données</li>
                  <li>De portabilité (export de vos reçus et données)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3 text-primary">6. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question, contactez notre délégué à la protection des données :
                </p>
                <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-muted-foreground">
                  <p>Email: contact@samalocation.com</p>
                  <p>Dakar, Sénégal</p>
                </div>
              </section>

              <section className="pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground italic">
                  Dernière mise à jour : Janvier 2026
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
