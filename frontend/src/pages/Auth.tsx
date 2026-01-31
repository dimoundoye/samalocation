import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, User, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login, signup } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { verifyEmail } from "@/api/emailverification";
import Turnstile from "react-turnstile";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const setMode = (newMode: string) => setSearchParams({ mode: newMode, type: formData.userType });
  const userType = searchParams.get("type") || "tenant";
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    identifier: "", // Can be email or customId
    email: "",
    password: "",
    name: "",
    phone: "",
    companyName: "",
    userType: userType,
  });

  const { setUser, setUserRole } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDev = import.meta.env.DEV;
    if (!turnstileToken && !isDev) {
      toast.error("Veuillez confirmer que vous n'êtes pas un robot.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await login({
        email: formData.identifier || formData.email, // backend expects 'email' key but supports both
        password: formData.password,
        turnstileToken: turnstileToken || "",
      });

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
        setUserRole(data.user.role || null);

        toast.success("Connexion réussie!");

        if (data.user.setupRequired) {
          navigate("/setup-profile");
        } else if (data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (data.user.role === "owner") {
          navigate("/owner-dashboard");
        } else {
          navigate("/tenant-dashboard");
        }
      }
    } catch (error: any) {
      toast.error("L'authentification a échoué. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDev = import.meta.env.DEV;
    if (!turnstileToken && !isDev) {
      toast.error("Veuillez confirmer que vous n'êtes pas un robot.");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation et la politique de confidentialité.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (formData.password.length < 8) {
        toast.error("Le mot de passe doit contenir au moins 8 caractères");
        setLoading(false);
        return;
      }

      const data = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: formData.userType,
        companyName: formData.userType === "owner" ? formData.companyName : null,
        turnstileToken: turnstileToken || "",
      });

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
        setUserRole(data.user.role || null);

        toast.success(`Compte créé avec succès ! Votre ID de connexion est : ${data.user.customId}`, {
          duration: 10000,
        });

        if (data.user.role === "owner") {
          navigate("/owner-dashboard");
        } else {
          navigate("/tenant-dashboard");
        }
      }
    } catch (error: any) {
      toast.error("La création du compte a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card className="w-full max-w-md shadow-strong animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Samalocation</CardTitle>
          <CardDescription>
            {mode === "login" ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={mode} onValueChange={(value) => {
            setTurnstileToken(null);
            navigate(`/auth?mode=${value}&type=${formData.userType}`);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email ou ID</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="exemple@email.com ou AA12345"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                {import.meta.env.PROD && (
                  <div className="flex justify-center py-2">
                    <Turnstile
                      sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onVerify={(token) => setTurnstileToken(token)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button
                    type="button"
                    variant={formData.userType === "owner" ? "default" : "outline"}
                    className={formData.userType === "owner" ? "gradient-primary text-white" : ""}
                    onClick={() => setFormData({ ...formData, userType: "owner" })}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Propriétaire
                  </Button>
                  <Button
                    type="button"
                    variant={formData.userType === "tenant" ? "default" : "outline"}
                    className={formData.userType === "tenant" ? "gradient-primary text-white" : ""}
                    onClick={() => setFormData({ ...formData, userType: "tenant" })}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Locataire
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom et prenom</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom et prenom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {formData.userType === "owner" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise (optionnel)</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Nom de votre entreprise"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
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
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                {import.meta.env.PROD && (
                  <div className="flex justify-center py-2">
                    <Turnstile
                      sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onVerify={(token) => setTurnstileToken(token)}
                    />
                  </div>
                )}

                <div className="flex items-start space-x-2 py-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer select-none"
                  >
                    J'ai lu et j'accepte les{" "}
                    <Link to="/terms" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                      conditions d'utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link to="/privacy" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                      politique de confidentialité
                    </Link>
                    .
                  </Label>
                </div>

                <Button type="submit" className="w-full gradient-accent text-white" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
