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
import { useTranslation } from "react-i18next";

const Contact = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
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
        const isDev = import.meta.env.DEV;
        if (!turnstileToken && !isDev) {
            toast({
                title: t('contact.form.robot_error'),
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
                title: t('contact.form.success_title'),
                description: t('contact.form.success_desc'),
            });
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTurnstileToken(null);
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.message || t('common.error'),
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
                                {t('contact.title')}
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                {t('contact.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Infos de contact */}
                            <div className="lg:col-span-1 space-y-6">
                                {[
                                    {
                                        icon: MapPin,
                                        title: t('contact.info.address_title'),
                                        content: t('contact.info.address_text'),
                                        color: "bg-blue-500/10 text-blue-600",
                                    },
                                    {
                                        icon: Phone,
                                        title: t('contact.info.phone_title'),
                                        content: "+221 76 162 95 29",
                                        subContent: t('contact.info.phone_sub'),
                                        color: "bg-green-500/10 text-green-600",
                                    },
                                    {
                                        icon: Mail,
                                        title: t('contact.info.email_title'),
                                        content: "contact@samalocation.com",
                                        subContent: t('contact.info.email_sub'),
                                        color: "bg-purple-500/10 text-purple-600",
                                    },
                                    {
                                        icon: Clock,
                                        title: t('contact.info.hours_title'),
                                        content: t('contact.info.hours_sub1'),
                                        subContent: t('contact.info.hours_sub2'),
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
                                            {t('contact.form.title')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="name" className="text-sm font-medium">{t('contact.form.name')}</label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        placeholder={t('contact.form.name_placeholder')}
                                                        required
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="text-sm font-medium">{t('contact.form.email')}</label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder={t('contact.form.email_placeholder')}
                                                        required
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="subject" className="text-sm font-medium">{t('contact.form.subject')}</label>
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    placeholder={t('contact.form.subject_placeholder')}
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="message" className="text-sm font-medium">{t('contact.form.message')}</label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    placeholder={t('contact.form.message_placeholder')}
                                                    required
                                                    rows={6}
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    className="bg-background/50 focus:bg-white transition-all border-muted hover:border-primary/50 resize-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                {!import.meta.env.DEV && (
                                                    <div className="flex justify-center">
                                                        <Turnstile
                                                            sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                                            onVerify={(token) => setTurnstileToken(token)}
                                                            onExpire={() => setTurnstileToken(null)}
                                                        />
                                                    </div>
                                                )}


                                                <Button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full gradient-primary text-white shadow-medium hover:shadow-strong transition-all py-6 text-lg group"
                                                >
                                                    {loading ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            {t('contact.form.sending')}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                            {t('contact.form.submit')}
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
                    <p>{t('footer.copyright')}</p>
                    <div className="flex flex-wrap justify-center gap-6 mt-4">
                        <a href="/privacy" className="hover:text-primary transition-colors">{t('footer.legal.privacy')}</a>
                        <a href="/terms" className="hover:text-primary transition-colors">{t('footer.legal.terms')}</a>
                        <a href="/contact" className="text-primary font-medium">{t('nav.contact')}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Contact;
