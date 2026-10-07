import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] w-full bg-white dark:bg-slate-950 flex flex-col justify-between relative overflow-x-hidden text-slate-800 dark:text-slate-100">
      
      {/* Responsive Hero Banner Image Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center p-2 sm:p-6 md:p-10 pointer-events-none">
        <img
          src="/hero-404-full.jpg"
          alt={t('not_found.image_alt')}
          className="w-full h-auto max-h-[85dvh] sm:max-h-[90dvh] object-contain object-center max-w-7xl mx-auto opacity-95 dark:opacity-90 animate-fade-in"
        />
        {/* Soft bottom gradient overlay for smooth button readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent dark:from-slate-950 dark:via-slate-950/30" />
      </div>

     

      {/* Main Responsive Floating Action Bar (Positioned to the far left, buttons stacked) */}
      <main className="relative z-10 flex-1 flex flex-col justify-end items-start max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 pb-6 sm:pb-10">
        
        <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl mr-auto w-full sm:w-80 md:w-96 animate-scale-in">
          
          {/* Action Buttons Stacked Vertically on top of each other */}
          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              className="gradient-primary text-white h-12 sm:h-13 px-6 rounded-xl shadow-md hover:shadow-primary/25 hover:scale-[1.01] transition-all font-bold text-sm sm:text-base w-full justify-center"
              onClick={() => navigate("/")}
            >
              <Home className="mr-2.5 h-4 w-4 sm:h-5 sm:w-5" />
              {t('common.back_home')}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-13 px-6 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base transition-all w-full justify-center"
              onClick={() => navigate("/search")}
            >
              <Search className="mr-2.5 h-4 w-4 sm:h-5 sm:w-5" />
              {t('not_found.find_home')}
            </Button>
          </div>

          {/* Back link */}
          <div className="mt-4 text-center sm:text-left">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              {t('common.go_back')}
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 pb-4 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} Samalocation — {t('common.tagline')}
      </footer>

    </div>
  );
};

export default NotFound;



