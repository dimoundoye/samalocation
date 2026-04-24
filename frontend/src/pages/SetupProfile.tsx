import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle2, Loader2, Key, Phone, Mail, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { completeSetup } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const SetupProfile = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || "",
                // L'email est toujours laissé vide : le locataire doit saisir son propre email
                email: "",
            }));
        }
    }, [user]);

    const [setupDone, setSetupDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        try {
            await completeSetup({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                newPassword: formData.password,
            });

            // Afficher l'état "vérification en attente"
            setSetupDone(true);
            toast.success("Un e-mail de confirmation vous a été envoyé !");
        } catch (error: any) {
            toast.error("La configuration du profil a échoué. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <img src="/logo-sl.png" alt="Samalocation" className="h-12 w-auto object-contain" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic hidden md:inline">
                            Samalocation
                        </span>
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">

                    {/* Écran de confirmation post-setup */}
                    {setupDone ? (
                        <CardContent className="py-12 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <Mail className="h-10 w-10 text-green-600" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-xl font-bold">Vérifiez votre boîte mail</h2>
                                <p className="text-muted-foreground text-sm">
                                    Un e-mail de confirmation a été envoyé à{" "}
                                    <span className="font-semibold text-foreground">{formData.email}</span>.
                                    <br />
                                    Cliquez sur le lien dans l'e-mail pour activer votre compte.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Une fois votre e-mail confirmé, reconnectez-vous avec votre nouveau mot de passe.
                                </p>
                            </div>
                            <Button
                                className="w-full mt-4"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Se déconnecter
                            </Button>
                        </CardContent>
                    ) : (
                    <>
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Bienvenue !</CardTitle>
                        <CardDescription>
                            Terminez la configuration de votre compte pour accéder à votre espace locataire.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                    Nom et Prénom
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Votre nom complet"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Numéro de téléphone
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+221 XX XXX XX XX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pass" className="flex items-center gap-2">
                                    <Key className="h-4 w-4 text-muted-foreground" />
                                    Nouveau mot de passe
                                </Label>
                                <Input
                                    id="pass"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    8 caractères minimum
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm" className="flex items-center gap-2">
                                    <Key className="h-4 w-4 text-muted-foreground" />
                                    Confirmer le mot de passe
                                </Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full gradient-primary text-white h-11" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Configuration en cours...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Finaliser mon compte
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t text-center">
                            <Button variant="ghost" className="text-muted-foreground text-xs" onClick={() => signOut()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Se déconnecter et terminer plus tard
                            </Button>
                        </div>
                    </CardContent>
                    </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SetupProfile;
