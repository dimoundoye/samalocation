import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { baseClient } from "@/api/baseClient";
import Turnstile from "react-turnstile";

const Contact = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!turnstileToken) {
            toast({
                title: "Vérification requise",
                description: "Veuillez confirmer que vous n'êtes pas un robot.",
                variant: "destructive",
            });
            return;
        }
        setLoading(true);

        try {
            await baseClient("/contact", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    turnstileToken,
                }),
            });

            toast({
                title: "Message envoyé !",
                description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
            });
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTurnstileToken(null);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'envoyer le message. Veuillez réessayer plus tard.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12 animate-slide-up">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
                                Contactez-nous
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Vous avez une question, une suggestion ou besoin d'assistance ? Notre équipe est là pour vous aider.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Infos de contact */}
                            <div className="lg:col-span-1 space-y-6">
                                {[
                                    {
                                        icon: MapPin,
                                        title: "Notre Adresse",
                                        content: "Ouakam, Cité Batrain, Dakar, Sénégal",
                                        color: "bg-blue-500/10 text-blue-600",
                                    },
                                    {
                                        icon: Phone,
                                        title: "Téléphone",
                                        content: "+221 78 587 78 97",
                                        subContent: "Lun-Ven, 9h-18h",
                                        color: "bg-green-500/10 text-green-600",
                                    },
                                    {
                                        icon: Mail,
                                        title: "Email",
                                        content: "contact@samalocation.com",
                                        subContent: "Réponse sous 24h",
                                        color: "bg-purple-500/10 text-purple-600",
                                    },
                                    {
                                        icon: Clock,
                                        title: "Horaires",
                                        content: "Lundi - Vendredi : 9h00 - 18h00",
                                        subContent: "Samedi : 9h00 - 13h00",
                                        color: "bg-orange-500/10 text-orange-600",
                                    },
                                ].map((item, index) => (
                                    <Card key={index} className="border-none shadow-soft hover:shadow-medium transition-all duration-300 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${item.color}`}>
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                                                {item.subContent && (
                                                    <p className="text-xs text-muted-foreground/70 mt-0.5">{item.subContent}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Formulaire */}
                            <div className="lg:col-span-2">
                                <Card className="border-none shadow-strong bg-card/50 backdrop-blur-sm animate-scale-in" style={{ animationDelay: "0.4s" }}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-2xl flex items-center gap-2">
                                            <MessageSquare className="h-6 w-6 text-primary" />
                                            Envoyez-nous un message
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="name" className="text-sm font-medium">Nom complet</label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        placeholder="Votre nom"
                                                        required
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="text-sm font-medium">Email valide</label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="votre@email.com"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="subject" className="text-sm font-medium">Objet</label>
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    placeholder="Sujet de votre message"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="message" className="text-sm font-medium">Message</label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    placeholder="Comment pouvons-nous vous aider ?"
                                                    required
                                                    rows={6}
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50 resize-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-center">
                                                    <Turnstile
                                                        sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                                        onVerify={(token) => setTurnstileToken(token)}
                                                        onExpire={() => setTurnstileToken(null)}
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full gradient-primary text-white shadow-medium hover:shadow-strong transition-all py-6 text-lg group"
                                                >
                                                    {loading ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            Envoi en cours...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                            Envoyer le message
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 px-4 border-t bg-secondary/20">
                <div className="container mx-auto text-center text-muted-foreground">
                    <p>© 2025 Samalocation. Tous droits réservés.</p>
                    <div className="flex flex-wrap justify-center gap-6 mt-4">
                        <a href="/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</a>
                        <a href="/terms" className="hover:text-primary transition-colors">Conditions d'utilisation</a>
                        <a href="/contact" className="text-primary font-medium">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Contact;
