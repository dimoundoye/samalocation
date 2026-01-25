import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Settings, LogOut, TrendingUp, Menu, Building2, AlertTriangle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { PropertyStatsChart } from "@/components/admin/PropertyStatsChart";
import { PropertyTypeChart } from "@/components/admin/PropertyTypeChart";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import UsersManagement from "@/components/admin/UsersManagement";
import PropertiesManagement from "@/components/admin/PropertiesManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import ContactsManagement from "@/components/admin/ContactsManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import { getAdminStatistics, getRecentUsers } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, AdminStatistics } from "@/types";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statistics, setStatistics] = useState<AdminStatistics>({
    totalUsers: 0,
    owners: 0,
    tenants: 0,
    totalProperties: 0,
    publishedProperties: 0,
    newUsersCount: 0,
    newPropertiesCount: 0,
    pendingReportsCount: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    // Récupérer les dates de dernière consultation depuis le localStorage
    // Par défaut, on prend les 7 derniers jours si c'est la première fois
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lastUsersCheck = localStorage.getItem("admin_last_users_check") || sevenDaysAgo.toISOString();
    const lastPropertiesCheck = localStorage.getItem("admin_last_properties_check") || sevenDaysAgo.toISOString();

    try {
      const [statsData, usersData] = await Promise.all([
        getAdminStatistics({ lastUsersCheck, lastPropertiesCheck }),
        getRecentUsers(10)
      ]);

      setStatistics(statsData);
      setRecentUsers(usersData);
    } catch (error: any) {
      console.error("Error loading admin dashboard data:", error);
      toast({
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger les données du tableau de bord.",
        variant: "destructive",
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const sidebarContent = (
    <>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
      >
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Samalocation Admin
        </span>
      </button>

      <nav className="space-y-2">
        {[
          { id: "overview", label: "Tableau de bord", icon: TrendingUp },
          { id: "users", label: "Utilisateurs", icon: Users },
          { id: "properties", label: "Propriétés", icon: Building2 },
          { id: "reports", label: "Signalements", icon: AlertTriangle },
          { id: "support", label: "Messages Support", icon: MessageSquare },
          { id: "settings", label: "Paramètres", icon: Settings },
        ].map((item) => {
          // Calculer le badge en fonction de l'item
          const badgeCount = item.id === "users"
            ? statistics.newUsersCount
            : item.id === "properties"
              ? statistics.newPropertiesCount
              : item.id === "reports"
                ? statistics.pendingReportsCount
                : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);

                // Réinitialiser le badge lors de la consultation
                if (item.id === "users") {
                  localStorage.setItem("admin_last_users_check", new Date().toISOString());
                  setStatistics(prev => ({ ...prev, newUsersCount: 0 }));
                } else if (item.id === "properties") {
                  localStorage.setItem("admin_last_properties_check", new Date().toISOString());
                  setStatistics(prev => ({ ...prev, newPropertiesCount: 0 }));
                }
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                ? "bg-primary text-white"
                : "hover:bg-secondary text-muted-foreground"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs font-bold"
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        onClick={signOut}
        className="w-full mt-8 justify-start text-muted-foreground"
      >
        <LogOut className="mr-3 h-5 w-5" />
        Déconnexion
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r shadow-soft hidden md:block">
        <div className="p-6">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header with Menu */}
          <div className="md:hidden mb-6">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-6">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Tableau de bord administrateur</h1>
            <p className="text-muted-foreground">Vue d'ensemble de la plateforme Samalocation</p>
          </div>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === "users" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestion des utilisateurs</h1>
                <p className="text-muted-foreground">Gérez les utilisateurs et bloquez les comptes problématiques</p>
              </div>
              <UsersManagement />
            </div>
          )}

          {activeTab === "properties" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestion des propriétés</h1>
                <p className="text-muted-foreground">Gérez les biens immobiliers de la plateforme</p>
              </div>
              <PropertiesManagement />
            </div>
          )}

          {activeTab === "reports" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestion des signalements</h1>
                <p className="text-muted-foreground">Traitez les signalements et modérez le contenu</p>
              </div>
              <ReportsManagement />
            </div>
          )}

          {activeTab === "support" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Messages de support</h1>
                <p className="text-muted-foreground">Gérez les messages reçus via le formulaire de contact</p>
              </div>
              <ContactsManagement />
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Paramètres administrateur</h1>
                <p className="text-muted-foreground">Configurez les paramètres de la plateforme</p>
              </div>
              <AdminSettings />
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Utilisateurs</p>
                        <p className="text-2xl font-bold">{formatNumber(statistics.totalUsers)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Propriétaires</p>
                        <p className="text-2xl font-bold">{formatNumber(statistics.owners)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Locataires</p>
                        <p className="text-2xl font-bold">{formatNumber(statistics.tenants)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Propriétés Publiées</p>
                        <p className="text-2xl font-bold">{formatNumber(statistics.publishedProperties)}</p>
                        <p className="text-xs text-muted-foreground">/ {formatNumber(statistics.totalProperties)} total</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nouveaux utilisateurs */}
              <Card className="shadow-soft mb-6">
                <CardHeader>
                  <CardTitle>Nouveaux utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.full_name}</p>
                            <p className="text-[10px] font-bold text-primary">{user.custom_id}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                            {user.role === 'owner' ? 'Propriétaire' : 'Locataire'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserGrowthChart />
                <PropertyTypeChart />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
