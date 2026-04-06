import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Settings, LogOut, TrendingUp, Menu, Building2, AlertTriangle, MessageSquare, CreditCard, Bell, PieChart, DollarSign, Bot, Zap, Clock, Eye, Activity, MousePointer2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { PropertyStatsChart } from "@/components/admin/PropertyStatsChart";
import { PropertyTypeChart } from "@/components/admin/PropertyTypeChart";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import UsersManagement from "@/components/admin/UsersManagement";
import PropertiesManagement from "@/components/admin/PropertiesManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import ContactsManagement from "@/components/admin/ContactsManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import VerificationsManagement from "@/components/admin/VerificationsManagement";
import { ThemeToggle } from "@/components/ThemeToggle";
import { History } from "lucide-react";
import { getAdminStatistics, getRecentUsers, getPendingVerifications, getAdminTransactions, getRevenueStats, updateUserSubscription, getLiveAnalytics } from "@/lib/api";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, AdminStatistics } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(urlTab || "overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statistics, setStatistics] = useState<AdminStatistics>({
    totalUsers: 0,
    owners: 0,
    tenants: 0,
    totalProperties: 0,
    publishedProperties: 0,
    newUsersCount: 0,
    newPropertiesCount: 0,
    pendingReportsCount: 0,
    pendingVerificationsCount: 0,
    pendingPaymentsCount: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [revenueStats, setRevenueStats] = useState<{ daily: any[], monthly: any[], yearly: any[], adminMonthly: any[], adminYearly: any[] }>({ daily: [], monthly: [], yearly: [], adminMonthly: [], adminYearly: [] });
  const [loadingRevenueStats, setLoadingRevenueStats] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

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
        getRecentUsers(10, lastUsersCheck)
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

  const handleApprovePayment = async (transaction: any) => {
    try {
      // Calculer la durée en fonction du prix pour les plans annuels
      const isAnnual = parseFloat(transaction.price) >= 50000;
      const durationDays = isAnnual ? 365 : 30;

      await updateUserSubscription(transaction.user_id, {
        planName: transaction.plan_name,
        durationDays: durationDays,
        price: transaction.price,
        status: 'active',
        subscriptionId: transaction.id
      });

      toast({
        title: "Paiement approuvé",
        description: `L'abonnement de ${transaction.user_name} est désormais actif.`,
      });

      loadTransactions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'approuver le paiement.",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await getAdminTransactions(50);
      setTransactions(data);
    } catch (error: any) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadRevenueStats = async () => {
    setLoadingRevenueStats(true);
    try {
      const data = await getRevenueStats();
      setRevenueStats(data);
    } catch (error: any) {
      console.error("Error loading revenue stats:", error);
    } finally {
      setLoadingRevenueStats(false);
    }
  };

  const loadLiveAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getLiveAnalytics();
      setLiveAnalytics(data);
    } catch (error: any) {
      console.error("Error loading live analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else {
      setActiveTab("overview");
    }
  }, [urlTab]);

  useEffect(() => {
    if (activeTab === 'finances') {
      loadTransactions();
      loadRevenueStats();
    } else if (activeTab === 'live') {
      loadLiveAnalytics();
    }
  }, [activeTab]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  };

  const sidebarContent = (
    <>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity overflow-hidden"
      >
        <img src="/logo-sl.png" alt="Logo" className="h-12 w-auto object-contain shrink-0" />
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate hidden lg:block">
          Samalocation Admin
        </span>
      </button>

      <nav className="space-y-2">
        {[
          { id: "overview", label: "Tableau de bord", icon: TrendingUp },
          { id: "live", label: "Vue en direct", icon: Eye },
          { id: "users", label: "Utilisateurs", icon: Users },
          { id: "properties", label: "Propriétés", icon: Building2 },
          { id: "verifications", label: "Vérifications", icon: Shield },
          { id: "reports", label: "Signalements", icon: AlertTriangle },
          { id: "support", label: "Messages Support", icon: MessageSquare },
          { id: "finances", label: "Finances", icon: CreditCard },
          { id: "settings", label: "Paramètres", icon: Settings },
        ].map((item) => {
          // Calculer le badge en fonction de l'item
          const badgeCount = item.id === "users"
            ? statistics.newUsersCount
            : item.id === "properties"
              ? statistics.newPropertiesCount
              : item.id === "reports"
                ? statistics.pendingReportsCount
                : item.id === "verifications"
                  ? statistics.pendingVerificationsCount
                  : item.id === "finances"
                    ? statistics.pendingPaymentsCount
                    : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/admin-dashboard/${item.id}`);
                setMobileMenuOpen(false);

                // Réinitialiser le badge lors de la consultation
                if (item.id === "users" || item.id === "overview") {
                  localStorage.setItem("admin_last_users_check", new Date().toISOString());
                  setStatistics(prev => ({ ...prev, newUsersCount: 0 }));
                } else if (item.id === "properties") {
                  localStorage.setItem("admin_last_properties_check", new Date().toISOString());
                  setStatistics(prev => ({ ...prev, newPropertiesCount: 0 }));
                } else if (item.id === "finances") {
                  // Le badge disparaît temporairement — rechargé à l'actualisation suivante
                  setStatistics(prev => ({ ...prev, pendingPaymentsCount: 0 }));
                  loadTransactions();
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Tableau de bord administrateur</h1>
              <p className="text-muted-foreground">Vue d'ensemble de la plateforme Samalocation</p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full shadow-soft hover:shadow-medium border-primary/20">
                      <Bell className="h-5 w-5 text-primary" />
                      {(statistics.pendingReportsCount + statistics.pendingVerificationsCount + statistics.pendingPaymentsCount) > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-background animate-pulse text-white">
                          {statistics.pendingReportsCount + statistics.pendingVerificationsCount + statistics.pendingPaymentsCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 shadow-premium border-primary/10 rounded-2xl overflow-hidden" align="end">
                    <div className="p-4 border-b bg-primary/5">
                      <h3 className="font-bold text-sm">Notifications Admin</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {statistics.pendingPaymentsCount > 0 && (
                        <button onClick={() => { navigate("/admin-dashboard/finances"); }} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{statistics.pendingPaymentsCount} paiement{statistics.pendingPaymentsCount > 1 ? 's' : ''} en attente</p>
                            <p className="text-xs text-muted-foreground italic tracking-tight">À valider dans Finances</p>
                          </div>
                        </button>
                      )}
                      {statistics.pendingReportsCount > 0 && (
                        <button onClick={() => navigate("/admin-dashboard/reports")} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{statistics.pendingReportsCount} signalements en attente</p>
                            <p className="text-xs text-muted-foreground italic tracking-tight">Appuyez pour examiner</p>
                          </div>
                        </button>
                      )}
                      {statistics.pendingVerificationsCount > 0 && (
                        <button onClick={() => navigate("/admin-dashboard/verifications")} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{statistics.pendingVerificationsCount} vérifications d'identité</p>
                            <p className="text-xs text-muted-foreground italic tracking-tight">Profils à valider</p>
                          </div>
                        </button>
                      )}
                      {(statistics.pendingReportsCount === 0 && statistics.pendingVerificationsCount === 0 && statistics.pendingPaymentsCount === 0) && (
                        <div className="p-8 text-center text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Tout est à jour !</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === "users" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestion des utilisateurs</h1>
                <p className="text-muted-foreground">Gérez les utilisateurs et bloquez les comptes problématiques</p>
              </div>
              <UsersManagement initialSearchTerm={userSearchTerm} />
            </div>
          )}

          {activeTab === "properties" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestion des propriétés</h1>
                <p className="text-muted-foreground">Gerez les biens immobiliers de la plateforme</p>
              </div>
              <PropertiesManagement
                onViewProfile={(name) => {
                  setUserSearchTerm(name);
                  navigate("/admin-dashboard/users");
                }}
              />
            </div>
          )}

          {activeTab === "verifications" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Vérification des propriétaires</h1>
                <p className="text-muted-foreground">Examinez les pièces d'identité et validez les profils</p>
              </div>
              <VerificationsManagement />
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

          {activeTab === "finances" && (
            <div className="animate-fade-in">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Transactions et Revenus</h1>
                  <p className="text-muted-foreground">Suivez les abonnements et les rentrées d'argent</p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-xs text-primary font-bold uppercase block">Revenu du mois</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(statistics.revenue?.active || 0)}</span>
                </div>
              </div>

              <Card className="shadow-soft overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Dernières Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>ID Transaction</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingTransactions ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">Chargement...</TableCell>
                        </TableRow>
                      ) : transactions.length > 0 ? (
                        transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{t.user_name}</p>
                                <p className="text-xs text-muted-foreground">{t.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{t.plan_name}</Badge>
                            </TableCell>
                            <TableCell className="font-bold">{formatCurrency(t.price)}</TableCell>
                            <TableCell>{formatDate(t.created_at)}</TableCell>
                            <TableCell>
                              {t.status === 'active' ? (
                                <Badge className="bg-green-500 hover:bg-green-600">Réussi</Badge>
                              ) : t.status === 'pending' ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600">En attente</Badge>
                              ) : (
                                <Badge variant="secondary" className="capitalize">{t.status}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono opacity-60">{t.transaction_id || '-'}</TableCell>
                            <TableCell className="text-sm font-medium">{t.sender_phone || '-'}</TableCell>
                            <TableCell className="text-right">
                              {t.status === 'pending' && (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gradient-primary text-white"
                                  onClick={() => handleApprovePayment(t)}
                                >
                                  Approuver
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Aucune transaction trouvée.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Statistiques des Reçus */}
              <div className="mt-12 mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Volume des Reçus Délivrés</h2>
                <p className="text-muted-foreground text-sm">Activité financière globale gérée par la plateforme</p>
              </div>

              <Tabs defaultValue="admin-monthly" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="admin-monthly">Revenu Admin (Mois)</TabsTrigger>
                  <TabsTrigger value="admin-yearly">Revenu Admin (Année)</TabsTrigger>
                  <TabsTrigger value="daily">Loyer (Quotidien)</TabsTrigger>
                  <TabsTrigger value="monthly">Loyer (Mensuel)</TabsTrigger>
                </TabsList>

                {/* --- REVENU ADMIN --- */}
                <TabsContent value="admin-monthly">
                  <Card className="shadow-soft bg-card border-l-4 border-l-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center justify-between">
                        Revenu Samalocation (Abonnements - Mensuel)
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/20">ADMIN REVENUE</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueStats.adminMonthly}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                            style={{ fontSize: 10 }}
                          />
                          <YAxis
                            tickFormatter={(val) => `${val / 1000}k`}
                            style={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val: any) => [formatCurrency(val), "Revenu Admin"]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          />
                          <Bar
                            dataKey="total"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="admin-yearly">
                  <Card className="shadow-soft bg-card border-l-4 border-l-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center justify-between">
                        Revenu Samalocation (Abonnements - Annuel)
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/20">HISTORIQUE ANNUEL</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueStats.adminYearly}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis
                            dataKey="date"
                            style={{ fontSize: 10 }}
                          />
                          <YAxis
                            tickFormatter={(val) => `${val / 1000}k`}
                            style={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val: any) => [formatCurrency(val), "Revenu Admin"]}
                          />
                          <Bar
                            dataKey="total"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* --- VOLUME GÉRÉ (REÇUS) --- */}
                <TabsContent value="daily">
                  <Card className="shadow-soft bg-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Volume des reçus (Mouvement de fonds - 30j)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueStats.daily}>
                          <defs>
                            <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => formatDate(val)}
                            style={{ fontSize: 10 }}
                          />
                          <YAxis
                            tickFormatter={(val) => `${val / 1000}k`}
                            style={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val: any) => [formatCurrency(val), "Volume"]}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            fillOpacity={1}
                            fill="url(#colorDaily)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monthly">
                  <Card className="shadow-soft bg-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Volume mensuel géré (12 derniers mois)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueStats.monthly}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                            style={{ fontSize: 10 }}
                          />
                          <YAxis
                            tickFormatter={(val) => `${val / 1000}k`}
                            style={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(val: any) => [formatCurrency(val), "Volume"]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          />
                          <Bar
                            dataKey="total"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "live" && (
            <div className="animate-fade-in space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary animate-pulse" />
                    Vue en direct
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-green-600">
                      {liveAnalytics?.online_now || 0} personne{ (liveAnalytics?.online_now || 0) > 1 ? 's' : '' } en ligne
                    </span>
                    <span className="text-xs">• Analyse du trafic et robots</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadLiveAnalytics} 
                  disabled={loadingAnalytics}
                  className="gap-2"
                >
                  <History className={`h-4 w-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>

              {/* Live Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-soft overflow-hidden border-green-500/20 bg-green-500/5 col-span-1">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative">
                      <Users className="h-10 w-10 text-green-600" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-ping" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-green-700">{liveAnalytics?.online_now || 0}</span>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-tighter">Connectés en direct</p>
                    </div>
                  </CardContent>
                </Card>

                {[
                  { title: "Dernières 24h", data: liveAnalytics?.daily },
                  { title: "30 derniers jours", data: liveAnalytics?.monthly },
                ].map((period, idx) => (
                  <Card key={idx} className="shadow-soft overflow-hidden border-primary/10">
                    <CardHeader className="bg-primary/5 py-4 border-b">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">{period.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-muted-foreground text-xs">Visites</span>
                        <span className="text-xl font-black">{formatNumber(period.data?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-muted-foreground text-xs">Uniques</span>
                        <span className="text-lg font-bold text-blue-600">{formatNumber(period.data?.unique_visitors || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="shadow-soft overflow-hidden border-red-500/10">
                  <CardHeader className="bg-red-500/5 py-4 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-600">Robots (Mois)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          Identifiés
                        </span>
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
                          {formatNumber(liveAnalytics?.monthly?.bots || 0)}
                        </Badge>
                      </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Évolution du trafic (30 jours)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loadingAnalytics ? (
                    <div className="h-full flex items-center justify-center">Chargement...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveAnalytics?.growth || []}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => formatDate(val)}
                          style={{ fontSize: 10 }}
                        />
                        <YAxis style={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(val: any) => [formatNumber(val), ""]}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Area 
                          type="monotone" 
                          name="Visites"
                          dataKey="total" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorVisits)" 
                          strokeWidth={3}
                        />
                        <Area 
                          type="monotone" 
                          name="Robots"
                          dataKey="bots" 
                          stroke="#ef4444" 
                          fillOpacity={1} 
                          fill="url(#colorBots)" 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Bots Table */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MousePointer2 className="h-5 w-5 text-red-500" />
                    Systèmes automatisés (Robots détectés)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-secondary/20">
                      <TableRow>
                        <TableHead>User Agent (Identité)</TableHead>
                        <TableHead className="text-right">Nombre de requêtes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveAnalytics?.topBots?.length > 0 ? (
                        liveAnalytics.topBots.map((bot: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs max-w-md truncate opacity-80">
                              {bot.user_agent}
                            </TableCell>
                            <TableCell className="text-right font-black">
                              {formatNumber(bot.count)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground italic">
                            Aucun robot identifié pour le moment.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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

              {/* Finance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="shadow-soft bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                  <CardContent className="p-6 text-primary">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-sm uppercase tracking-wider">Revenu Actuel</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(statistics.revenue?.active || 0)}</p>
                    <p className="text-xs opacity-70">Abonnements actifs ce mois</p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Revenu Total</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(statistics.revenue?.total || 0)}</p>
                    <p className="text-xs text-muted-foreground">Depuis le lancement</p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <PieChart className="h-5 w-5 text-accent" />
                      <span className="text-sm font-medium text-muted-foreground">Abonnés Premium</span>
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(statistics.subscriptions?.premium || 0)}</p>
                    <p className="text-xs text-muted-foreground">Offre 5 000 F / mois</p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-2">
                      <Shield className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium text-muted-foreground">Abonnés Pro</span>
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(statistics.subscriptions?.professionnel || 0)}</p>
                    <p className="text-xs text-muted-foreground">Offre 15 000 F / mois</p>
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
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg animate-fade-in-up">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{user.full_name}</p>
                              <p className="text-[10px] font-bold text-primary">{user.customId}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                              {user.role === 'owner' ? 'Propriétaire' : 'Locataire'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-secondary/10 rounded-lg border-2 border-dashed border-secondary">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground">Aucun nouvel utilisateur depuis votre dernière visite.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <UserGrowthChart />
                <PropertyTypeChart />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="shadow-soft mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-indigo-500" />
                        Performance de l'IA
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase">Google Gemini 1.5 Pro</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { label: "Descriptions", action: "description_generation" },
                          { label: "Recherche Smart", action: "smart_search" },
                          { label: "Chat Support", action: "chat" }
                        ].map((ai) => {
                          const stats = statistics.aiUsage?.find(s => s.action === ai.action);
                          return (
                            <div key={ai.action} className="p-4 rounded-xl bg-secondary/20 border border-secondary transition-all hover:border-indigo-500/30">
                              <span className="text-xs text-muted-foreground block mb-1">{ai.label}</span>
                              <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold">{stats?.count || 0}</span>
                                <Zap className="h-4 w-4 text-yellow-500 opacity-50" />
                              </div>
                              {stats?.last_used && (
                                <span className="text-[10px] text-muted-foreground mt-2 block flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(stats.last_used).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <ActivityFeed />
                </div>

                <div className="space-y-6">
                  <Card className="shadow-soft bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Conseil Stratégique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic leading-relaxed">
                        "L'utilisation de l'IA pour les descriptions augmente l'engagement des annonces de 25%. Encouragez vos propriétaires à l'utiliser !"
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft bg-accent/5">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Astuce Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic">
                        "La vérification des pièces d'identité augmente la confiance des locataires de 40% sur la plateforme."
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
