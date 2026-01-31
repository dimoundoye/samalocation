import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8 text-center">Conditions d'Utilisation</h1>

                    <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 space-y-8">
                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">1. Acceptation des conditions</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    En accédant et en utilisant la plateforme Samalocation, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">2. Description du service</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation est une plateforme de mise en relation et de gestion locative au Sénégal. Elle permet aux propriétaires de publier des annonces, de gérer leurs biens et locataires, et de générer des reçus de loyer. Elle permet aux locataires de rechercher des biens et de gérer leurs documents locatifs.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">3. Comptes Utilisateurs</h2>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable :
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>De la confidentialité de vos identifiants</li>
                                    <li>De toutes les activités effectuées via votre compte</li>
                                    <li>De fournir des informations exactes et à jour</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">4. Obligations des Propriétaires</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Garantir l'exactitude des informations sur les biens publiés</li>
                                    <li>Fournir des reçus de loyer conformes aux paiements reçus</li>
                                    <li>Agir en conformité avec les lois locales sur le logement au Sénégal</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">5. Obligations des Locataires</h2>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Fournir des informations authentiques lors des candidatures</li>
                                    <li>Respecter les conditions du contrat de bail conclu avec le propriétaire</li>
                                    <li>Utiliser la plateforme de manière responsable</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">6. Signalements et Modération</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation dispose d'un système de signalement. L'administration se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les règles de la plateforme ou les lois en vigueur (contenu abusif, fraude, etc.).
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">7. Conservation des Communications</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Afin d'optimiser les performances de la plateforme et de garantir la protection des données, les messages échangés entre utilisateurs sont automatiquement supprimés de nos serveurs après une période de 5 mois. Il est recommandé aux utilisateurs de sauvegarder toute information importante contenue dans leurs conversations.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">8. Limitation de Responsabilité</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation agit en tant qu'intermédiaire technique. Nous ne sommes pas partie prenante aux contrats de bail conclus entre les utilisateurs et ne pouvons être tenus responsables des litiges contractuels ou des comportements des utilisateurs.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">8. Modifications</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur la plateforme.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">9. Profils Vérifiés</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation propose un badge "Vérifié" pour les propriétaires ayant soumis une pièce d'identité valide. Ce badge est un indicateur de confiance basé sur une revue manuelle des documents fournis. Bien que nous fassions nos meilleurs efforts pour valider l'identité, ce badge ne constitue pas une garantie absolue et ne décharge pas les locataires de leur obligation de vigilance lors de la conclusion d'un bail.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 text-primary">10. Contact</h2>
                                <p className="text-muted-foreground">
                                    Pour toute question relative à ces conditions, contactez-nous :
                                </p>
                                <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-muted-foreground">
                                    <p>Email: contact@samalocation.com</p>
                                    <p>Dakar, Sénégal</p>
                                </div>
                            </section>

                            <section className="pt-6 border-t text-center">
                                <p className="text-sm text-muted-foreground italic">
                                    Dernière mise à jour : 31 Janvier 2026
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Terms;
