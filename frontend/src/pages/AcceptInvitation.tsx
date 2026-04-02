import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInvitationDetails, acceptInvitation } from "@/api/owner";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const handleSignupRedirect = () => {
        // Sauvegarder l'URL actuelle pour y revenir après signup
        localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
        
        const params = new URLSearchParams({
            mode: "signup",
            type: "owner", // Agents are registered as owner-type users
            email: invitation?.invitee_email || ""
        });
        
        navigate(`/auth?${params.toString()}`);
    };

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        const fetchDetails = async () => {
            try {
                setLoading(true);
                const data = await getInvitationDetails(token);
                setInvitation(data);
            } catch (error: any) {
                toast({
                    title: "Invitation invalide",
                    description: error.message || "Le lien d'invitation est expiré ou invalide.",
                    variant: "destructive"
                });
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [token, navigate, toast]);

    const handleAccept = async () => {
        if (!user) {
            handleSignupRedirect();
            return;
        }

        if (user.email.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
            toast({
                title: "Mauvais compte",
                description: `Cette invitation est destinée à ${invitation.invitee_email}. Vous êtes connecté en tant que ${user.email}.`,
                variant: "destructive"
            });
            return;
        }

        try {
            setIsAccepting(true);
            await acceptInvitation(token!);
            
            // AUTOMATIC SWITCH: On définit le contexte sur l'entreprise dès l'acceptation
            if (invitation.inviter_id) {
                localStorage.setItem("active_context", invitation.inviter_id);
            }
            
            toast({
                title: "Succès !",
                description: "Vous faites maintenant partie de l'équipe.",
            });
            // Recharger la page pour mettre à jour l'état de l'utilisateur (parentId)
            window.location.href = "/owner-dashboard";
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'accepter l'invitation.",
                variant: "destructive"
            });
        } finally {
            setIsAccepting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30 pb-20">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse font-medium">Vérification de l'invitation...</p>
                </div>
            </div>
        );
    }

    if (!invitation) return null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-secondary/30 pb-20">
            <Card className="max-w-md w-full shadow-2xl border-none overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center pb-2">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-in border border-primary/20">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">Invitation d'Équipe</CardTitle>
                    <CardDescription className="text-base mt-2">
                        <span className="font-bold text-foreground">{invitation.inviter_name}</span> vous invite à rejoindre son équipe de gestion immobilière.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-4">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-inner">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm">Information Importante</h4>
                                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                                    En acceptant ce rôle d'<strong>Agent</strong>, vous ne pourrez plus souscrire à un abonnement <strong>Entreprise</strong> avec ce compte. 
                                    Vous resterez libre de souscrire à un abonnement <strong>Premium</strong> pour vos activités personnelles.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Permissions accordées :</h4>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-secondary">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-sm font-medium">Gestion des biens et locataires</span>
                            </div>
                            {invitation.permissions?.can_view_revenue && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-secondary">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium">Accès aux rapports financiers</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 space-y-4">
                        {user ? (
                            <Button 
                                className="w-full gradient-primary text-white h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                onClick={handleAccept}
                                disabled={isAccepting}
                            >
                                {isAccepting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                                Accepter le rôle d'Agent
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-sm text-muted-foreground mb-2">
                                    Vous n'êtes pas encore connecté.
                                </p>
                                <Button 
                                    className="w-full gradient-primary text-white h-14 text-lg font-bold shadow-lg"
                                    onClick={handleSignupRedirect}
                                >
                                    S'inscrire et rejoindre l'équipe
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full h-12"
                                    onClick={() => navigate(`/auth?mode=login&email=${invitation.invitee_email}`)}
                                >
                                    Se connecter au compte existant
                                </Button>
                            </div>
                        )}
                        <Button 
                            variant="ghost" 
                            className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl h-12"
                            onClick={() => navigate("/")}
                            disabled={isAccepting}
                        >
                            Refuser l'invitation
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AcceptInvitation;
