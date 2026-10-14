import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const SectionTitle = ({ number, children }: { number: number; children: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0">{number}</span>
    {children}
  </h2>
);

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background pb-12">
      <SEO
        title="Politique de Confidentialité | Samalocation"
        description="Découvrez comment Samalocation collecte, utilise, partage et protège vos données personnelles, et quels sont vos droits."
      />
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
            <p className="text-muted-foreground italic">Dernière mise à jour : 13 octobre 2026</p>
            {/* Après une modification importante, changer aussi la version dans backend/src/config/legal.js : les utilisateurs seront prévenus dans leur cloche. */}
          </div>

          <div className="mb-10 bg-secondary/30 rounded-2xl p-6 md:p-8 text-center sm:text-left border border-secondary">
            <h2 className="text-2xl font-bold text-foreground mb-3">Votre vie privée est notre priorité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous comprenons que la gestion de vos données personnelles est une question de confiance. Samalocation ne collecte que ce qui est utile à la gestion locative, ne vend aucune donnée et n'utilise aucun traceur publicitaire. Cette page explique, simplement, ce que nous collectons, pourquoi, qui peut le voir et comment exercer vos droits.
            </p>
          </div>

          <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-12 text-foreground">
              {/* Introduction */}
              <div className="border-b pb-6">
                <p className="text-muted-foreground leading-relaxed">
                  En acceptant ce Règlement sur le respect de la vie privée au moment de l’inscription, vous acceptez que vos informations personnelles soient traitées conformément à la <strong>loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> portant sur la protection des données à caractère personnel, au <strong>Décret n° 2008-721 du 30 juin 2008</strong> portant application de cette loi, aux stipulations du présent règlement, et aux autres lois et règlements dont le respect serait requis par les autorités.
                </p>
              </div>

              {/* Définitions */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Définition de quelques termes clés</h3>
                <ul className="space-y-3 pl-4 text-muted-foreground text-sm list-none border-l-2 border-primary/20">
                  <li><strong>Consentement :</strong> Toute manifestation de volonté expresse, non équivoque, libre, spécifique et informée par laquelle la personne concernée ou son représentant légal, judiciaire ou conventionnel, accepte que ses données à caractère personnel fassent l’objet d’un traitement manuel ou électronique.</li>
                  <li><strong>Données à caractère personnel :</strong> Toute information relative à une personne physique identifiée ou identifiable directement ou indirectement, par référence à un numéro d’identification ou à un ou plusieurs éléments, propres à son identité physique, physiologique, génétique, psychique, culturelle, sociale ou économique.</li>
                  <li><strong>Vous :</strong> Désigne l’utilisateur (propriétaire, agence, collaborateur ou locataire) qui accepte les termes et conditions du présent Règlement.</li>
                  <li><strong>Collaborateur :</strong> Personne invitée par un propriétaire ou une agence à travailler dans son espace (gestionnaire, agent), avec des droits choisis par ce propriétaire.</li>
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
                  Samalocation est édité par <strong>YAKIRIX</strong>, entreprise individuelle de droit sénégalais, qui est responsable du traitement des données collectées pour faire fonctionner la plateforme. Pour réduire les risques de fraude immobilière, de blanchiment d’argent et toutes autres malversations, Samalocation vous demande de fournir des informations vous concernant, relatives à vos biens ou à vos justificatifs d'identité.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Lorsqu'un propriétaire ou une agence enregistre lui-même les informations d'un locataire (création d'un compte locataire, saisie d'un bail ou d'un reçu), il agit en tant que <strong>responsable de ses propres fichiers de gestion locative</strong> et doit respecter les obligations décrites à la section 4.2 et dans nos Conditions d'Utilisation.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Chaque Compte Samalocation doit obligatoirement être lié à un numéro de téléphone mobile et une adresse e-mail valide.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-6">
                <SectionTitle number={2}>Informations collectées</SectionTitle>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.1 Informations obligatoires</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour ouvrir un Compte Samalocation, vous devez nous communiquer les informations basiques suivantes :
                  </p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                    <li><strong>Bailleur (Propriétaire ou agence) :</strong> Nom, prénoms, nom de l'agence (optionnel), adresse e-mail, numéro de téléphone, mot de passe de connexion.</li>
                    <li><strong>Locataire :</strong> Nom, prénoms, adresse e-mail, numéro de téléphone, mot de passe de connexion.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.2 Informations facultatives ou complémentaires (KYC)</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Afin d'obtenir le statut "Profil Vérifié" et de sécuriser vos transactions, des informations additionnelles sont requises :
                  </p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                    <li><strong>Bailleur :</strong> pièces justificatives d'identité (CNI, passeport), preuve de propriété (facture d'électricité, eau) et vérification de présence (un selfie de vous tenant un document d'identité). Ces pièces servent uniquement à la vérification et ne sont jamais affichées aux locataires.</li>
                    <li><strong>Locataire :</strong> les documents que vous ajoutez volontairement à votre dossier de location (pièce d'identité, justificatifs de revenus, etc.).</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.3 Données de gestion locative</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    L'utilisation du service produit des données : biens et unités (adresse, description, photos, loyer), baux et contrats, reçus et quittances, paiements et retraits, demandes de maintenance, messages échangés entre utilisateurs, notifications et journal des actions effectuées par les membres d'une équipe.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.4 Informations sur la transaction</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Lorsqu'un loyer est déclaré ou payé en ligne sur Samalocation, nous enregistrons les détails de la transaction : montant, période, dates de bail, mode de paiement et historique des quittances générées. Ces informations sont archivées de manière sécurisée afin de servir de preuve comptable et légale en cas de litige. Les données de carte bancaire et de mobile money sont saisies directement chez notre prestataire de paiement : Samalocation ne les voit pas et ne les conserve pas.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.5 Preuves de signature électronique</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Lorsque vous signez un contrat, nous enregistrons votre signature, la date et l'heure, l'adresse IP et le type de navigateur utilisés, ainsi qu'une empreinte numérique du document. Ces éléments prouvent qui a signé, quand, et que le document n'a pas été modifié depuis. Une fois un document émis, la signature qui y figure est figée.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.6 Données techniques</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour mesurer la fréquentation, nous comptons les pages consultées dans l'application, de façon anonyme et sans enregistrer votre adresse IP. Voir la section 5.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.7 Vérification auprès de tiers</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Afin de protéger notre communauté contre les faux propriétaires ou les profils frauduleux, nous pouvons effectuer des audits de cohérence sur les pièces de propriété ou d'identité soumises, en accord avec les lois en vigueur.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">2.8 Signalements d'annonces</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Tout visiteur peut signaler une annonce, même sans compte. Nous enregistrons le motif, les précisions saisies et, si vous les laissez, votre adresse e-mail ou votre numéro de téléphone, utilisés uniquement pour vous recontacter au sujet de ce signalement. Le propriétaire de l'annonce ne sait jamais qui l'a signalée.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-4">
                <SectionTitle number={3}>Pourquoi nous utilisons vos données</SectionTitle>
                <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-2">
                  <li><strong>Fournir le service :</strong> création du compte, gestion des biens, baux, reçus, paiements, messages et maintenance (exécution du contrat qui nous lie).</li>
                  <li><strong>Prouver les opérations :</strong> conservation des contrats signés, reçus et transactions (obligations légales et preuve en cas de litige).</li>
                  <li><strong>Sécuriser la plateforme :</strong> vérification des profils, prévention de la fraude, détection des abus et protection des comptes.</li>
                  <li><strong>Vous informer :</strong> e-mails liés à votre compte et, si vous les avez activées, notifications sur votre appareil. Vous pouvez désactiver ces notifications à tout moment.</li>
                  <li><strong>Améliorer le service :</strong> statistiques de fréquentation anonymes (section 5).</li>
                </ul>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Vos données ne sont jamais vendues ni louées, et ne sont pas utilisées à des fins publicitaires.
                </p>
              </section>

              {/* Section 4 */}
              <section className="space-y-6">
                <SectionTitle number={4}>Qui peut voir vos données</SectionTitle>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">4.1 Entre bailleurs et locataires</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>Si vous êtes locataire</strong>, votre nom, votre numéro de téléphone et votre adresse e-mail sont communiqués au propriétaire (ou à l'agence qui gère le bien) dès que vous êtes rattaché à l'un de ses biens, que vous signez un bail, que vous lui partagez votre dossier ou que vous lui écrivez. Les documents de votre dossier ne sont visibles que par les propriétaires avec qui vous choisissez de le partager, et vous pouvez retirer ce partage à tout moment.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>Si vous êtes propriétaire ou agence</strong>, votre nom (ou celui de votre agence), votre numéro de téléphone et votre adresse e-mail sont communiqués à vos locataires.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>Sur les reçus, quittances et contrats</strong> figurent : le nom, l'adresse e-mail et le numéro de téléphone du propriétaire (ou de l'agence) et du locataire, ainsi que les informations du bien (nom, adresse, unité), le montant, la période et le mode de paiement. Les contrats comportent en plus les signatures. Ces documents peuvent être téléchargés, imprimés et transmis par chacune des parties : une fois téléchargés, leur diffusion ne dépend plus de Samalocation.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Chacun s'engage à n'utiliser ces informations que pour la gestion du bail. Les règles applicables aux propriétaires et agences sont détaillées dans nos Conditions d'Utilisation.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">4.2 Équipes des propriétaires et agences</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Un propriétaire peut inviter des collaborateurs à travailler dans son espace. Ceux-ci accèdent alors aux informations de ses biens et de ses locataires, dans la limite des droits que le propriétaire leur accorde (par exemple, sans accès aux finances). Le propriétaire reste responsable de l'usage qu'ils en font et peut retirer leur accès à tout moment. Un collaborateur ne voit jamais les espaces d'autres propriétaires auxquels il n'a pas été invité.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">4.3 Prestataires techniques</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour faire fonctionner la plateforme, nous faisons appel à des prestataires qui traitent certaines données pour notre compte, uniquement pour la mission qui leur est confiée :
                  </p>
                  <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                    <li><strong>Hébergement :</strong> serveurs et base de données de la plateforme.</li>
                    <li><strong>Stockage des fichiers :</strong> photos, logos, signatures et documents (Cloudinary).</li>
                    <li><strong>Envoi d'e-mails :</strong> e-mails de vérification, d'invitation et de notification.</li>
                    <li><strong>Paiement en ligne :</strong> traitement des paiements de loyer et d'abonnement (PayDunya et les opérateurs de mobile money).</li>
                    <li><strong>Intelligence artificielle :</strong> lorsque vous utilisez les fonctions d'aide à la rédaction d'annonce, la recherche en langage naturel ou l'assistant de discussion, le texte saisi est transmis à un service d'IA (Google Gemini) pour produire la réponse. Évitez d'y saisir des informations personnelles.</li>
                    <li><strong>Notifications sur l'appareil :</strong> acheminées par le service de notification de votre navigateur ou de votre téléphone.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">4.4 Vérification publique des documents</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Les contrats comportent un code de vérification permettant à un tiers (banque, administration, autre bailleur) de confirmer leur authenticité. Cette vérification affiche l'adresse du bien, le nom du propriétaire, le prénom du locataire avec son nom de famille masqué, et les dates de signature.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">4.5 Autorités</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Vos données peuvent être transmises aux autorités judiciaires, forces de l'ordre, ou organismes de régulation compétents (comme la <strong>CDP</strong> ou la <strong>CENTIF</strong>) dans le cadre d'enquêtes sur des fraudes ou activités potentiellement illégales, conformément aux lois sénégalaises en vigueur.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-6">
                <SectionTitle number={5}>Mesure d'audience, traceurs et stockage local</SectionTitle>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">5.1 Statistiques de fréquentation (Umami)</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour savoir quelles pages sont utiles et améliorer le service, nous utilisons <strong>Umami</strong>, un outil de mesure d'audience respectueux de la vie privée, <strong>hébergé sur nos propres serveurs</strong>. Umami ne dépose aucun cookie, ne vous suit pas d'un site à l'autre et ne sert pas à vous identifier : il produit des statistiques globales (pages vues, page de provenance, type d'appareil et de navigateur, pays). Ces données ne sont partagées avec aucun tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">5.2 Statistiques internes de fréquentation</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour suivre la fréquentation depuis notre outil d'administration, l'application nous transmet, à chaque page consultée : la page (sans son contenu), la date, le type d'appareil, le navigateur et le système, le site d'où vous venez, et si vous êtes connecté en tant que propriétaire ou locataire. Pour compter les visiteurs sans les identifier, un <strong>identifiant aléatoire anonyme</strong> est conservé dans votre navigateur : il n'est lié ni à votre compte, ni à votre nom, ni à votre adresse IP, que nous <strong>n'enregistrons pas</strong>.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ces données sont supprimées automatiquement après <strong>1 an</strong>. Si votre navigateur indique que vous refusez le suivi (option « Do Not Track » ou « Global Privacy Control »), aucune donnée de ce type n'est envoyée.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">5.3 Stockage local et cookies</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    L'application conserve dans votre navigateur les éléments nécessaires à son fonctionnement : votre session de connexion, votre langue, vos préférences d'affichage, l'identifiant anonyme de mesure d'audience (section 5.2) et, pour les collaborateurs, l'espace de travail choisi. Aucun cookie publicitaire ni traceur de réseau social n'est utilisé. Vous pouvez effacer ces données depuis votre navigateur, mais vous serez alors déconnecté.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-4">
                <SectionTitle number={6}>Durée de conservation</SectionTitle>
                <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-2">
                  <li><strong>Compte et données de gestion :</strong> tant que votre compte est actif.</li>
                  <li><strong>Contrats, reçus et transactions :</strong> ils constituent aussi les pièces justificatives de l'autre partie au bail. Après la fermeture de votre compte, ceux qui ont été émis peuvent donc rester accessibles à cette autre partie, et être conservés par Samalocation le temps nécessaire à la preuve et aux obligations légales.</li>
                  <li><strong>Statistiques de fréquentation :</strong> 1 an.</li>
                  <li><strong>Invitations d'équipe :</strong> le lien n'est valable que 7 jours.</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section className="space-y-4">
                <SectionTitle number={7}>Sécurité de vos informations</SectionTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Conformément aux exigences de la loi n° 2008-12, Samalocation applique des mesures de sécurité strictes : mots de passe hachés (Bcrypt), connexions chiffrées (HTTPS), liens envoyés par e-mail à durée limitée, dont seule une empreinte est conservée, droits d'accès limités selon le rôle de chacun, et restriction des accès aux bases de données.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed font-semibold">
                  La sécurité de votre compte dépend aussi de la protection de votre mot de passe. Ne le partagez jamais. Les équipes de Samalocation ne vous demanderont jamais votre mot de passe par e-mail ou par téléphone.
                </p>
              </section>

              {/* Section 8 */}
              <section className="space-y-4">
                <SectionTitle number={8}>Vos droits</SectionTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Conformément à la loi n° 2008-12, vous disposez d'un droit d'information, d'accès, de rectification, d'opposition et de suppression de vos données.
                </p>
                <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                  <li>Vous pouvez consulter et corriger vos informations de profil directement depuis votre espace.</li>
                  <li>Pour obtenir une copie de vos données, vous opposer à un traitement ou fermer votre compte, écrivez à <strong>contact@samalocation.com</strong> depuis l'adresse liée à votre compte.</li>
                  <li>Si vous êtes locataire et que vos informations ont été saisies par un propriétaire, vous pouvez aussi vous adresser à lui pour les faire corriger.</li>
                </ul>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la <strong>Commission de Protection des Données Personnelles (CDP)</strong>.
                </p>
              </section>

              {/* Section 9 */}
              <section className="space-y-4">
                <SectionTitle number={9}>Transferts hors du Sénégal</SectionTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Certains de nos prestataires techniques (hébergement des fichiers, envoi d'e-mails, intelligence artificielle, notifications) peuvent traiter des données hors du Sénégal. Nous choisissons des prestataires qui offrent des garanties de sécurité et de confidentialité, et ne leur transmettons que ce qui est nécessaire à leur mission, conformément à la loi n° 2008-12.
                </p>
              </section>

              {/* Section 10 */}
              <section className="space-y-4">
                <SectionTitle number={10}>Proportionnalité et finalité du traitement</SectionTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Les données traitées par Samalocation sont adéquates, pertinentes et strictement limitées à ce qui est nécessaire pour l'édition et le suivi des baux, l'édition automatique des quittances, et la mise en relation sécurisée entre propriétaires et locataires au Sénégal. Le service est réservé aux personnes ayant la capacité juridique de contracter.
                </p>
              </section>

              {/* Section 11 */}
              <section className="space-y-4">
                <SectionTitle number={11}>Responsabilité de YAKIRIX</SectionTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <strong>YAKIRIX</strong> garantit que les opérations de traitement de données effectuées sur Samalocation respectent la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur les données personnelles ainsi que son décret d'application. Pour toute question ou réclamation sur le traitement de vos données, vous pouvez saisir notre responsable de protection des données à l'adresse e-mail : <strong>contact@samalocation.com</strong> ou adresser un recours direct auprès de la <strong>CDP</strong>.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nous pouvons modifier cette politique pour refléter l'évolution du service ou de la loi. En cas de changement important, vous en serez informé sur la plateforme ou par e-mail.
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
