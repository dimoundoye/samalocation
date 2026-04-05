import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyEmailAccount } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Lien de vérification invalide.");
            return;
        }

        const handleVerification = async () => {
            try {
                await verifyEmailAccount(token);
                setStatus("success");
                setMessage("Votre adresse e-mail a été vérifiée avec succès. Vous pouvez maintenant vous connecter à votre compte.");
                toast.success("E-mail vérifié avec succès !");
            } catch (error: any) {
                console.error("Verification error:", error);
                setStatus("error");
                setMessage(error.message || "Le lien de vérification est invalide ou a expiré.");
                toast.error("Échec de la vérification.");
            }
        };

        handleVerification();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-strong animate-scale-in">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <img src="/logo-sl.png" alt="Samalocation" className="h-20 w-auto mx-auto object-contain" />
                    </div>
                    <CardTitle className="text-2xl">Vérification de compte</CardTitle>
                    <CardDescription>
                        Activation de votre accès à la plateforme.
                    </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    {status === "loading" && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground italic">Vérification en cours...</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="text-foreground font-medium">{message}</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <p className="text-foreground font-medium">{message}</p>
                            <p className="text-sm text-muted-foreground">
                                Si le problème persiste, veuillez demander un nouveau lien ou contacter le support.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    {status === "success" ? (
                        <Button className="w-full gradient-primary text-white" onClick={() => navigate("/auth?mode=login")}>
                            Se connecter
                        </Button>
                    ) : status === "error" ? (
                        <Button className="w-full" variant="outline" onClick={() => navigate("/contact")}>
                            Contacter le support
                        </Button>
                    ) : null}
                    
                    <div className="text-center w-full">
                        <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
                             Retour à l'accueil
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default VerifyEmail;
