import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, Users, Settings, LogOut, TrendingUp, Menu, Building2, AlertTriangle, MessageSquare, CreditCard, Bell, PieChart, DollarSign, Bot, Zap, Clock, Eye, Activity, MousePointer2, Receipt, ShieldAlert } from "lucide-react";
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
import { DocumentAudit } from "@/components/admin/DocumentAudit";
import { ThemeToggle } from "@/components/ThemeToggle";
import { History, ExternalLink, ArrowUpRight, Loader2, Download } from "lucide-react";
import { getAdminStatistics, getRecentUsers, getPendingVerifications, getAdminTransactions, getRevenueStats, updateUserSubscription, getLiveAnalytics, getOwnerBalances, forceOwnerWithdrawal, getAllReceipts, downloadReceipt, openReceiptInNewTab } from "@/lib/api";
import { ReceiptPreviewModal } from "@/components/receipts/ReceiptPreviewModal";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, AdminStatistics } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from "@/lib/utils";

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
  const [selectedPreviewReceipt, setSelectedPreviewReceipt] = useState<{ id: string; number?: string; date?: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filter === "api") {
      filtered = filtered.filter((t) => ["wave", "orange_money", "card", "paydunya"].includes(t.payment_method?.toLowerCase()));
    } else if (filter === "wave_manual") {
      filtered = filtered.filter((t) => t.payment_method?.toLowerCase() === "wave_manual");
    } else if (filter === "referred") {
      filtered = filtered.filter((t) => t.referred_by);
    } else if (filter === "admin_validated") {
      filtered = filtered.filter((t) => ["manual_admin", "admin_validated"].includes(t.payment_method?.toLowerCase()));
    }

    return filtered;
  }, [transactions, filter]);

  const [revenueStats, setRevenueStats] = useState<{ daily: any[], monthly: any[], yearly: any[], adminMonthly: any[], adminYearly: any[] }>({ daily: [], monthly: [], yearly: [], adminMonthly: [], adminYearly: [] });
  const [loadingRevenueStats, setLoadingRevenueStats] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [financeSubTab, setFinanceSubTab] = useState<"subscriptions" | "owners">("subscriptions");
  const [ownersWallets, setOwnersWallets] = useState<any[]>([]);
  const [realPayDunyaBalance, setRealPayDunyaBalance] = useState<string>("");
  const [ledgerStats, setLedgerStats] = useState<any>({ total_surplus: 0, total_transactions: 0, total_rent_volume: 0 });
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [actionLoadingOwnerId, setActionLoadingOwnerId] = useState<string | null>(null);
  const [selectedOwnerForWithdrawal, setSelectedOwnerForWithdrawal] = useState<any | null>(null);
  const [forceWithdrawalPhone, setForceWithdrawalPhone] = useState("");
  const [forceWithdrawalProvider, setForceWithdrawalProvider] = useState("wave");
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [loadingReceiptsList, setLoadingReceiptsList] = useState(false);
  const [receiptsPagination, setReceiptsPagination] = useState({ total: 0, pages: 1, current_page: 1 });
  const [receiptsSearch, setReceiptsSearch] = useState("");
  const [receiptsPage, setReceiptsPage] = useState(1);

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

  const submitForcedWithdrawal = async () => {
    if (!selectedOwnerForWithdrawal) return;
    const cleanPhone = forceWithdrawalPhone.trim();
    if (!cleanPhone) {
      toast({
        title: "Erreur",
        description: "Le numéro de téléphone est requis.",
        variant: "destructive"
      });
      return;
    }

    setActionLoadingOwnerId(selectedOwnerForWithdrawal.id);
    try {
      await forceOwnerWithdrawal(selectedOwnerForWithdrawal.id, {
        customPhone: cleanPhone,
        customProvider: forceWithdrawalProvider
      });
      toast({
        title: "Virement forcé initié",
        description: `Le virement forcé de ${formatCurrency(selectedOwnerForWithdrawal.balance)} a été envoyé avec succès.`,
      });
      setWithdrawalModalOpen(false);
      loadOwnerBalancesData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec du virement.",
        variant: "destructive"
      });
    } finally {
      setActionLoadingOwnerId(null);
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

  const loadOwnerBalancesData = async () => {
    setLoadingOwners(true);
    try {
      const data = await getOwnerBalances();
      if (data) {
        setOwnersWallets(data.owners || []);
        setLedgerStats(data.stats || { total_surplus: 0, total_transactions: 0, total_rent_volume: 0 });
      }
    } catch (error) {
      console.error("Error loading owner balances:", error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadReceiptsList = async () => {
    setLoadingReceiptsList(true);
    try {
      const data = await getAllReceipts({ page: receiptsPage, limit: 15, search: receiptsSearch });
      if (data) {
        setReceiptsList(data.receipts || []);
        setReceiptsPagination(data.pagination || { total: 0, pages: 1, current_page: 1 });
      }
    } catch (error) {
      console.error("Error loading receipts list:", error);
    } finally {
      setLoadingReceiptsList(false);
    }
  };

  const handleSearchReceipts = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptsPage(1);
    loadReceiptsList();
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
      loadOwnerBalancesData();
    } else if (activeTab === 'receipts') {
      loadRevenueStats();
      loadReceiptsList();
    } else if (activeTab === 'live') {
      loadLiveAnalytics();
    }
  }, [activeTab, receiptsPage]);

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
        className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity overflow-hidden"
      >
        <img src="/logo-sl.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate hidden lg:block">
          Admin
        </span>
      </button>

      <nav className="space-y-1">
        {[
          { id: "overview", label: "Tableau de bord", icon: TrendingUp },
          { id: "live", label: "Vue en direct", icon: Eye },
          { id: "users", label: "Utilisateurs", icon: Users },
          { id: "properties", label: "Propriétés", icon: Building2 },
          { id: "verifications", label: "Vérifications", icon: Shield },
          { id: "audit", label: "Audit Documents", icon: ShieldAlert },
          { id: "reports", label: "Signalements", icon: AlertTriangle },
          { id: "support", label: "Messages Support", icon: MessageSquare },
          { id: "finances", label: "Finances", icon: CreditCard },
          { id: "receipts", label: "Reçus", icon: Receipt },
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
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${activeTab === item.id
                ? "bg-primary text-white"
                : "hover:bg-secondary text-muted-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
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
        className="w-full mt-4 justify-start text-muted-foreground"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Déconnexion
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-56 bg-card border-r shadow-soft hidden md:flex flex-col">
        <div className="p-4 flex-1 overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* ─── Sticky Mobile Header ────────────────────────────────────────────── */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b bg-card/85 backdrop-blur-md shadow-sm">
          {/* Left: Hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* Center: Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Accueil">
            <img src="/logo-sl.png" alt="Samalocation" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Admin</span>
          </button>

          {/* Right: Notifications + Theme */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
                    <Bell className="h-5 w-5 text-primary" />
                    {(statistics.pendingReportsCount + statistics.pendingVerificationsCount + statistics.pendingPaymentsCount) > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-red-500 border border-background text-[9px] font-bold text-white">
                        {statistics.pendingReportsCount + statistics.pendingVerificationsCount + statistics.pendingPaymentsCount > 9 ? '9+' : statistics.pendingReportsCount + statistics.pendingVerificationsCount + statistics.pendingPaymentsCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 shadow-premium border-primary/10 rounded-2xl overflow-hidden" align="end">
                  <div className="p-4 border-b bg-primary/5">
                    <h3 className="font-bold text-sm">Notifications Admin</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {statistics.pendingPaymentsCount > 0 && (
                      <button onClick={() => { navigate("/admin-dashboard/finances"); setMobileMenuOpen(false); }} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{statistics.pendingPaymentsCount} paiement{statistics.pendingPaymentsCount > 1 ? 's' : ''} en attente</p>
                          <p className="text-xs text-muted-foreground italic">À valider dans Finances</p>
                        </div>
                      </button>
                    )}
                    {statistics.pendingReportsCount > 0 && (
                      <button onClick={() => { navigate("/admin-dashboard/reports"); setMobileMenuOpen(false); }} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{statistics.pendingReportsCount} signalements en attente</p>
                          <p className="text-xs text-muted-foreground italic">Appuyez pour examiner</p>
                        </div>
                      </button>
                    )}
                    {statistics.pendingVerificationsCount > 0 && (
                      <button onClick={() => { navigate("/admin-dashboard/verifications"); setMobileMenuOpen(false); }} className="w-full text-left p-4 hover:bg-secondary/50 border-b flex items-start gap-3 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{statistics.pendingVerificationsCount} vérifications d'identité</p>
                          <p className="text-xs text-muted-foreground italic">Profils à valider</p>
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
        </header>

        <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Desktop Header - Notifications + Theme */}
          <div className="hidden md:flex mb-8 items-center justify-end gap-3">
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

          {activeTab === "audit" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Audit & Anti-Fraude</h1>
                <p className="text-muted-foreground">Vérifiez l'authenticité et l'intégrité des documents PDF générés</p>
              </div>
              <DocumentAudit />
            </div>
          )}

          {activeTab === "finances" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4">
                <div>
                  <h1 className="text-xl md:text-3xl font-black mb-1">Finances et Gains</h1>
                  <p className="text-muted-foreground text-xs">Suivez les abonnements, les soldes bailleurs et les gains de SamaLocation.</p>
                </div>
                <div className="flex gap-1.5 bg-secondary/40 p-1 rounded-xl self-start sm:self-auto border">
                  <Button 
                    variant={financeSubTab === "subscriptions" ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-8 rounded-lg font-bold"
                    onClick={() => setFinanceSubTab("subscriptions")}
                  >
                    Abonnements
                  </Button>
                  <Button 
                    variant={financeSubTab === "owners" ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-8 rounded-lg font-bold"
                    onClick={() => setFinanceSubTab("owners")}
                  >
                    Portefeuilles & Retraits Bailleurs
                  </Button>
                </div>
              </div>

              {financeSubTab === "subscriptions" ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-primary/5 px-4 py-3 rounded-xl border border-primary/10">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Revenu Brut estimé ce mois (Abonnements)</span>
                    <span className="text-lg font-black text-primary">{formatCurrency(statistics.revenue?.active || 0)}</span>
                  </div>

                  <Card className="shadow-soft">
                    <CardHeader className="bg-secondary/10 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Dernières Transactions d'Abonnement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b bg-muted/20">
                        <span className="text-xs font-semibold text-muted-foreground">Filtres:</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { key: "all", label: "Tous" },
                            { key: "api", label: "API Paiement" },
                            { key: "wave_manual", label: "Manuel" },
                            { key: "referred", label: "Parrainage" },
                            { key: "admin_validated", label: "Validé Admin" },
                          ].map(({ key, label }) => (
                            <Button
                              key={key}
                              variant={filter === key ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-[10px] px-2.5 rounded-lg"
                              onClick={() => setFilter(key)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="grid grid-cols-1 gap-2 md:hidden">
                        {loadingTransactions ? (
                          <div className="p-8 text-center text-muted-foreground text-xs">Chargement...</div>
                        ) : filteredTransactions.length > 0 ? (
                          filteredTransactions.map((t) => (
                            <div key={t.id} className="p-4 border-b last:border-0 bg-card">
                              <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0 flex-1 mr-2">
                                  <p className="font-bold text-xs truncate">{t.user_name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{t.user_email}</p>
                                </div>
                                <Badge variant="outline" className="capitalize shrink-0 text-[9px]">{t.plan_name}</Badge>
                              </div>

                              <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-sm">{formatCurrency(t.price)}</span>
                                {t.status === 'active' ? (
                                  <Badge className="bg-green-500 text-[9px] h-5">Réussi</Badge>
                                ) : t.status === 'pending' ? (
                                  <Badge className="bg-orange-500 text-[9px] h-5">En attente</Badge>
                                ) : (
                                  <Badge variant="secondary" className="capitalize text-[9px] h-5">{t.status}</Badge>
                                )}
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-3">
                                <span>{formatDate(t.created_at)}</span>
                                {t.sender_phone && <span>{t.sender_phone}</span>}
                              </div>

                              {t.status === 'pending' && (
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-[11px] font-bold gradient-primary text-white"
                                  onClick={() => handleApprovePayment(t)}
                                >
                                  Approuver le paiement
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-muted-foreground text-xs">Aucune transaction trouvée.</div>
                        )}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
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
                              <TableHead>Reçu</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingTransactions ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-10 text-xs">Chargement...</TableCell>
                              </TableRow>
                            ) : filteredTransactions.length > 0 ? (
                              filteredTransactions.map((t) => (
                                <TableRow key={t.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-semibold text-xs">{t.user_name}</p>
                                      <p className="text-[10px] text-muted-foreground">{t.user_email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize text-[10px]">{t.plan_name}</Badge>
                                  </TableCell>
                                  <TableCell className="font-black text-xs">{formatCurrency(t.price)}</TableCell>
                                  <TableCell className="text-xs">{formatDate(t.created_at)}</TableCell>
                                  <TableCell>
                                    {t.status === 'active' ? (
                                      <Badge className="bg-green-500 hover:bg-green-600 text-[10px]">Réussi</Badge>
                                    ) : t.status === 'pending' ? (
                                      <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px]">En attente</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="capitalize text-[10px]">{t.status}</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-[10px] font-mono opacity-60">{t.transaction_id || '-'}</TableCell>
                                  <TableCell className="text-xs font-semibold">{t.sender_phone || '-'}</TableCell>
                                  <TableCell>
                                    {t.receipt_url ? (
                                      <a
                                        href={t.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline font-bold text-xs transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Voir reçu
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground opacity-50">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {t.status === 'pending' && (
                                      <Button
                                        size="sm"
                                        className="h-8 text-xs font-bold gradient-primary text-white"
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
                                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-xs">Aucune transaction trouvée.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Section Trésorerie & Gains */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">1. Revenus & Performance Plateforme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="shadow-soft bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full translate-x-6 -translate-y-6 blur-lg" />
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-white/95">Gain Cumulé SamaLocation</CardDescription>
                          <CardTitle className="text-2xl font-black pt-1">
                            {formatCurrency(ledgerStats.cumulative_revenue || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-white/80 mt-1 leading-relaxed">
                            Surplus loyers ({formatCurrency(ledgerStats.total_surplus || 0)}) + Abonnements net ({formatCurrency(ledgerStats.total_subscriptions_net || 0)})
                          </p>
                        </CardHeader>
                      </Card>

                      <Card className="shadow-soft bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-green-700">Marge Collecte Loyer (0.5% Surplus)</CardDescription>
                          <CardTitle className="text-2xl font-black text-green-600 pt-1">
                            {formatCurrency(ledgerStats.total_surplus || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-green-500 font-semibold mt-1">
                            Gains de transaction sur le traitement des baux
                          </p>
                        </CardHeader>
                      </Card>

                      <Card className="shadow-soft bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Revenus Abonnements (Brut PayDunya)</CardDescription>
                          <CardTitle className="text-2xl font-black text-blue-600 pt-1">
                            {formatCurrency(ledgerStats.total_subscriptions_gross || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-blue-500 font-semibold mt-1">
                            Net plateforme après 2% PayDunya : {formatCurrency(ledgerStats.total_subscriptions_net || 0)}
                          </p>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">2. Trésorerie & Fonds de Réserve (PayDunya)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="shadow-soft bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Total Portefeuilles Bailleurs</CardDescription>
                          <CardTitle className="text-xl font-black text-amber-600 pt-1">
                            {formatCurrency(ledgerStats.total_owner_balances || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-amber-500 mt-1">
                            Dette virtuelle totale due aux propriétaires
                          </p>
                        </CardHeader>
                      </Card>

                      <Card className="shadow-soft bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Fonds de Réserve Requis PayDunya</CardDescription>
                          <CardTitle className="text-xl font-black text-purple-600 pt-1">
                            {formatCurrency(ledgerStats.reserved_funds || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-purple-500 mt-1">
                            Somme réelle à bloquer sur PayDunya (Solde Bailleurs - 2.5% + 2% PayDunya)
                          </p>
                        </CardHeader>
                      </Card>

                      <Card className="shadow-soft">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Volume loyers traités</CardDescription>
                          <CardTitle className="text-xl font-black text-foreground pt-1">
                            {formatCurrency(ledgerStats.total_rent_volume || 0)}
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Flux locatif global
                          </p>
                        </CardHeader>
                      </Card>

                      <Card className="shadow-soft">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paiements validés</CardDescription>
                          <CardTitle className="text-xl font-black text-foreground pt-1">
                            {ledgerStats.total_transactions || 0}
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Nombre de transactions
                          </p>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Calculateur de part SamaLocation en temps réel */}
                    <Card className="shadow-soft bg-gradient-to-r from-muted/60 via-muted to-muted/60 border border-primary/10 mt-6 rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          Calculateur de Part SamaLocation
                        </CardTitle>
                        <CardDescription className="text-[11px] text-muted-foreground">
                          Saisissez le montant total actuel affiché sur votre console PayDunya. Le système déduira automatiquement les fonds réservés aux propriétaires pour vous indiquer vos bénéfices nets retirables.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                          <div className="space-y-1.5 flex-1 max-w-xs">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Solde Réel PayDunya (FCFA)</label>
                            <Input 
                              type="number"
                              placeholder="Ex: 500000"
                              className="h-10 text-xs rounded-xl"
                              value={realPayDunyaBalance}
                              onChange={(e) => setRealPayDunyaBalance(e.target.value)}
                            />
                          </div>
                          {realPayDunyaBalance && !isNaN(parseFloat(realPayDunyaBalance)) && (() => {
                            const realVal = parseFloat(realPayDunyaBalance);
                            const reserved = ledgerStats.reserved_funds || 0;
                            const netEarnings = realVal - reserved;
                            
                            return (
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background p-4 rounded-xl border border-primary/5 shadow-inner">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fonds Réservés Propriétaires</p>
                                  <p className="text-sm font-black text-foreground mt-0.5">{formatCurrency(reserved)}</p>
                                  <p className="text-[9px] text-muted-foreground mt-0.5">Indispensable pour couvrir les virements</p>
                                </div>
                                <div className="border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Votre part (Bénéfice SamaLocation)</p>
                                  <p className={`text-base font-black mt-0.5 ${netEarnings >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {formatCurrency(netEarnings)}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground mt-0.5">
                                    {netEarnings >= 0 ? "Montant que vous pouvez retirer en toute sécurité" : "Attention: Déficit sur PayDunya par rapport aux soldes virtuels"}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* List of owners balances */}
                  <Card className="shadow-soft">
                    <CardHeader className="bg-secondary/10 border-b">
                      <CardTitle className="text-sm font-bold">Soldes des Portefeuilles Bailleurs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Propriétaire</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Paiement Ligne</TableHead>
                              <TableHead>Statut Compte</TableHead>
                              <TableHead className="text-right">Solde Virtuel</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingOwners ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                  Chargement en cours...
                                </TableCell>
                              </TableRow>
                            ) : ownersWallets.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                  Aucun portefeuille bailleur trouvé.
                                </TableCell>
                              </TableRow>
                            ) : (
                              ownersWallets.map((owner) => {
                                const handleForceWithdraw = () => {
                                  setSelectedOwnerForWithdrawal(owner);
                                  setForceWithdrawalPhone(owner.phone || "");
                                  setForceWithdrawalProvider("wave");
                                  setWithdrawalModalOpen(true);
                                };

                                return (
                                  <TableRow key={owner.id}>
                                    <TableCell>
                                      <div className="font-bold text-xs text-foreground">{owner.full_name}</div>
                                      {owner.company_name && (
                                        <div className="text-[10px] text-muted-foreground">{owner.company_name}</div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div>{owner.email}</div>
                                      <div className="text-[10px] text-muted-foreground">{owner.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                      {owner.online_payment_enabled ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Activé</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-muted-foreground text-[10px]">Désactivé</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {owner.is_blocked ? (
                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">Suspendu</Badge>
                                      ) : (
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium text-[10px]">Actif</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-xs text-primary">
                                      {formatCurrency(owner.balance, owner.currency || "XOF")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px] gap-1 text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                                        disabled={parseFloat(owner.balance) <= 0 || actionLoadingOwnerId !== null}
                                        onClick={handleForceWithdraw}
                                      >
                                        {actionLoadingOwnerId === owner.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <ArrowUpRight className="w-3.5 h-3.5" />
                                        )}
                                        Virement forcé
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "receipts" && (
            <div className="animate-fade-in w-full max-w-full overflow-hidden">
              <div className="mb-6">
                <h1 className="text-xl md:text-3xl font-bold mb-2">Volume des Reçus Délivrés</h1>
                <p className="text-muted-foreground text-sm">Activité financière globale gérée par la plateforme</p>
              </div>

              <Tabs defaultValue="list" className="w-full max-w-full">
                <div className="overflow-x-auto mb-4">
                  <TabsList>
                    <TabsTrigger value="list">Liste des reçus</TabsTrigger>
                    <TabsTrigger value="admin-monthly">Admin (Mois)</TabsTrigger>
                    <TabsTrigger value="admin-yearly">Admin (Année)</TabsTrigger>
                    <TabsTrigger value="daily">Loyer (Quotidien)</TabsTrigger>
                    <TabsTrigger value="monthly">Loyer (Mensuel)</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="list" className="w-full max-w-full space-y-4">
                  {/* Barre de recherche */}
                  <form onSubmit={handleSearchReceipts} className="flex gap-2 max-w-md">
                    <Input 
                      placeholder="Rechercher par N° Reçu, Propriétaire, Locataire..."
                      value={receiptsSearch}
                      onChange={(e) => setReceiptsSearch(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                    <Button type="submit" size="sm" className="rounded-xl h-10 px-4 text-xs font-bold">
                      Rechercher
                    </Button>
                    {receiptsSearch && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl h-10 text-xs font-semibold"
                        onClick={() => {
                          setReceiptsSearch("");
                          setReceiptsPage(1);
                          setTimeout(() => loadReceiptsList(), 0);
                        }}
                      >
                        Effacer
                      </Button>
                    )}
                  </form>

                  {/* Tableau des reçus */}
                  <Card className="shadow-soft rounded-2xl overflow-hidden border">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° Reçu</TableHead>
                              <TableHead>Propriétaire</TableHead>
                              <TableHead>Locataire</TableHead>
                              <TableHead>Bien</TableHead>
                              <TableHead>Date Paiement</TableHead>
                              <TableHead>Mode</TableHead>
                              <TableHead className="text-right">Montant</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingReceiptsList ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                  Chargement des reçus...
                                </TableCell>
                              </TableRow>
                            ) : receiptsList.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                                  Aucun reçu de loyer trouvé.
                                </TableCell>
                              </TableRow>
                            ) : (
                              receiptsList.map((r) => {
                                const handlePreview = async () => {
                                  try {
                                    await openReceiptInNewTab(r.id);
                                  } catch (err) {
                                    console.error("Error opening receipt PDF:", err);
                                    toast({
                                      title: "Erreur",
                                      description: "Impossible d'ouvrir le reçu.",
                                      variant: "destructive"
                                    });
                                  }
                                };

                                const handleDownload = async () => {
                                  try {
                                    await downloadReceipt(r.id, r.receipt_number, r.payment_date);
                                  } catch (err) {
                                    console.error("Error downloading PDF:", err);
                                    toast({
                                      title: "Erreur",
                                      description: "Impossible de télécharger le PDF.",
                                      variant: "destructive"
                                    });
                                  }
                                };

                                return (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-bold text-xs text-primary">{r.receipt_number}</TableCell>
                                    <TableCell className="text-xs font-semibold">{r.owner_name}</TableCell>
                                    <TableCell className="text-xs">{r.tenant_name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{r.property_name || 'N/A'}</TableCell>
                                    <TableCell className="text-xs">
                                      {r.payment_date ? new Date(r.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <Badge variant="outline" className="text-[10px] bg-slate-50 uppercase">
                                        {r.payment_method}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-black">
                                      {formatCurrency(r.amount, r.currency || 'XOF')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 w-8 p-0 rounded-xl hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950"
                                          onClick={handlePreview}
                                          title="Ouvrir le reçu PDF dans un nouvel onglet ↗️"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 w-8 p-0 rounded-xl"
                                          onClick={handleDownload}
                                          title="Télécharger le reçu PDF"
                                        >
                                          <Download className="w-3.5 h-3.5 text-primary" />
                                        </Button>
                                        {r.paydunya_token && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 rounded-xl"
                                            asChild
                                            title="Consulter le reçu PayDunya"
                                          >
                                            <a 
                                              href={import.meta.env.VITE_PAYDUNYA_MODE === 'test'
                                                ? `https://app.paydunya.com/sandbox-checkout/receipt/pdf/${r.paydunya_token}.pdf`
                                                : `https://paydunya.com/checkout/receipt/pdf/${r.paydunya_token}.pdf`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                                            </a>
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {receiptsPagination.pages > 1 && !loadingReceiptsList && (
                        <div className="flex items-center justify-between p-4 border-t">
                          <span className="text-xs text-muted-foreground">
                            Page {receiptsPagination.current_page} sur {receiptsPagination.pages} ({receiptsPagination.total} reçus)
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline" size="sm"
                              className="rounded-xl h-8 text-xs font-bold"
                              disabled={receiptsPage <= 1}
                              onClick={() => setReceiptsPage(p => p - 1)}
                            >
                              Précédent
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              className="rounded-xl h-8 text-xs font-bold"
                              disabled={receiptsPage >= receiptsPagination.pages}
                              onClick={() => setReceiptsPage(p => p + 1)}
                            >
                              Suivant
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {loadingRevenueStats ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Chargement des statistiques...
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <TabsContent value="admin-monthly" className="w-full max-w-full">
                      <Card className="shadow-soft bg-card border-l-4 border-l-primary/50 w-full max-w-full">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                            <span className="truncate">Revenu Samalocation (Mensuel)</span>
                            <Badge variant="outline" className="shrink-0 text-[10px] text-primary border-primary/20">ADMIN</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 w-full max-w-full">
                          <div className="w-full aspect-[4/3] md:aspect-[3/1]">
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
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="admin-yearly" className="w-full max-w-full">
                      <Card className="shadow-soft bg-card border-l-4 border-l-primary/50 w-full max-w-full">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                            <span className="truncate">Revenu Samalocation (Annuel)</span>
                            <Badge variant="outline" className="shrink-0 text-[10px] text-primary border-primary/20">ANNUEL</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 w-full max-w-full">
                          <div className="w-full aspect-[4/3] md:aspect-[3/1]">
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
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="daily" className="w-full max-w-full">
                      <Card className="shadow-soft bg-card w-full max-w-full">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Volume des reçus (30j)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 w-full max-w-full">
                          <div className="w-full aspect-[4/3] md:aspect-[3/1]">
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
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="monthly" className="w-full max-w-full">
                      <Card className="shadow-soft bg-card w-full max-w-full">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Volume mensuel géré (12 mois)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 w-full max-w-full">
                          <div className="w-full aspect-[4/3] md:aspect-[3/1]">
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
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </>
                )}
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
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/20">
                      <TableRow>
                        <TableHead>User Agent (Identité)</TableHead>
                        <TableHead className="text-right w-32 shrink-0">Requêtes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveAnalytics?.topBots?.length > 0 ? (
                        liveAnalytics.topBots.map((bot: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs opacity-80">
                              <span className="block max-w-[200px] md:max-w-md truncate">{bot.user_agent}</span>
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
        </div>
      </main>

      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 border-none shadow-strong bg-background overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              Virement forcé
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground mt-2">
              Reverser le solde de <strong>{selectedOwnerForWithdrawal?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="bg-muted/50 p-5 rounded-2xl border border-border/40">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Montant total à reverser
              </div>
              <div className="text-3xl font-black text-foreground">
                {selectedOwnerForWithdrawal && formatCurrency(selectedOwnerForWithdrawal.balance)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Opérateur de paiement
              </Label>
              <Select value={forceWithdrawalProvider} onValueChange={setForceWithdrawalProvider}>
                <SelectTrigger id="provider" className="w-full h-12 rounded-xl bg-muted/30 border-border/80">
                  <SelectValue placeholder="Choisir un opérateur" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  <SelectItem value="wave">Wave Sénégal</SelectItem>
                  <SelectItem value="orange_money">Orange Money Sénégal</SelectItem>
                  <SelectItem value="free_money">Free Money Sénégal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Numéro de téléphone bénéficiaire (Wave/OM/Free)
              </Label>
              <Input
                id="phone"
                type="text"
                placeholder="Ex: 77 123 45 67"
                value={forceWithdrawalPhone}
                onChange={(e) => setForceWithdrawalPhone(e.target.value)}
                className="h-12 rounded-xl bg-muted/30 border-border/80 text-base"
              />
              <p className="text-[10px] text-muted-foreground/80 mt-1 leading-relaxed">
                Le numéro sera automatiquement converti au format national sénégalais de 9 chiffres requis par PayDunya.
              </p>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setWithdrawalModalOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold border-border/80 text-muted-foreground hover:bg-muted/40"
              >
                Annuler
              </Button>
              <Button
                onClick={submitForcedWithdrawal}
                disabled={actionLoadingOwnerId !== null || !forceWithdrawalPhone.trim()}
                className="flex-1 h-12 rounded-xl font-bold bg-destructive text-white hover:bg-destructive/95"
              >
                {actionLoadingOwnerId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        receiptId={selectedPreviewReceipt?.id || null}
        receiptNumber={selectedPreviewReceipt?.number}
        paymentDate={selectedPreviewReceipt?.date}
      />
    </div>
  );
};

export default AdminDashboard;
