import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Plus, Users, Settings, LogOut, MessageSquare, TrendingUp, Menu, Building2, Send, Phone, Trash2, Edit, ArrowLeft, History, PieChart, ChevronLeft, ChevronRight, BarChart3, Wrench } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getOwnerProperties,
  getOwnerTenants,
  getMessages,
  sendMessage,
  togglePropertyPublication,
  searchUsers,
  markMessagesAsRead,
  deleteMessage,
  updateTenant,
  deleteTenant,
  getOwnerReceipts,
  downloadReceipt,
  deleteProperty,
  updateProperty,
  getOwnerMaintenanceRequests,
  getOwnerProfile
} from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PenTool, ArrowRight } from "lucide-react";
import { AddPropertyModal } from "@/components/owner/AddPropertyModal";
import { EditPropertyModal } from "@/components/owner/EditPropertyModal";
import { OwnerSettings } from "@/components/owner/OwnerSettings";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfile } from "@/components/UserProfile";
import { AssignTenantDialog } from "@/components/owner/AssignTenantDialog";
import { EditTenantDialog } from "@/components/owner/EditTenantDialog";
import { CreateReceiptDialog } from "@/components/owner/CreateReceiptDialog";
import { useAuth } from "@/contexts/AuthContext";
import { TenantHistoryDialog } from "@/components/owner/TenantHistoryDialog";
import { ManagementTable } from "@/components/owner/ManagementTable";
import { OwnerMaintenanceTab } from "@/components/owner/OwnerMaintenanceTab";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { transformProperty } from "@/lib/property";
import { Property, PropertyUnit, Tenant, Message, Receipt } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSocket } from "@/contexts/SocketContext";

const DashboardProprietaire = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null); // Contact unique (locataire ou candidat)
  const [newMessage, setNewMessage] = useState("");
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedUnits: 0,
    activeTenants: 0,
  });
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<Property | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPropertyForAssign, setSelectedPropertyForAssign] = useState<Property | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [createReceiptOpen, setCreateReceiptOpen] = useState(false);
  const [selectedPropertyForReceipt, setSelectedPropertyForReceipt] = useState<Tenant | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignTenantOpen, setAssignTenantOpen] = useState(false);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTenantForHistory, setSelectedTenantForHistory] = useState<Tenant | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [tenantSearch, setTenantSearch] = useState("");

  const revenueData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    return months.map((month, index) => {
      const monthNum = index + 1;
      const monthlySum = receipts
        .filter(r => r.year === currentYear && r.month === monthNum)
        .reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount as any) || 0), 0);

      return {
        name: month,
        total: monthlySum,
      };
    });
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      loadData();
      loadReceipts();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand un chat est sélectionné
  useEffect(() => {
    if (!selectedChat || !currentUserId || activeTab !== "messages" || !messages.length) return;

    const markMessagesAsReadLocal = async () => {
      // Trouver tous les messages non lus de ce contact (reçus par l'utilisateur actuel)
      const unreadMessages = messages.filter(
        (m) =>
          m.sender_id === selectedChat.user_id &&
          m.receiver_id === currentUserId &&
          !m.is_read
      );

      if (unreadMessages.length === 0) return;

      // Marquer tous les messages non lus comme lus
      const messageIds = unreadMessages.map((m) => m.id);
      try {
        // Mettre à jour localement immédiatement pour un effet visuel instantané
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m.id) ? { ...m, is_read: true } : m
          )
        );

        await markMessagesAsRead(messageIds);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsReadLocal();
  }, [selectedChat, currentUserId, messages, activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, "MMMM", { locale: fr });
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      console.log("[SOCKET] Received new message:", msg);
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Show toast if the message is from a different contact than the one currently selected
      if (!selectedChat || selectedChat.user_id !== msg.sender_id) {
        toast({
          title: "Nouveau message",
          description: `Vous avez reçu un message de ${msg.sender_name || 'un contact'}.`,
        });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, selectedChat, toast]);

  useEffect(() => {
    if (activeTab === "messages") {
      loadMessagesOnly();
    }
    if (activeTab === "maintenance") {
      loadMaintenanceOnly();
    }

    // Garder le polling pour la maintenance car non encore en temps réel
    const interval = setInterval(() => {
      if (activeTab === "maintenance" || activeTab === "dashboard") {
        loadMaintenanceOnly();
      }
    }, 10000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab]);

  const loadMessagesOnly = async () => {
    try {
      if (!user) return;
      const messagesData = await getMessages();
      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error reloading messages:", error);
    }
  };

  const loadMaintenanceOnly = async () => {
    try {
      if (!user) return;
      const data = await getOwnerMaintenanceRequests();
      console.log("[MAINTENANCE] Fetched for owner:", data);
      if (data) {
        setMaintenanceRequests(data);
      }
    } catch (error) {
      console.error("Error reloading maintenance:", error);
    }
  };

  const loadData = async () => {
    try {
      if (!user) return;

      setCurrentUserId(user.id);

      // Charger toutes les propriétés du propriétaire
      const propsData = await getOwnerProperties();
      const transformedProps = (propsData || []).map((p: any) => transformProperty(p));
      setProperties(transformedProps);

      // Extraire les unités
      const allUnits = transformedProps.flatMap((p: any) =>
        (p.property_units || []).map((unit: any) => ({
          ...unit,
          property_id: unit.property_id || p.id,
          properties: unit.properties || p,
        }))
      );
      setUnits(allUnits);

      // Charger les locataires
      const tenantsData = await getOwnerTenants();
      setTenants(tenantsData || []);

      // Charger les messages
      const messagesData = await getMessages();
      setMessages(messagesData || []);

      // Charger les maintenances
      const maintenanceData = await getOwnerMaintenanceRequests();
      setMaintenanceRequests(maintenanceData || []);

      // Stats
      const occupied = allUnits.filter((u: any) => !u.is_available).length;
      setStats({
        totalProperties: (propsData || []).length,
        occupiedUnits: occupied,
        activeTenants: (tenantsData || []).filter((t: any) => t.status === 'active').length || 0,
      });

      // Charger le profil pour vérifier la signature
      const profileData = await getOwnerProfile();
      setOwnerProfile(profileData);

    } catch (error: any) {
      toast({
        title: "Information",
        description: "Une erreur est survenue lors du chargement des données.",
        variant: "destructive",
      });
    }
  };

  const loadReceipts = async () => {
    try {
      const data = await getOwnerReceipts();
      setReceipts(data);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) {
      return;
    }

    try {
      await deleteTenant(tenantId);
      toast({
        title: "Locataire supprimé",
        description: "Le locataire a été supprimé avec succès.",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Action impossible",
        description: "La suppression du locataire a échoué.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      await deleteMessage(messageId);

      // Rafraîchir la liste des messages
      loadMessagesOnly();

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Action impossible",
        description: "Le message n'a pas pu être supprimé.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ? Toutes les unités et données associées seront définitivement supprimées.")) {
      return;
    }

    try {
      await deleteProperty(propertyId);
      toast({
        title: "Bien supprimé",
        description: "Le bien a été supprimé avec succès.",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Action impossible",
        description: "La suppression du bien a échoué.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    if (!selectedChat.user_id) {
      toast({
        title: "Compte locataire requis",
        description: "Ce locataire n'a pas encore de compte connecté pour recevoir des messages.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage({
        receiver_id: selectedChat.user_id,
        message: newMessage
      });

      setNewMessage("");
      loadMessagesOnly();
      // Note: La notification est créée automatiquement par le backend

    } catch (error: any) {
      toast({
        title: "Échec de l'envoi",
        description: "Le message n'a pas pu être envoyé.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'F CFA');
  };

  const renderSidebarContent = (isMobile = false) => {
    const showLabels = isMobile || !isSidebarCollapsed;
    const itemAlignment = isMobile ? 'justify-start' : (isSidebarCollapsed ? 'justify-center border-r-0' : 'justify-start');

    return (
      <>
        <button
          onClick={() => {
            navigate("/");
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={`flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity overflow-hidden ${isMobile ? 'justify-start' : (isSidebarCollapsed ? 'justify-center' : 'justify-start')}`}
        >
          <Home className="h-6 w-6 shrink-0 text-primary" />
          {showLabels && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              Samalocation
            </span>
          )}
        </button>

        <nav className="space-y-2">
          {[
            { id: "dashboard", label: "Tableau de bord", icon: TrendingUp },
            { id: "properties", label: "Mes biens", icon: Building2 },
            { id: "tenants", label: "Locataires", icon: Users },
            { id: "management", label: "Gérance", icon: PieChart },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
            { id: "messages", label: "Messages", icon: MessageSquare },
            { id: "settings", label: "Paramètres", icon: Settings },
          ].map((item) => {
            const unreadCount =
              item.id === "messages"
                ? messages.filter(
                  (msg) => msg.receiver_id === user?.id && !msg.is_read
                ).length
                : item.id === "maintenance"
                  ? maintenanceRequests.filter(
                    (req) => req.status === 'pending'
                  ).length
                  : 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative group/nav ${activeTab === item.id
                  ? "bg-primary text-white"
                  : "hover:bg-secondary text-muted-foreground"
                  } ${itemAlignment}`}
                title={!showLabels ? item.label : ""}
              >
                <div
                  className={`flex items-center gap-3 w-full ${isMobile
                    ? "justify-start"
                    : isSidebarCollapsed
                      ? "justify-center"
                      : "justify-start"
                    }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0`} />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </div>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className={`${!showLabels
                      ? "absolute -top-1 -right-1 h-4 min-w-[16px] text-[10px]"
                      : "h-5 min-w-[20px] text-xs"
                      } flex items-center justify-center px-1.5`}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          onClick={signOut}
          className={`w-full mt-8 text-muted-foreground transition-all duration-200 ${isMobile
            ? "justify-start px-4"
            : isSidebarCollapsed
              ? "justify-center px-0"
              : "justify-start px-4"
            }`}
          title={!showLabels ? "Déconnexion" : ""}
        >
          <LogOut className={`h-5 w-5 shrink-0 ${!showLabels ? "" : "mr-3"}`} />
          {showLabels && <span>Déconnexion</span>}
        </Button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? "w-16" : "w-64"
          } bg-card border-r shadow-soft hidden md:block transition-all duration-300 relative`}
      >
        <div
          className={`transition-all duration-300 ${isSidebarCollapsed ? "p-3" : "p-6"
            }`}
        >
          {renderSidebarContent(false)}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-card border rounded-full flex items-center justify-center shadow-md hover:bg-secondary transition-colors z-50"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div
          className={`${activeTab === "management" ? "max-w-full" : "max-w-7xl"
            } mx-auto`}
        >
          {/* Top Bar - Notifications & Profile */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden h-10 w-10"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-72 p-0 border-r-0">
                  <div className="p-6 h-full bg-card overflow-y-auto">
                    {renderSidebarContent(true)}
                  </div>
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-bold md:hidden truncate max-w-[150px]">
                {activeTab === "dashboard"
                  ? "Dashboard"
                  : activeTab === "properties"
                    ? "Mes biens"
                    : activeTab === "tenants"
                      ? "Locataires"
                      : activeTab === "management"
                        ? "Gérance"
                        : activeTab === "maintenance"
                          ? "Maintenance"
                          : activeTab === "messages"
                            ? "Messages"
                            : "Paramètres"}
              </h2>
            </div>

            {/* Right Side - Theme, Notifications & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationBell />
              <UserProfile onSettingsClick={() => setActiveTab("settings")} />
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {ownerProfile && !ownerProfile?.signature_url && (
                <Alert className="bg-primary/5 border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                  <PenTool className="h-5 w-5 text-primary" />
                  <AlertTitle className="font-bold">Configuration incomplète</AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span>
                      Terminez la configuration de votre compte en intégrant une signature électronique pour vos reçus.
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("settings")}
                      className="shrink-0 gap-2"
                    >
                      Scanner ma signature <ArrowRight className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    Tableau de bord
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-muted-foreground">
                      Bienvenue sur votre espace propriétaire
                    </p>
                    {user?.customId && (
                      <Badge
                        variant="outline"
                        className="text-primary font-mono font-bold"
                      >
                        ID: {user.customId}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="gradient-accent text-white w-full sm:w-auto"
                    onClick={() => setAddPropertyOpen(true)}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter un bien
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Biens totaux
                        </p>
                        <p className="text-2xl font-bold">
                          {stats.totalProperties}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Unités occupées
                        </p>
                        <p className="text-2xl font-bold">
                          {stats.occupiedUnits}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Locataires actifs
                        </p>
                        <p className="text-2xl font-bold">
                          {stats.activeTenants}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <Card className="lg:col-span-2 shadow-soft">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">
                      Croissance des Revenus ({new Date().getFullYear()})
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorTotal"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--muted))"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 12,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value: number) =>
                              `${(value / 1000).toFixed(0)}k`
                            }
                            tick={{
                              fontSize: 12,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            formatter={(value: any) => [
                              formatCurrency(Number(value)),
                              "Revenus",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Table Stats */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      Détails Mensuels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto px-6 pb-6">
                      <Table>
                        <TableHeader className="bg-muted/50 sticky top-0">
                          <TableRow>
                            <TableHead className="py-2">Mois</TableHead>
                            <TableHead className="text-right py-2">
                              Montant
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData
                            .slice()
                            .reverse()
                            .filter((d) => d.total > 0)
                            .map((data) => (
                              <TableRow key={data.name}>
                                <TableCell className="font-medium py-2">
                                  {data.name}
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  {formatCurrency(data.total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          {revenueData.every((d) => d.total === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                className="text-center py-8 text-muted-foreground italic"
                              >
                                Aucun revenu enregistré
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === "properties" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Mes biens</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {properties.length} bien
                    {properties.length > 1 ? "s" : ""} enregistré
                    {properties.length > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  onClick={() => setAddPropertyOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un bien
                </Button>
              </div>

              {properties.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucun bien enregistré
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par ajouter votre premier bien immobilier
                      (maison, garage, appartement, studio, chambre ou locale)
                    </p>
                    <Button
                      onClick={() => setAddPropertyOpen(true)}
                      className="gradient-accent text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter mon premier bien
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => {
                    const photoUrl =
                      property.photos && property.photos.length > 0
                        ? property.photos[0]
                        : property.photo_url;

                    return (
                      <Card
                        key={property.id}
                        className="shadow-soft hover:shadow-medium transition-shadow overflow-hidden"
                      >
                        {photoUrl && (
                          <div className="h-48 overflow-hidden relative group">
                            <img
                              src={photoUrl}
                              alt={property.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {property.photos && property.photos.length > 1 && (
                              <Badge className="absolute top-2 right-2 bg-black/60 text-white">
                                +{property.photos.length - 1} photos
                              </Badge>
                            )}
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{property.name}</span>
                            <Badge>{property.property_type}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {property.address}
                          </p>
                          {property.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {property.description}
                            </p>
                          )}
                          {/* Afficher le numéro du propriétaire */}
                          {(() => {
                            const ownerProfile = property.owner_profiles
                              ? Array.isArray(property.owner_profiles)
                                ? property.owner_profiles[0]
                                : property.owner_profiles
                              : null;
                            const ownerPhone =
                              ownerProfile?.contact_phone || ownerProfile?.phone;
                            return ownerPhone ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Phone className="h-4 w-4" />
                                <span>{ownerPhone}</span>
                              </div>
                            ) : null;
                          })()}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Unités totales:</span>
                              <span className="font-semibold">
                                {property.property_units?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Disponibles:</span>
                              <span className="font-semibold text-green-600">
                                {property.property_units?.filter(
                                  (u) => u.is_available
                                ).length || 0}
                              </span>
                            </div>
                            {property.property_type === "maison" &&
                              property.property_units &&
                              property.property_units.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Types d'unités :
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {Array.from(
                                      new Set(
                                        property.property_units.map(
                                          (u) => u.unit_type
                                        )
                                      )
                                    ).map((type) => {
                                      const count =
                                        property.property_units.filter(
                                          (u) => u.unit_type === type
                                        ).length;
                                      return (
                                        <Badge
                                          key={type}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {count} {type}
                                          {count > 1 ? "s" : ""}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                              {property.is_published ? (
                                <Badge variant="default" className="bg-green-600">
                                  Publié
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800"
                                >
                                  Brouillon
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={property.is_published ? "outline" : "default"}
                              onClick={async () => {
                                try {
                                  await togglePropertyPublication(property.id);

                                  toast({
                                    title: property.is_published
                                      ? "Bien dépublié"
                                      : "Bien publié",
                                    description: property.is_published
                                      ? "Le bien n'est plus visible publiquement"
                                      : "Le bien est maintenant visible par les locataires",
                                  });

                                  await loadData();
                                } catch (error) {
                                  toast({
                                    title: "Erreur",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              {property.is_published ? "Dépublier" : "Publier"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedPropertyForEdit(property);
                                setEditPropertyOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteProperty(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Locataires</h2>
                  <p className="text-sm text-muted-foreground">
                    {tenants.length} locataire
                    {tenants.length > 1 ? "s" : ""} enregistré
                    {tenants.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Input
                      placeholder="Rechercher un locataire..."
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      className="pl-3 py-1 text-sm h-9"
                    />
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setAssignTenantOpen(true)}
                    disabled={properties.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Affecter un locataire
                  </Button>
                </div>
              </div>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Liste des locataires</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const filteredTenants = tenants.filter(
                      (t) =>
                        t.full_name
                          .toLowerCase()
                          .includes(tenantSearch.toLowerCase()) ||
                        t.email
                          .toLowerCase()
                          .includes(tenantSearch.toLowerCase()) ||
                        (t.property_name || "")
                          .toLowerCase()
                          .includes(tenantSearch.toLowerCase())
                    );

                    if (filteredTenants.length === 0) {
                      return (
                        <p className="text-center text-muted-foreground py-8">
                          {tenantSearch
                            ? "Aucun locataire ne correspond à votre recherche"
                            : "Aucun locataire enregistré"}
                        </p>
                      );
                    }

                    return (
                      <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                          {filteredTenants.map((tenant) => (
                            <Card
                              key={`mobile-tenant-${tenant.id}`}
                              className="p-4 border shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {tenant.full_name}
                                  </h3>
                                  <p className="text-sm text-primary font-medium">
                                    {tenant.property_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {tenant.unit_number || "Unité"}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    tenant.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {tenant.status === "active"
                                    ? "Actif"
                                    : "Inactif"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div className="bg-muted/30 p-2 rounded">
                                  <span className="text-[10px] text-muted-foreground uppercase block">
                                    Loyer
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(tenant.monthly_rent)}
                                  </span>
                                </div>
                                <div className="bg-muted/30 p-2 rounded">
                                  <span className="text-[10px] text-muted-foreground uppercase block">
                                    Contact
                                  </span>
                                  <span className="truncate block text-xs">
                                    {tenant.phone}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedChat(tenant);
                                    setActiveTab("messages");
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Chat
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedPropertyForReceipt(tenant);
                                    setCreateReceiptOpen(true);
                                  }}
                                >
                                  Reçu
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="px-3"
                                  onClick={() => {
                                    setSelectedTenantForHistory(tenant);
                                    setHistoryDialogOpen(true);
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Bien</TableHead>
                                <TableHead>Loyer mensuel</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                  <TableCell className="font-medium">
                                    {tenant.full_name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div>{tenant.email}</div>
                                      <div className="text-muted-foreground">
                                        {tenant.phone}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{tenant.property_name}</TableCell>
                                  <TableCell>
                                    {formatCurrency(tenant.monthly_rent)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        tenant.status === "active"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {tenant.status === "active"
                                        ? "Actif"
                                        : "Inactif"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedChat(tenant);
                                          setActiveTab("messages");
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPropertyForReceipt(tenant);
                                          setCreateReceiptOpen(true);
                                        }}
                                      >
                                        Reçu
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedTenantForHistory(tenant);
                                          setHistoryDialogOpen(true);
                                        }}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="space-y-6 h-full">
              <h2 className={`text-2xl font-bold ${selectedChat ? "hidden lg:block" : ""}`}>
                Messages
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] lg:h-auto">
                {/* Contacts List */}
                <Card
                  className={`lg:col-span-1 h-full ${selectedChat ? "hidden lg:block" : "block"
                    }`}
                >
                  <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      {(() => {
                        if (!currentUserId) return null;

                        // Créer une liste unique de contacts (locataires + candidats)
                        const contacts = new Map();
                        const lastMessageTime = new Map();

                        // Ajouter les locataires existants
                        tenants.forEach((tenant) => {
                          if (tenant.user_id) {
                            contacts.set(tenant.user_id, {
                              id: tenant.id,
                              user_id: tenant.user_id,
                              full_name: tenant.full_name,
                              email: tenant.email,
                              subtitle: `${tenant.property_name} - ${tenant.unit_number}`,
                              type: "tenant",
                            });
                          }
                        });

                        // Compter les messages non lus par utilisateur
                        const unreadCount = new Map();

                        // Ajouter les personnes qui ont envoyé des messages (candidats)
                        messages.forEach((msg) => {
                          // Identifier l'autre personne dans la conversation
                          const otherUserId =
                            msg.sender_id === currentUserId
                              ? msg.receiver_id
                              : msg.sender_id;

                          if (otherUserId) {
                            // Mettre à jour l'heure du dernier message
                            const msgTime = new Date(msg.created_at).getTime();
                            if (
                              !lastMessageTime.has(otherUserId) ||
                              msgTime > lastMessageTime.get(otherUserId)
                            ) {
                              lastMessageTime.set(otherUserId, msgTime);
                            }

                            // Compter les messages non lus (messages reçus seulement)
                            if (msg.sender_id === otherUserId && !msg.is_read) {
                              unreadCount.set(
                                otherUserId,
                                (unreadCount.get(otherUserId) || 0) + 1
                              );
                            }

                            // Si ce n'est pas déjà un locataire, l'ajouter comme candidat
                            if (!contacts.has(otherUserId)) {
                              contacts.set(otherUserId, {
                                id: `candidate_${otherUserId}`,
                                user_id: otherUserId,
                                full_name:
                                  msg.sender_id === otherUserId
                                    ? msg.sender_name
                                    : msg.receiver_name || "Candidat",
                                email:
                                  msg.sender_id === otherUserId
                                    ? msg.sender_email
                                    : msg.receiver_email || "",
                                subtitle: msg.property_id
                                  ? "Candidature"
                                  : "Message",
                                type: "candidate",
                                unreadCount: 0,
                              });
                            }
                          }
                        });

                        // Ajouter le nombre de messages non lus à chaque contact
                        contacts.forEach((contact, userId) => {
                          contact.unreadCount = unreadCount.get(userId) || 0;
                        });

                        // Trier les contacts par date du dernier message (plus récent en premier)
                        const contactsList = Array.from(contacts.values()).sort(
                          (a, b) => {
                            const timeA = lastMessageTime.get(a.user_id) || 0;
                            const timeB = lastMessageTime.get(b.user_id) || 0;
                            return timeB - timeA;
                          }
                        );

                        return contactsList.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8 px-4">
                            Aucune conversation
                          </p>
                        ) : (
                          contactsList.map((contact) => (
                            <div
                              key={contact.id}
                              className={`p-4 cursor-pointer hover:bg-secondary transition-colors border-b ${selectedChat?.user_id === contact.user_id
                                ? "bg-secondary"
                                : ""
                                }`}
                              onClick={async () => {
                                setSelectedChat(contact);

                                // Marquer les messages de cette conversation comme lus
                                const unreadMessages = messages
                                  .filter(
                                    (msg) =>
                                      msg.sender_id === contact.user_id &&
                                      !msg.is_read
                                  )
                                  .map((msg) => msg.id);

                                if (unreadMessages.length > 0) {
                                  try {
                                    await markMessagesAsRead(unreadMessages);
                                    // Recharger les données pour mettre à jour le compteur
                                    loadData();
                                  } catch (error) {
                                    console.error(
                                      "Error marking messages as read:",
                                      error
                                    );
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {contact.full_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium truncate">
                                      {contact.full_name}
                                    </p>
                                    {contact.unreadCount > 0 && (
                                      <Badge
                                        variant="destructive"
                                        className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                                      >
                                        {contact.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {contact.subtitle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        );
                      })()}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card
                  className={`lg:col-span-2 h-full flex flex-col ${!selectedChat ? "hidden lg:block" : "block"
                    }`}
                >
                  {selectedChat ? (
                    <>
                      <CardHeader className="border-b py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSelectedChat(null)}
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </Button>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {selectedChat.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>{selectedChat.full_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {selectedChat.email}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px] p-4">
                          {(() => {
                            if (!currentUserId) return null;

                            const filteredMessages = messages.filter(
                              (m) =>
                                (m.sender_id === currentUserId ||
                                  m.receiver_id === currentUserId) &&
                                (m.sender_id === selectedChat.user_id ||
                                  m.receiver_id === selectedChat.user_id)
                            );

                            if (filteredMessages.length === 0) {
                              return (
                                <p className="text-center text-muted-foreground py-8">
                                  Aucun message dans cette conversation
                                </p>
                              );
                            }

                            return filteredMessages.map((message) => {
                              // Le message vient du locataire/candidat si sender_id correspond à user_id du contact
                              const isFromContact =
                                message.sender_id === selectedChat.user_id;

                              return (
                                <div
                                  key={message.id}
                                  className={`mb-4 flex group ${isFromContact
                                    ? "justify-start"
                                    : "justify-end"
                                    }`}
                                  onMouseEnter={async () => {
                                    // Marquer le message comme lu automatiquement quand il est visible
                                    if (
                                      isFromContact &&
                                      !message.is_read &&
                                      currentUserId
                                    ) {
                                      try {
                                        await markMessagesAsRead([message.id]);

                                        // Mettre à jour localement pour éviter le rechargement complet
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === message.id
                                              ? { ...m, is_read: true }
                                              : m
                                          )
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Error marking message as read:",
                                          error
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-2 max-w-[70%]">
                                    <div
                                      className={`rounded-lg p-3 ${isFromContact
                                        ? "bg-secondary"
                                        : "bg-primary text-white"
                                        }`}
                                    >
                                      <p className="text-sm">
                                        {message.message}
                                      </p>
                                      <p className="text-xs opacity-70 mt-1">
                                        {new Date(
                                          message.created_at
                                        ).toLocaleString("fr-FR")}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() =>
                                        handleDeleteMessage(message.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          <div ref={messagesEndRef} />
                        </ScrollArea>
                        <div className="p-4 border-t">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Tapez votre message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleSendMessage()
                              }
                            />
                            <Button onClick={handleSendMessage}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center justify-center h-[500px]">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                        <p>Sélectionnez une conversation pour commencer</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Gérance Tab */}
          {activeTab === "management" && (
            <div className="space-y-6">
              <ManagementTable tenants={tenants} receipts={receipts} />
            </div>
          )}

          {/* Maintenance Request Tab */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <OwnerMaintenanceTab />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && <OwnerSettings />}
        </div>
      </main>

      <AssignTenantDialog
        open={assignTenantOpen}
        onOpenChange={setAssignTenantOpen}
        properties={properties}
        units={units}
        onSuccess={loadData}
      />

      <AddPropertyModal
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onSuccess={loadData}
      />

      <EditPropertyModal
        open={editPropertyOpen}
        onOpenChange={setEditPropertyOpen}
        onSuccess={loadData}
        property={selectedPropertyForEdit}
      />

      {selectedPropertyForReceipt && (
        <CreateReceiptDialog
          open={createReceiptOpen}
          onOpenChange={setCreateReceiptOpen}
          propertyId={selectedPropertyForReceipt.property_id}
          propertyName={selectedPropertyForReceipt.property_name || "Propriété"}
          tenantId={selectedPropertyForReceipt.user_id}
          tenantName={selectedPropertyForReceipt.full_name}
          monthlyRent={selectedPropertyForReceipt.monthly_rent}
          onSuccess={() => {
            loadReceipts();
            setCreateReceiptOpen(false);
          }}
        />
      )}

      <EditTenantDialog
        open={editTenantOpen}
        onOpenChange={setEditTenantOpen}
        tenant={editingTenant}
        onSuccess={loadData}
      />

      <TenantHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        tenant={selectedTenantForHistory}
        receipts={receipts}
      />
    </div>
  );
};

export default DashboardProprietaire;
