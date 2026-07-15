import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background pb-12">
            <SEO 
                title="Conditions d'Utilisation | Samalocation"
                description="Consultez les conditions d'utilisation de Samalocation. Apprenez-en plus sur nos règles de sécurité, de mise en relation et de gestion immobilière en ligne."
            />
            <Navbar />

            <div className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">Conditions d'Utilisation</h1>
                        <p className="text-muted-foreground italic">Dernière mise à jour : 14 juillet 2026</p>
                    </div>

                    {/* Alerte Vigilance */}
                    <div className="mb-10 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-500 text-white p-2 rounded-lg">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-xl font-bold text-red-600"> AVERTISSEMENT : VIGILANCE ET SÉCURITÉ</h2>
                                <p className="text-sm text-red-800 leading-relaxed font-medium">
                                    Samalocation est une plateforme de mise en relation. Nous vous appelons à la plus grande prudence :
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-red-700 font-semibold">
                                    <li className="flex items-center gap-2"> Ne payez JAMAIS avant d'avoir visité le bien.</li>
                                    <li className="flex items-center gap-2"> Exigez une visite physique en plein jour.</li>
                                    <li className="flex items-center gap-2"> Ne transférez pas d'argent à distance (mobile money, virement) sans garantie.</li>
                                    <li className="flex items-center gap-2"> Vérifiez physiquement l'identité de votre interlocuteur.</li>
                                </ul>
                                <p className="text-xs text-red-600/80 italic mt-2">
                                    Samalocation ne pourra en aucun cas être tenu responsable des pertes financières liées à des transactions frauduleuses effectuées en dehors de la plateforme.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section de réassurance */}
                    <div className="mb-10 bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-primary">Notre Engagement : Simplicité et Confiance</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Samalocation a été conçu avec une mission claire : moderniser et sécuriser l'accès au logement. Derrière ces règles juridiques nécessaires, notre priorité absolue reste votre satisfaction et la protection de vos intérêts. Nous mettons tout en œuvre pour que chaque utilisateur, qu'il soit locataire ou propriétaire, puisse interagir dans un environnement sain, transparent et respectueux.
                            </p>
                        </div>
                    </div>

                    <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-8 space-y-12 text-foreground">
                            {/* Introduction */}
                            <div className="border-b pb-6">
                                <p className="text-muted-foreground leading-relaxed">
                                    Les présentes conditions générales d’utilisation ci-après les (<strong>« CGU »</strong>) ou (<strong>« Contrat »</strong>) ont pour objet de définir les modalités d’utilisation des services de <strong>Samalocation</strong>, plateforme de gestion locative éditée par <strong>YAKIRIX</strong>, entreprise individuelle de droit sénégalais, immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM) sous le numéro <strong>SN.DKR.2026.A.14009</strong>, dont le siège social est à Dakar, République du Sénégal.
                                </p>
                                <p className="text-muted-foreground leading-relaxed mt-4">
                                    L’utilisateur des services de Samalocation, s’engage expressément à se conformer aux présentes Conditions Générales d’Utilisation desdits services, ainsi qu’à toutes leurs modifications ultérieures qui pourraient survenir au titre de l’utilisation des services.
                                </p>
                                <p className="text-muted-foreground leading-relaxed mt-4 font-semibold text-primary">
                                    En conséquence, nous vous recommandons de lire attentivement les termes du présent Contrat sur les services de Samalocation avant de les accepter. Il vous appartient de comprendre et de respecter toutes les lois, règles et réglementations qui peuvent vous être applicables en rapport avec votre utilisation de Samalocation. En accédant et en utilisant la plateforme de Samalocation, vous acceptez les termes et conditions du présent Contrat.
                                </p>
                            </div>

                            {/* Section 1 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                                    VOTRE RELATION AVEC SAMALOCATION
                                </h2>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.1 Définition de quelques termes clés</h3>
                                    <ul className="space-y-3 pl-4 text-muted-foreground text-sm list-none border-l-2 border-primary/20">
                                        <li><strong>CDP :</strong> Commission de Protection des Données Personnelles, Autorité Administrative Indépendante (AAI) instituée par la loi n° 2008-12 du 25 janvier 2008 et qui veille à l'application et au respect de la protection des données personnelles au Sénégal.</li>
                                        <li><strong>Vous :</strong> Désigne la personne (bailleur ou locataire) qui crée un compte et accepte les termes du présent Contrat.</li>
                                        <li><strong>Site web / Application :</strong> L'ensemble des pages web et de la plateforme technologique accessible sous le nom de domaine <em>samalocation.com</em>.</li>
                                        <li><strong>Transaction :</strong> Toute opération de mise en relation, de signature électronique de bail, d'émission de quittances, de signalement de maintenance ou de paiement de loyers effectuée via la plateforme.</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.2 Présentation de Samalocation</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        YAKIRIX est une entreprise individuelle spécialisée dans la création d'application web mobile et de services numériques. La plateforme Samalocation est un tiers facilitateur de gestion qui met en relation des propriétaires (bailleurs) et des locataires, et leur fournit une suite de solutions digitales pour gérer les contrats de bail, automatiser les quittances de loyer et assurer le suivi des paiements.
                                    </p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Chaque compte Samalocation doit obligatoirement être lié à un numéro de téléphone mobile (identifié auprès d'un opérateur) et une adresse e-mail valide. Samalocation offre les solutions principales suivantes :
                                    </p>
                                    <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                                        <li><strong>Espace Propriétaire :</strong> Publication d'annonces, suivi des baux, gestion des paiements et des incidents de maintenance.</li>
                                        <li><strong>Espace Locataire :</strong> Recherche de biens, signature de baux, réception des quittances, paiement des loyers et déclaration d'incidents.</li>
                                        <li><strong>Signature de Contrat :</strong> Établissement de contrats de bail électroniques conformes.</li>
                                        <li><strong>Quittance Express :</strong> Génération et envoi automatique de quittances après validation des paiements.</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.3 Respect de la vie privée</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        La confidentialité de vos données personnelles et de gestion est une priorité. Samalocation s'engage à respecter les dispositions de la <strong>Loi n° 2008-12 du 25 janvier 2008</strong> sur la protection des données au Sénégal. Veuillez consulter notre Politique de Confidentialité disponible sur notre site.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.4 Propriété intellectuelle</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Le nom "Samalocation", les logos, designs, icônes, codes sources et scripts de la plateforme constituent des créations protégées par le droit d'auteur et sont la propriété exclusive de l'entreprise YAKIRIX. 
                                    </p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Toute reproduction, imitation ou utilisation non autorisée constitue un acte de contrefaçon au sens de l'<strong>Accord de Bangui révisé (OAPI)</strong> et expose son auteur à des poursuites civiles et pénales.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.5 Cession de compte</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Vous ne pouvez céder votre compte Samalocation, vos droits ou vos obligations contractuelles à un tiers sans le consentement écrit et préalable de Samalocation.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.6 Notifications</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Vous acceptez que Samalocation puisse vous adresser des notifications (techniques, financières ou d'alerte) sur votre compte, par e-mail, ou par SMS/WhatsApp au numéro renseigné.
                                    </p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Les communications et SMS envoyés aux tiers par les utilisateurs des services de Samalocation relèvent de leur entière responsabilité. Les utilisateurs doivent se conformer à la loi sur la protection des données personnelles et disposer des autorisations requises par la <strong>CDP</strong>.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.7 Notifications destinées à Samalocation</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Toute notification officielle à destination de Samalocation doit être adressée par e-mail à : <strong>contact@samalocation.com</strong>.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.8 Historique des transactions</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Vous pouvez accéder à tout moment à l'historique complet de vos baux, quittances générées, signalements de pannes et versements de loyer enregistrés en vous connectant à votre espace client.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.9 Modifications du Contrat</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Samalocation se réserve le droit de modifier unilatéralement le présent Contrat à tout moment pour refléter les évolutions légales ou techniques. Vous serez averti de l'entrée en vigueur de toute modification majeure. Si vous refusez les modifications, vous devez fermer votre compte. L'utilisation continue des services après ce délai vaut acceptation tacite.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.10 Activités interdites</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        La plateforme ne doit pas être utilisée pour :
                                    </p>
                                    <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                                        <li>Publier des annonces de biens fictives, non conformes ou ne vous appartenant pas sans mandat légal.</li>
                                        <li>Publier des informations personnelles de tiers en violation des lois sur la vie privée.</li>
                                        <li>Tenter de frauder les locataires ou bailleurs, ou réaliser des escroqueries financières.</li>
                                    </ul>
                                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                                        Samalocation se réserve le droit de suspendre ou bloquer immédiatement tout compte ou transaction suspectée de fraude immobilière ou financière pour une durée de vérification ne pouvant excéder 120 jours.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">1.11 Limitation de la responsabilité de Samalocation</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Samalocation fournit des outils technologiques de gestion locative et de mise en relation. <strong>Samalocation n'est pas responsable de la non-jouissance du bien, des loyers impayés, des dégradations du logement ou du non-respect des clauses du bail par l'une des parties.</strong> 
                                    </p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Les propriétaires et les locataires demeurent les seuls responsables de l'exécution physique du bail et de leurs obligations respectives.
                                    </p>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                                    ACCESSIBILITÉ ET TYPES DE COMPTES
                                </h2>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">2.1 Éligibilité</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Pour vous inscrire sur Samalocation, vous devez ne pas être sur la liste noire de la plateforme, disposer de la capacité juridique de contracter un bail ou de mettre un bien en location, et fournir des informations d'identité et de contact exactes lors du processus d’inscription.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">2.2 Types de comptes</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Nous proposons deux types de comptes adaptés :
                                    </p>
                                    <ul className="list-disc list-inside pl-4 text-muted-foreground text-sm space-y-1">
                                        <li><strong>Compte Propriétaire (Bailleur) :</strong> Pour enregistrer ses biens, générer des baux et des quittances de loyer.</li>
                                        <li><strong>Compte Locataire :</strong> Pour louer des logements, signer ses contrats de bail, recevoir ses quittances et déclarer des incidents.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                                    PAIEMENTS ET GESTION DES LOYERS
                                </h2>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">3.1 Moyens de paiement</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Les règlements de loyer s'effectuent via les moyens de paiement intégrés sur la plateforme (notamment Mobile Money : Wave, Orange Money, Free Money) ou par déclaration de virement/cash validée par les parties.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">3.2 Validation des paiements</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Dès qu'un paiement de loyer est effectué avec succès et validé par le bailleur, la quittance de loyer correspondante est générée et mise à disposition dans l'espace du locataire avec notification instantanée.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-foreground">3.3 Devises acceptées</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        La monnaie officielle de référence sur la plateforme est le <strong>XOF (Franc CFA)</strong>, monnaie légale de l'Union Économique et Monétaire Ouest Africaine (UEMOA).
                                    </p>
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                                    DURÉE DU CONTRAT ET RÉSILIATION
                                </h2>
                                
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Le présent Contrat prend effet dès la création de votre compte et reste en vigueur jusqu'à sa fermeture. Vous pouvez à tout moment demander la résiliation de votre compte en contactant notre service client.
                                    </p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Samalocation se réserve le droit de restreindre, suspendre ou supprimer votre compte sans préavis en cas de violation avérée des présentes CGU.
                                    </p>
                                </div>
                            </section>

                            {/* Section 5 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                                    COMMISSIONS ET TARIFS
                                </h2>
                                
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        La création de compte, la recherche de biens et la publication d'annonces de base sont gratuites. Les frais liés aux services complémentaires (comme la signature électronique de baux, les abonnements premium ou professionnel) sont spécifiés dans nos grilles tarifaires.
                                    </p>
                                    
                                    <div className="space-y-3 pl-4 border-l-2 border-primary/20 text-muted-foreground text-sm">
                                        <p>
                                            <strong>5.1 Frais de paiement en ligne (Locataires) :</strong> Les règlements de loyer effectués en ligne via la plateforme (par Wave, Orange Money, Free Money ou Carte Bancaire) sont soumis à des frais de service de <strong>2,5%</strong>. Ces frais sont à la charge exclusive du locataire et s'ajoutent au montant du loyer principal lors de la transaction.
                                        </p>
                                        <p>
                                            <strong>5.2 Frais de retrait de fonds (Propriétaires) :</strong> Les virements de fonds du portefeuille virtuel d'un propriétaire vers son compte Mobile Money (Wave ou Orange Money) sont soumis à des frais de service de <strong>2,5%</strong>. Ces frais sont directement déduits du montant brut demandé lors du transfert.
                                        </p>
                                        <p>
                                            <strong>5.3 Restitution des fonds pour comptes bloqués ou suspendus :</strong> En cas de suspension ou de blocage d'un compte propriétaire par l'administration suite à une infraction aux présentes CGU ou pour vérification de sécurité :
                                            <br />
                                            Les fonds accumulés sur le portefeuille virtuel du propriétaire restent sa propriété légale. Pour récupérer son solde, le propriétaire concerné doit contacter l'assistance de Samalocation par e-mail à l'adresse <strong>contact@samalocation.com</strong> ou par whatsapp au numéro <strong>+221 76 162 95 29</strong>.
                                            <br />
                                            Après validation des pièces d'identité et levée des doutes réglementaires, l'administration procédera à un virement du solde restant (sous déduction des frais de service de 2,5%) vers le compte Mobile Money enregistré et vérifié du propriétaire.
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-relaxed font-semibold">
                                        Pour toutes les opérations financières réalisées au Sénégal, les taxes locales applicables et commissions d'opérateurs de mobile money ou frais bancaires sont directement prélevés ou affichés lors de la transaction.
                                    </p>
                                </div>
                            </section>

                            {/* Section 6 */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-primary border-b pb-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                                    Loi Applicable et Juridiction
                                </h2>
                                
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Les présentes conditions générales sont régies par le droit sénégalais. Tout litige relatif à leur exécution, leur interprétation ou leur validité sera porté devant les tribunaux compétents de Dakar, Sénégal.
                                    </p>
                                </div>
                            </section>

                            {/* Assistance */}
                            <section className="pt-10 border-t">
                                <h2 className="text-xl font-semibold mb-4">Assistance et Signalement</h2>
                                <div className="p-6 bg-secondary/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="text-muted-foreground text-sm space-y-1">
                                        <p className="font-bold text-primary">Besoin d'aide ou signaler un abus ?</p>
                                        <p>Email: contact@samalocation.com</p>
                                        <p>Samalocation — Solution de gestion locative digitale.</p>
                                    </div>
                                    <Button variant="outline" onClick={() => window.location.href = '/contact'}>
                                        Nous contacter
                                    </Button>
                                </div>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Terms;
