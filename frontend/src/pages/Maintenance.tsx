import { ShieldAlert, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Maintenance = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-full shadow-premium inline-block">
            <ShieldAlert className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">SITE EN MAINTENANCE</h1>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Samalocation fait peau neuve ! Nous effectuons actuellement des mises à jour pour améliorer votre expérience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 flex flex-col items-center">
            <Clock className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-bold text-slate-800">Retour prévu</span>
            <span className="text-xs text-slate-500 italic">Bientôt disponible</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 flex flex-col items-center">
            <Mail className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-bold text-slate-800">Support</span>
            <span className="text-xs text-slate-500 italic">Contactez-nous si besoin</span>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="w-full h-12 text-lg font-bold rounded-xl"
          >
            Actualiser la page
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full h-12 text-lg font-bold rounded-xl border-slate-200"
          >
            Accès Administrateur
          </Button>
        </div>

        <p className="mt-12 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Samalocation. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
