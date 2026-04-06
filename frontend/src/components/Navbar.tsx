import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Home, LogIn, UserPlus, LayoutDashboard, Menu, Search, CreditCard, Mail, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin-dashboard";
    if (userRole === "owner") return "/owner-dashboard";
    return "/tenant-dashboard";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src="/logo-sl.png" alt="Logo" className="h-12 w-auto" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden lg:block">
              Samalocation
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-6 mr-4">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.home')}</Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.pricing')}</Link>
              <Link to="/search" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.explore')}</Link>
              <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.contact')}</Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <NotificationBell />
                  <Button
                    variant="default"
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center gap-2 h-10 px-4"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden md:inline">Espace</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth?mode=login")}
                    className="hidden lg:flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {t('nav.login')}
                  </Button>
                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="gradient-accent text-white shadow-soft hover:shadow-medium transition-all h-10 px-4"
                  >
                    <UserPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('nav.signup')}</span>
                  </Button>
                </div>
              )}

              {/* Burger Menu for Mobile & Tablet */}
              <div className="lg:hidden ml-1">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] max-w-[350px]">
                    <SheetHeader className="text-left mb-6">
                      <SheetTitle className="flex items-center gap-2">
                        <img src="/logo-sl.png" alt="Logo" className="h-8 w-8" />
                        Samalocation
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col gap-1 py-4">
                      <MobileNavLink to="/" icon={Home} label={t('nav.home')} onClick={() => setOpen(false)} />
                      <MobileNavLink to="/search" icon={Search} label={t('nav.explore')} onClick={() => setOpen(false)} />
                      <MobileNavLink to="/pricing" icon={CreditCard} label={t('nav.pricing')} onClick={() => setOpen(false)} />
                      <MobileNavLink to="/contact" icon={Mail} label={t('nav.contact')} onClick={() => setOpen(false)} />
                    </div>

                    <div className="border-t pt-6 mt-4 space-y-4">
                      <div className="flex items-center justify-between px-4 pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Préférences</span>
                        <div className="flex items-center gap-2">
                          <LanguageToggle />
                          <ThemeToggle />
                        </div>
                      </div>

                      {user ? (
                        <Button 
                          className="w-full justify-start h-12 text-base px-4" 
                          onClick={() => { navigate(getDashboardPath()); setOpen(false); }}
                        >
                          <LayoutDashboard className="mr-3 h-5 w-5" />
                          Mon Tableau de bord
                        </Button>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 p-1">
                          <Button 
                            variant="outline" 
                            className="h-12 text-base"
                            onClick={() => { navigate("/auth?mode=login"); setOpen(false); }}
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            {t('nav.login')}
                          </Button>
                          <Button 
                            className="h-12 text-base gradient-accent"
                            onClick={() => { navigate("/auth?mode=signup"); setOpen(false); }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t('nav.signup')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface MobileNavLinkProps {
  to: string;
  icon: any;
  label: string;
  onClick: () => void;
}

const MobileNavLink = ({ to, icon: Icon, label, onClick }: MobileNavLinkProps) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-secondary transition-colors text-lg font-medium"
  >
    <Icon className="h-6 w-6 text-primary" />
    {label}
  </Link>
);

export default Navbar;
