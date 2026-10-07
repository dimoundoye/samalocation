import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading, connectionError, retryAuth, signOut } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-strong p-8 text-center space-y-6 animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <WifiOff className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('connection.problem_title')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('connection.problem_desc')}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={retryAuth} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold shadow-soft hover:shadow-medium transition-all">
              <RefreshCw className="mr-2 h-4 w-4" /> {t('common.retry')}
            </Button>
            <Button variant="ghost" onClick={signOut} className="w-full h-11 text-muted-foreground hover:text-foreground">
              {t('connection.home_or_logout')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Si la configuration est requise, forcer la redirection vers la page de setup
  if (user.setupRequired && location.pathname !== "/setup-profile") {
    return <Navigate to="/setup-profile" replace />;
  }

  // Si la configuration est déjà faite et qu'on essaie d'aller sur setup-profile
  if (!user.setupRequired && location.pathname === "/setup-profile") {
    if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (user.role === "owner") return <Navigate to="/owner-dashboard" replace />;
    return <Navigate to="/tenant-dashboard" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!userRole || !roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
