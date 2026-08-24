import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Home, LogIn, UserPlus, LayoutDashboard, Menu, Search, CreditCard, Mail, Globe, Info, Heart } from "lucide-react";
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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/50 rounded-2xl shadow-strong transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src="/logo-sl.png" alt="Logo" className="h-9 sm:h-10 w-auto transition-transform group-hover:scale-105" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block tracking-tight">
              Samalocation
            </span>
          </Link>

          <div className="flex items-center gap-2 xl:gap-4 shrink-0">
            <div className="hidden xl:flex items-center gap-5 mr-2">
              <Link to="/" className="text-xs xl:text-sm font-medium hover:text-primary transition-colors">{t('nav.home')}</Link>
              <Link to="/search" className="text-xs xl:text-sm font-medium hover:text-primary transition-colors">{t('nav.explore')}</Link>
              <Link to="/about" className="text-xs xl:text-sm font-medium hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/pricing" className="text-xs xl:text-sm font-medium hover:text-primary transition-colors">{t('nav.pricing')}</Link>
              <Link to="/contact" className="text-xs xl:text-sm font-medium hover:text-primary transition-colors">{t('nav.contact')}</Link>
              {user && (
                <Link to="/favorites" className="text-xs xl:text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  {t('nav.favorites') || "Favoris"}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <NotificationBell />
                  <Button
                    variant="default"
                    onClick={() => navigate(getDashboardPath())}
                    className="flex items-center gap-2 h-9 sm:h-10 px-2.5 sm:px-4 shrink-0 text-xs sm:text-sm font-semibold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Mon espace</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth?mode=login")}
                    className="hidden sm:flex items-center gap-2 h-9 sm:h-10 px-3 text-xs sm:text-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    {t('nav.login')}
                  </Button>
                  {/* Mobile Login Button */}
                  <Button
                    onClick={() => navigate("/auth?mode=login")}
                    className="flex sm:hidden gradient-accent text-white shadow-soft hover:shadow-medium transition-all h-9 w-9 p-0 items-center justify-center shrink-0"
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>

                  {/* Desktop/Tablet Signup Button */}
                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="hidden sm:flex gradient-accent text-white shadow-soft hover:shadow-medium transition-all h-9 sm:h-10 px-3 sm:px-4 items-center gap-2 shrink-0 text-xs sm:text-sm font-semibold"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{t('nav.signup')}</span>
                  </Button>
                </div>
              )}

              {/* Burger Menu for Mobile & Tablet (up to xl screens) */}
              <div className="xl:hidden ml-0.5 shrink-0">
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
                      <MobileNavLink to="/about" icon={Info} label={t('nav.about')} onClick={() => setOpen(false)} />
                      {user && (
                        <MobileNavLink to="/favorites" icon={Heart} label={t('nav.favorites') || "Mes Favoris"} onClick={() => setOpen(false)} />
                      )}
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
