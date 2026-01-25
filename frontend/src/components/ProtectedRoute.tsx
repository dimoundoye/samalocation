import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
