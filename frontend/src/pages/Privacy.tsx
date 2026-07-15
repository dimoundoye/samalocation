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
        description="Découvrez comment Samalocation protège vos données personnelles. Nous nous engageons à respecter la confidentialité de nos utilisateurs."
      />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
            <p className="text-muted-foreground italic">Dernière mise à jour : 14 juillet 2026</p>
          </div>

          <div className="mb-10 bg-secondary/30 rounded-2xl p-6 md:p-8 text-center sm:text-left border border-secondary">
            <h2 className="text-2xl font-bold text-foreground mb-3">Votre vie privée est notre priorité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous comprenons que la gestion de vos données personnelles est une question de confiance. C'est pourquoi Samalocation s'applique à respecter les normes les plus strictes de confidentialité. Nous ne collectons que ce qui est utile pour vous offrir une expérience fluide, et nous protégeons vos informations comme s'il s'agissait des nôtres.
            </p>
          </div>

          <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-12 text-foreground">
              {/* Introduction */}
              <div className="border-b pb-6">
                <p className="text-muted-foreground leading-relaxed">
                  En acceptant ce Règlement sur le respect de la vie privée au moment de l’inscription, vous acceptez toutes nos conditions et qu’on utilise ou divulgue certaines de vos informations personnelles conformément à la <strong>loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> portant sur la protection des données à caractère personnel, aux stipulations du présent règlement ainsi que le <strong>Décret n° 2008-721 du 30 juin 2008</strong> portant application de la loi n° 2008-12, et autres lois et règlements dont le respect serait requis par les autorités.
                </p>
              </div>

              {/* Définitions */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Définition de quelques termes clés</h3>
                <ul className="space-y-3 pl-4 text-muted-foreground text-sm list-none border-l-2 border-primary/20">
                  <li><strong>Consentement :</strong> Toute manifestation de volonté expresse, non équivoque, libre, spécifique et informée par laquelle la personne concernée ou son représentant légal, judiciaire ou conventionnel, accepte que ses données à caractère personnel fassent l’objet d’un traitement manuel ou électronique.</li>
                  <li><strong>Données à caractère personnel :</strong> Toute information relative à une personne physique identifiée ou identifiable directement ou indirectement, par référence à un numéro d’identification ou à un ou plusieurs éléments, propres à son identité physique, physiologique, génétique, psychique, culturelle, sociale ou économique.</li>
                  <li><strong>Vous :</strong> Désigne l’utilisateur (propriétaire, locataire ou gérant) qui accepte les termes et conditions du présent Règlement.</li>
                  <li><strong>Site / Application :</strong> L’ensemble des ressources et pages web liées sous le nom de domaine <em>samalocation.com</em>.</li>
                  <li><strong>Transaction :</strong> Les opérations de mise en relation, de signature électronique de bail, d’émission de quittances de loyer et de paiement en ligne effectuées via la plateforme.</li>
                </ul>
              </section>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <Shield className="h-5 w-5" /> 1. Aperçu
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pour réduire les risques de fraude immobilière, de blanchiment d’argent et toutes autres malversations, Samalocation vous demande de fournir des informations vous concernant et des informations relatives à vos biens ou vos justificatifs d'identité. En acceptant les conditions du présent Règlement sur le respect de la vie privée, vous acceptez que Samalocation (gérée par <strong>YAKIRIX</strong>) traite vos données de la manière décrite dans ce règlement.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nous nous engageons à ne pas divulguer vos informations personnelles à des tiers à des fins publicitaires sans votre consentement explicite. Toutefois, pour pouvoir améliorer continuellement la qualité du service Samalocation et protéger les intérêts de nos utilisateurs, nous devrons, dans certains cas (sous-traitance technique pour l'hébergement d'images comme Cloudinary, ou envoi de notifications par e-mail/SMS), partager avec des tiers des informations personnelles vous concernant, de manière très restreinte, toujours dans le respect de la législation en vigueur.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Chaque Compte Samalocation doit obligatoirement être lié à un numéro de téléphone mobile et une adresse e-mail valide.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                  Informations collectées
                </h2>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.1 Informations obligatoires</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour ouvrir un Compte Samalocation, vous devez nous communiquer les informations basiques suivantes :
                  </p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                    <li><strong>Bailleur (Propriétaire) :</strong> Nom, prénoms, nom de l'agence (optionnel), adresse e-mail, numéro de téléphone, mot de passe de connexion.</li>
                    <li><strong>Locataire :</strong> Nom, prénoms, adresse e-mail, numéro de téléphone, mot de passe de connexion.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.2 Informations facultatives ou complémentaires (KYC)</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Afin d'obtenir le statut "Profil Vérifié" et de sécuriser vos transactions, des informations additionnelles sont requises :
                  </p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                    <li><strong>Bailleur :</strong> piéces justificatives d'identité (CNI, passeport), preuve de propriété (facture d'électricité, eau) et liveness check (un selfie de vous tenant un document d'identité)</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.3 Accès à vos informations et modifications</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Conformément à la loi sénégalaise sur la protection des données personnelles, vous pouvez accéder à vos informations personnelles, les modifier ou les supprimer à tout moment depuis votre espace client.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.4 Informations sur la transaction</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Lorsqu'un loyer est déclaré ou payé en ligne sur Samalocation, nous enregistrons les détails de la transaction : montant, dates de début et de fin de bail, mode de paiement, et historique des quittances générées. Ces informations sont archivées de manière sécurisée afin de servir de preuve comptable et légale en cas de litige.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.5 Vérification auprès de tiers</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Afin de protéger notre communauté contre les faux propriétaires ou les profils frauduleux, nous pouvons effectuer des audits de cohérence sur les pièces de propriété ou d'identité soumises, en accord avec les lois en vigueur.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.6 Cookies</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Nous utilisons uniquement des cookies techniques essentiels pour maintenir votre session active et sécuriser votre connexion. Vous pouvez les désactiver dans votre navigateur, mais certaines fonctionnalités de la plateforme risquent de ne plus fonctionner correctement.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                  RÈGLEMENT DE DIVULGATION D'INFORMATIONS
                </h2>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">3.1 Divulgation à des tiers autorisés</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Samalocation ne vend ni ne loue vos données personnelles. Vos données peuvent être transmises aux autorités judiciaires, forces de l'ordre, ou organismes de régulation compétents (comme la <strong>CDP</strong> ou la <strong>CENTIF</strong>) dans le cadre d'enquêtes sur des fraudes ou activités potentiellement illégales, conformément aux lois sénégalaises en vigueur.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">3.2 Communication entre bailleurs et locataires</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour faciliter la gestion du bail, les bailleurs ont un accès restreint aux coordonnées et dossiers numériques de leurs locataires (nom, email, téléphone, documents transmis pour la location). Réciproquement, le locataire a accès aux coordonnées du bailleur. Vous vous engagez à n'utiliser ces informations que pour la gestion stricte du bail (à l'exclusion de tout démarchage commercial non sollicité).
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                  SÉCURITÉ DE VOS INFORMATIONS
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Conformément aux exigences de la loi n° 2008-12, Samalocation applique les normes de sécurité les plus strictes : hachage des mots de passe avec Bcrypt, chiffrement de toutes les connexions via le protocole HTTPS, et restriction des accès physiques et numériques aux bases de données.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed font-semibold">
                  La sécurité de votre compte dépend aussi de la protection de votre mot de passe. Ne le partagez jamais. Les équipes de Samalocation ne vous demanderont jamais votre mot de passe par e-mail ou par téléphone.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                  PROPORTIONNALITÉ ET FINALITÉ DU TRAITEMENT
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Les données traitées par Samalocation sont adéquates, pertinentes et strictement limitées à ce qui est nécessaire pour l'édition et le suivi des baux, l'édition automatique des quittances, et la mise en relation sécurisée entre propriétaires et locataires au Sénégal.
                </p>
              </section>

              {/* Section 6 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                  <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                  RESPONSABILITÉ DE YAKIRIX
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <strong>YAKIRIX</strong> garantit que les opérations de traitement de données effectuées sur Samalocation respectent la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur les données personnelles ainsi que son décret d'application. Pour toute question ou réclamation sur le traitement de vos données, vous pouvez saisir notre responsable de protection des données à l'adresse e-mail : <strong>contact@samalocation.com</strong> ou adresser un recours direct auprès de la <strong>CDP</strong>.
                </p>
              </section>

              {/* Assistance */}
              <section className="pt-10 border-t flex flex-col items-center">
                <p className="text-muted-foreground text-sm mb-4">Une question sur vos données personnelles ?</p>
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
