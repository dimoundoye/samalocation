import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Loader2, Key, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "@/api/auth";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    console.log("ResetPassword component rendered. Token:", token);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Lien invalide ou expiré.");
            navigate("/auth");
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        try {
            setLoading(true);
            await resetPassword({ token, password });
            setSuccess(true);
            toast.success("Votre mot de passe a été réinitialisé.");
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-strong text-center py-8">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Succès !</CardTitle>
                        <CardDescription>
                            Votre mot de passe a été mis à jour avec succès.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button
                            onClick={() => navigate("/auth?mode=login")}
                            className="gradient-primary text-white"
                        >
                            Se connecter maintenant
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
            <div className="absolute top-4 text-xs text-muted-foreground opacity-20">Diagnostic: ResetPassword Loaded</div>
            <Card className="w-full max-w-md shadow-strong animate-scale-in">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
                        <Key className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Réinitialisation</CardTitle>
                    <CardDescription>
                        Choisissez un nouveau mot de passe sécurisé.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mise à jour...
                                </>
                            ) : (
                                "Réinitialiser le mot de passe"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
