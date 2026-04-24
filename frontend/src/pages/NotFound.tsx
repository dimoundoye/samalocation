import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-accent/5 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-100/50 rounded-full blur-2xl" />

      {/* Logo */}
      <div className="mb-10 animate-fade-in">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logo-sl.png" alt="SamaLocation" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Samalocation
          </span>
        </button>
      </div>

      {/* Main Card */}
      <div className="relative z-10 text-center max-w-lg w-full animate-scale-in">
        
        {/* Animated house illustration */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-48 h-48 bg-primary/5 rounded-full animate-pulse" />
          <div className="relative animate-float">
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* House body */}
              <rect x="30" y="75" width="100" height="70" rx="4" fill="hsl(240 68% 25% / 0.08)" stroke="hsl(240 68% 25% / 0.3)" strokeWidth="2"/>
              {/* Roof */}
              <path d="M20 78 L80 25 L140 78" stroke="hsl(4 90% 58% / 0.7)" strokeWidth="3" strokeLinecap="round" fill="hsl(4 90% 58% / 0.08)"/>
              {/* Door */}
              <rect x="65" y="105" width="30" height="40" rx="3" fill="hsl(240 68% 25% / 0.15)" stroke="hsl(240 68% 25% / 0.3)" strokeWidth="1.5"/>
              {/* Windows */}
              <rect x="38" y="90" width="22" height="20" rx="3" fill="hsl(200 80% 70% / 0.3)" stroke="hsl(240 68% 25% / 0.2)" strokeWidth="1.5"/>
              <rect x="100" y="90" width="22" height="20" rx="3" fill="hsl(200 80% 70% / 0.3)" stroke="hsl(240 68% 25% / 0.2)" strokeWidth="1.5"/>
              {/* Question mark */}
              <text x="80" y="68" textAnchor="middle" fontSize="28" fontWeight="bold" fill="hsl(4 90% 58%)" opacity="0.8">?</text>
              {/* Ground */}
              <ellipse cx="80" cy="148" rx="55" ry="6" fill="hsl(240 68% 25% / 0.06)"/>
            </svg>
          </div>
        </div>

        {/* Error code */}
        <div className="mb-4">
          <span className="text-8xl font-black bg-gradient-to-r from-primary via-primary/70 to-accent bg-clip-text text-transparent leading-none">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Cette page est introuvable
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-2">
          Il semble que vous cherchez un logement qui n'existe pas… ou cette page a déménagé sans laisser d'adresse ! 🏠
        </p>
        <p className="text-sm text-muted-foreground/70 mb-10 flex items-center justify-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <code className="font-mono bg-secondary px-2 py-0.5 rounded text-xs">{location.pathname}</code>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="gradient-primary text-white h-12 px-8 rounded-xl shadow-medium hover:shadow-strong hover:scale-[1.02] transition-all font-bold w-full sm:w-auto"
            onClick={() => navigate("/")}
          >
            <Home className="mr-2 h-5 w-5" />
            Retour à l'accueil
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto transition-all"
            onClick={() => navigate("/search")}
          >
            <Search className="mr-2 h-5 w-5" />
            Chercher un logement
          </Button>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Revenir à la page précédente
        </button>
      </div>

      {/* Footer */}
      <p className="mt-16 text-xs text-muted-foreground/50 relative z-10">
        © {new Date().getFullYear()} SamaLocation — La gestion immobilière simplifiée au Sénégal
      </p>
    </div>
  );
};

export default NotFound;
