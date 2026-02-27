import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, User, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login, signup, forgotPassword } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { verifyEmail } from "@/api/emailverification";
import Turnstile from "react-turnstile";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const setMode = (newMode: string) => setSearchParams({ mode: newMode, type: formData.userType });
  const userType = searchParams.get("type") || "tenant";
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
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
      toast.error(error.message || "L'authentification a échoué. Vérifiez vos identifiants.");
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
      toast.error(error.message || "La création du compte a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    try {
      setResetLoading(true);
      await forgotPassword(resetEmail);
      toast.success("E-mail envoyé. Si cet e-mail existe, vous recevrez un lien de réinitialisation.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setResetLoading(false);
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
        {t('common.back')}
      </Button>

      <Card className="w-full max-w-md shadow-strong animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Samalocation</CardTitle>
          <CardDescription>
            {mode === "login" ? t('auth.login.card_desc') : t('auth.signup.card_desc')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={mode} onValueChange={(value) => {
            setTurnstileToken(null);
            // Si on passe à l'inscription, on ne définit pas de type par défaut pour forcer le choix
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("mode", value);
            if (value === "signup") {
              newSearchParams.delete("type");
              setFormData({ ...formData, userType: "" });
            } else {
              newSearchParams.set("type", formData.userType || "tenant");
            }
            navigate(`/auth?${newSearchParams.toString()}`);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.login.title')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup.title')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">{t('auth.login.identifier')}</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={t('auth.login.placeholder_id')}
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('common.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs text-primary font-medium"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      {t('auth.login.forgot_password')}
                    </Button>
                  </div>
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
                      {t('auth.login.logging_in')}
                    </>
                  ) : (
                    t('auth.login.submit')
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {!formData.userType || (mode === "signup" && !searchParams.get("type") && formData.userType === "tenant" && !formData.name) ? (
                <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('auth.signup.welcome')}</h3>
                    <p className="text-sm text-muted-foreground">{t('auth.signup.choice_type')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      type="button"
                      className="flex items-center p-4 rounded-xl border-2 border-transparent bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group text-left shadow-sm hover:shadow-md"
                      onClick={() => {
                        setFormData({ ...formData, userType: "owner" });
                        setSearchParams({ mode: "signup", type: "owner" });
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">{t('auth.signup.owner_type')}</p>
                        <p className="text-xs text-muted-foreground">{t('auth.signup.owner_desc')}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="flex items-center p-4 rounded-xl border-2 border-transparent bg-card hover:border-accent/50 hover:bg-accent/5 transition-all group text-left shadow-sm hover:shadow-md"
                      onClick={() => {
                        setFormData({ ...formData, userType: "tenant" });
                        setSearchParams({ mode: "signup", type: "tenant" });
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <User className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-accent">{t('auth.signup.tenant_type')}</p>
                        <p className="text-xs text-muted-foreground">{t('auth.signup.tenant_desc')}</p>
                      </div>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      {t('auth.signup.has_account')}{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-primary font-medium hover:underline"
                      >
                        {t('auth.signup.login')}
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`px-3 py-1 ${formData.userType === 'owner' ? 'border-primary text-primary' : 'border-accent text-accent'}`}>
                      {formData.userType === "owner" ? <Home className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                      {formData.userType === "owner" ? t('auth.signup.owner_badge') : t('auth.signup.tenant_badge')}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setSearchParams({ mode: "signup" });
                        setFormData({ ...formData, userType: "tenant", name: "", email: "", password: "", phone: "", companyName: "" });
                      }}
                    >
                      {t('common.change')}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.signup.full_name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('auth.signup.full_name')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {formData.userType === "owner" && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">{t('auth.signup.company')}</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder={t('auth.signup.company')}
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.signup.phone')}</Label>
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
                    <Label htmlFor="signup-email">{t('common.email')}</Label>
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
                    <Label htmlFor="signup-password">{t('common.password')}</Label>
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
                      {t('auth.signup.terms_accept')}{" "}
                      <Link to="/terms" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                        {t('auth.signup.terms_link')}
                      </Link>{" "}
                      et la{" "}
                      <Link to="/privacy" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                        {t('auth.signup.privacy_link')}
                      </Link>
                      .
                    </Label>
                  </div>

                  <Button type="submit" className={`w-full text-white ${formData.userType === 'owner' ? 'gradient-primary' : 'gradient-accent'}`} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.signup.creating')}
                      </>
                    ) : (
                      t('auth.signup.submit')
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mot de passe oublié</DialogTitle>
            <DialogDescription>
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="votre@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                Annuler
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer le lien"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
