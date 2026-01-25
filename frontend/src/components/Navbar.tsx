import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Home, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin-dashboard";
    if (userRole === "owner") return "/owner-dashboard";
    return "/tenant-dashboard";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Samalocation
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Accueil</Link>
              <Link to="/search" className="text-sm font-medium hover:text-primary transition-colors">Explorer</Link>
              <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Button
                    variant="default"
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Mon espace</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth?mode=login")}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Connexion
                  </Button>
                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="gradient-accent text-white shadow-medium hover:shadow-strong transition-all"
                  >
                    <UserPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Inscription</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
