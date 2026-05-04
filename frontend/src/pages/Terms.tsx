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
                description="Consultez les conditions d'utilisation de Samalocation. Apprenez-en plus sur nos règles de sécurité, de mise en relation et de gestion immobilière au Sénégal."
            />
            <Navbar />

            <div className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">Conditions d'Utilisation</h1>
                        <p className="text-muted-foreground italic">Dernière mise à jour : 04 Mai 2026</p>
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
                                    <li className="flex items-center gap-2"> Ne transférez pas d'argent (Wave, Orange Money) à distance sans garantie.</li>
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
                                Samalocation a été conçu avec une mission claire : moderniser et sécuriser l'accès au logement au Sénégal. Derrière ces règles juridiques nécessaires, notre priorité absolue reste votre satisfaction et la protection de vos intérêts. Nous mettons tout en œuvre pour que chaque utilisateur, qu'il soit locataire ou propriétaire, puisse interagir dans un environnement sain, transparent et respectueux.
                            </p>
                        </div>
                    </div>

                    <Card className="shadow-soft border-none bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-8 space-y-12">
                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                                    Acceptation des conditions
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    L'accès et l'utilisation de Samalocation sont soumis à l'acceptation pleine et entière des présentes Conditions d'Utilisation. En utilisant nos services, vous confirmez avoir pris connaissance de ces règles et vous engagez à les respecter. Samalocation se réserve le droit de modifier ces conditions à tout moment pour refléter les évolutions législatives ou techniques.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                                    Nature de la Plateforme
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation est un intermédiaire technologique facilitant la gestion immobilière au Sénégal. Nous ne sommes pas partie prenante aux contrats de bail conclus entre les utilisateurs. Samalocation n'est ni propriétaire, ni gestionnaire, ni courtier des biens publiés, sauf indication contraire. La plateforme permet la génération et la signature électronique de quittances de loyer, lesquelles ont une valeur probante entre les parties conformément à la législation sur le commerce électronique.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                                    Comptes et Sécurité
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Chaque utilisateur est responsable de la confidentialité de son mot de passe. Vous vous engagez à fournir des informations exactes et à ne pas utiliser de fausse identité. Toute activité suspecte sur votre compte doit nous être signalée immédiatement. Samalocation ne saurait être tenu responsable des piratages résultant d'une négligence de l'utilisateur.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                                    Propriété Intellectuelle
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    L'ensemble des éléments constituant la plateforme (logiciel, design, logos, base de données, textes) est la propriété exclusive de Samalocation. Toute reproduction, copie ou extraction de données sans autorisation préalable est strictement interdite et peut faire l'objet de poursuites judiciaires.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                                    Comportements Prohibés
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Il est strictement interdit de :
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Publier des annonces mensongères ou fictives.</li>
                                    <li>Utiliser la plateforme pour des activités illicites.</li>
                                    <li>Tenter de perturber le fonctionnement technique du service.</li>
                                    <li>Harceler ou porter atteinte à la dignité des autres utilisateurs.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                                    Conservation des Communications
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Les messages et historiques de transactions sont conservés de manière sécurisée afin de garantir la sécurité des utilisateurs et de servir de preuve en cas de litige. Samalocation s'engage à protéger l'intégrité de ces échanges conformément à sa politique de confidentialité.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">7</span>
                                    Suspension et Résiliation
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Samalocation se réserve le droit de suspendre ou de supprimer l'accès à tout utilisateur ne respectant pas les présentes conditions ou dont le comportement est jugé nuisible à la communauté, sans préavis ni indemnité.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">8</span>
                                    LIMITATION DE RESPONSABILITÉ
                                </h2>
                                <div className="bg-muted p-6 rounded-xl space-y-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Samalocation n'est pas responsable de la qualité des biens, de la solvabilité des locataires, ni des dommages survenant lors de l'exécution d'un bail. Le service est fourni "en l'état" sans garantie d'interruption.
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Nous ne saurions être tenus responsables des pertes de données liées à des changements d'architecture ou des évolutions techniques majeures nécessaires au bon fonctionnement du service.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <span className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-sm">9</span>
                                    Loi Applicable et Juridiction
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Les présentes conditions sont régies par le droit sénégalais. Tout litige relatif à leur exécution sera porté devant les tribunaux compétents de Dakar, Sénégal.
                                </p>
                            </section>

                            <section className="pt-10 border-t">
                                <h2 className="text-xl font-semibold mb-4">Assistance et Signalement</h2>
                                <div className="p-6 bg-secondary/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="text-muted-foreground text-sm space-y-1">
                                        <p className="font-bold text-primary">Besoin d'aide ou signaler un abus ?</p>
                                        <p>Email: contact@samalocation.com</p>
                                        <p>Ouakam, Dakar, Sénégal</p>
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
