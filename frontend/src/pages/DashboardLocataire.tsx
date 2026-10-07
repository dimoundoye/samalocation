import { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Search, Settings, LogOut, MessageSquare, FileText, Menu, Send, Download, Eye, ExternalLink, TrendingUp, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Wrench, HelpCircle, ChevronLeft, ChevronRight, Shield, MapPin, Loader2, Building2, Info, Calendar, Copy } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfile } from "@/components/UserProfile";
import DossierDigitalTab from "@/components/tenant/DossierDigitalTab";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { ReportOwnerDialog } from "@/components/tenant/ReportOwnerDialog";
import { MaintenanceTab } from "@/components/tenant/MaintenanceTab";
import { TenantContractsTab } from "@/components/tenant/TenantContractsTab";
import { TenantDocumentationTab } from "@/components/tenant/TenantDocumentationTab";
import { TenantProfileSettings } from "@/components/tenant/TenantProfileSettings";
import TenantLeasesTab from "@/components/tenant/TenantLeasesTab";
import { LeaseDetailModal } from "@/components/tenant/LeaseDetailModal";
import { ReceiptPreviewModal } from "@/components/receipts/ReceiptPreviewModal";
import { format } from "date-fns";
import { formatConversationTime, formatMessageDay, startsNewDay } from "@/lib/messageDates";
import { COMPACT_LAYOUT_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { fr, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantMe, getReceipts, getTenantReceipts, downloadReceipt, openReceiptInNewTab, getMessages, sendMessage, deleteMessage, updateTenantProfile, markMessagesAsRead, getNotifications, markNotificationAsRead } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSocket } from "@/contexts/SocketContext";
import { useTranslation } from "react-i18next";
import { getMyDossier, shareDossier } from "@/api/dossier";

const DashboardLocataire = () => {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(urlTab || "dashboard");

  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    if (paymentStatus === "success") {
      toast({
        title: "Paiement réussi !",
        description: "Votre loyer a été payé avec succès via PayDunya. Un reçu a été généré.",
        variant: "default",
      });
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === "cancel") {
      toast({
        title: "Paiement annulé",
        description: "Le paiement de votre loyer a été annulé.",
        variant: "destructive",
      });
      setSearchParams({}, { replace: true });
    }
  }, [paymentStatus, setSearchParams, toast]);
  // Tablette (< 1024 px) : barre latérale repliée par défaut, et superposée au contenu quand on l'ouvre
  const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_QUERY);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.matchMedia(COMPACT_LAYOUT_QUERY).matches);
  const sidebarOverlay = isCompactLayout && !isSidebarCollapsed;
  useEffect(() => {
    if (isCompactLayout) setIsSidebarCollapsed(true);
  }, [isCompactLayout]);
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    description: "",
    onConfirm: () => { },
  });

  const dateLocale = i18n.language === 'en' ? enUS : fr;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptMonthFilter, setReceiptMonthFilter] = useState<string>("all");
  const [receiptYearFilter, setReceiptYearFilter] = useState<string>("all");
  const [tenantReasonModalOpen, setTenantReasonModalOpen] = useState(false);

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    receipts.forEach((r: any) => {
      if (r.year) yearsSet.add(r.year);
      else if (r.created_at) yearsSet.add(new Date(r.created_at).getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r: any) => {
      const rYear = r.year || (r.created_at ? new Date(r.created_at).getFullYear() : null);
      const rMonth = r.month || (r.created_at ? new Date(r.created_at).getMonth() + 1 : null);

      if (receiptYearFilter !== "all" && rYear !== parseInt(receiptYearFilter)) return false;
      if (receiptMonthFilter !== "all" && rMonth !== parseInt(receiptMonthFilter)) return false;

      return true;
    });
  }, [receipts, receiptYearFilter, receiptMonthFilter]);
  const [selectedTenantReasonReceipt, setSelectedTenantReasonReceipt] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ownerUserProfile, setOwnerUserProfile] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [sharingDossier, setSharingDossier] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadTenantData();
    loadReceipts();
    loadMessages(); // Charger les messages au montage pour le badge de la barre latérale
    loadNotifications(); // Charger les notifications au montage
  }, []); // Charge une seule fois au montage

  const { socket, connected } = useSocket();

  useEffect(() => {
    // Si on se reconnecte (ou première connexion) et qu'on est sur l'onglet messages, rafraîchir pour ne rien rater
    if (connected && activeTab === "messages") {
      loadMessages();
    }
  }, [connected, activeTab, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Show toast if the message is from a different contact than the one currently selected
      if (!selectedChat || selectedChat.user_id !== msg.sender_id) {
        toast({
          title: t('dashboard.common.new_message'),
          description: `${t('dashboard.common.from')} ${msg.sender_name || t('tenant.owner')}.`,
        });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, selectedChat, toast, t]);

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else {
      setActiveTab("dashboard");
    }
  }, [urlTab]);

  useEffect(() => {
    if (activeTab === "messages") {
      loadMessages();
    }
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand un chat est sélectionné
  useEffect(() => {
    if (!selectedChat || !user?.id || activeTab !== "messages" || !messages.length) return;

    const markMessagesAsReadLocal = async () => {
      // Trouver tous les messages non lus de ce contact (reçus par l'utilisateur actuel)
      const unreadMessages = messages.filter(
        (m) =>
          m.sender_id === selectedChat.user_id &&
          m.receiver_id === user.id &&
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
  }, [selectedChat, user?.id, messages, activeTab]);

  // Marquer les notifications de reçus comme lues quand on va sur l'onglet documents
  useEffect(() => {
    if (activeTab === "contracts" && notifications.some(n => (n.type === "receipt" || n.type === "contract_created") && !n.is_read)) {
      const clearContractNotifications = async () => {
        try {
          const relevantNotifs = notifications.filter(n => (n.type === "receipt" || n.type === "contract_created") && !n.is_read);
          for (const notif of relevantNotifs) {
            await markNotificationAsRead(notif.id);
          }
          // Recharger les notifications pour mettre à jour le badge
          loadNotifications();
        } catch (error) {
          console.error("Error clearing contract notifications:", error);
        }
      };
      clearContractNotifications();
    }
  }, [activeTab, notifications]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadTenantData = async () => {
    try {
      const data = await getTenantMe();
      setTenantProfile(data.profile);
      const activeLeases = data.leases || (data.tenant ? [data.tenant] : []);
      setLeases(activeLeases);
      setTenantData(activeLeases.length > 0 ? activeLeases[0] : null);
      setOwnerProfile(data.owner);
      setOwnerUserProfile(data.ownerUserProfile);
    } catch (error) {
      console.error("Error loading tenant data:", error);
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: "destructive",
      });
    }
  };

  const loadReceipts = async () => {
    try {
      const data = await getTenantReceipts();
      setReceipts(data);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const formatCurrencyLocal = (amount: number, currency?: string) => {
    const finalCurrency = currency || ownerProfile?.currency || 'XOF';
    return formatCurrency(amount, finalCurrency);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: dateLocale });
  };

  const handleDeleteMessage = (messageId: string) => {
    setConfirmConfig({
      title: "Supprimer le message",
      description: t('tenant.delete_confirm'),
      onConfirm: async () => {
        try {
          await deleteMessage(messageId);
          loadMessages();
          toast({
            title: t('tenant.delete_success'),
          });
        } catch (error: any) {
          toast({
            title: t('common.error'),
            variant: "destructive",
          });
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      let ownerId: string | null = null;
      let propertyId: string | null = null;

      if (selectedChat && selectedChat.user_id) {
        ownerId = selectedChat.user_id;

        const conversationMessages = messages.filter(
          (m) => (m.sender_id === ownerId || m.receiver_id === ownerId)
        );
        if (conversationMessages.length > 0) {
          propertyId = conversationMessages[0].property_id;
        }
      } else if (tenantData) {
        ownerId = tenantData.owner_id;
        propertyId = tenantData.property_id;
      }

      if (!ownerId) {
        toast({
          title: "Information manquante",
          description: "Le destinataire du message n'a pas pu être déterminé.",
          variant: "destructive",
        });
        return;
      }

      const sentMsg = await sendMessage({
        receiver_id: ownerId,
        message: newMessage,
        property_id: propertyId
      });

      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message from tenant:", error);
      toast({
        title: t('common.error'),
        variant: "destructive",
      });
    }
  };
  const handleShareDossierInChat = async () => {
    if (!selectedChat?.user_id) return;

    try {
      setSharingDossier(true);

      // Vérifier si le dossier existe
      const dossier = await getMyDossier();
      if (!dossier) {
        toast({
          title: "Dossier incomplet",
          description: "Veuillez d'abord remplir votre dossier digital.",
          variant: "default",
        });
        navigate("/tenant-dashboard/dossier");
        return;
      }

      // Trouver le property_id associé à cette conversation si possible
      const conversationMessages = messages.filter(
        (m) => (m.sender_id === selectedChat.user_id || m.receiver_id === selectedChat.user_id)
      );
      
      // On cherche un message qui contient un property_id
      const messageWithProperty = conversationMessages.find(m => m.property_id);
      const propertyId = messageWithProperty ? messageWithProperty.property_id : null;

      // On partage soit via le bien, soit directement via l'ID du destinataire
      await shareDossier(propertyId, selectedChat.user_id);

      // Envoyer un message automatique pour prévenir le propriétaire
      await sendMessage({
        receiver_id: selectedChat.user_id,
        message: "Je viens de vous partager mon dossier digital complet via SamaLocation.",
        property_id: propertyId
      });

      toast({
        title: "Dossier partagé",
        description: "Le propriétaire a maintenant accès à votre dossier.",
      });

      loadMessages();
    } catch (error) {
      console.error("Error sharing dossier in chat:", error);
      toast({
        title: "Erreur",
        description: "Impossible de partager le dossier.",
        variant: "destructive",
      });
    } finally {
      setSharingDossier(false);
    }
  };

  const [selectedPreviewReceipt, setSelectedPreviewReceipt] = useState<{ id: string; number?: string; date?: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handlePreviewReceipt = async (receipt: any) => {
    try {
      await openReceiptInNewTab(receipt.id);
    } catch (error) {
      console.error("Error opening receipt in new tab:", error);
      toast({
        title: t('common.error'),
        description: "Impossible d'ouvrir le reçu.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReceipt = async (receiptId: string) => {
    try {
      const receipt = receipts.find(r => r.id === receiptId);
      if (!receipt) throw new Error("Reçu non trouvé");
      await downloadReceipt(receipt.id, receipt.receipt_number, receipt.payment_date);
      toast({
        title: t('common.success'),
        description: "PDF downloaded",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: t('common.error'),
        variant: "destructive",
      });
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity overflow-hidden"
        >
          <img src="/logo-sl.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              Samalocation
            </span>
          )}
        </button>
      </div>

      <nav className="space-y-2">
        {[
          { id: "back-to-site", label: "Retour au site", icon: Home },
          { id: "dashboard", label: t('dashboard.sidebar.home'), icon: TrendingUp },
          { id: "dossier", label: "Mon Dossier", icon: Shield },
          { id: "logements", label: "Mes Logements", icon: Building2 },
          { id: "search", label: t('dashboard.sidebar.search'), icon: Search },
          { id: "messages", label: t('dashboard.sidebar.messages'), icon: MessageSquare },
          { id: "contracts", label: t('dashboard.sidebar.contracts'), icon: FileText },
          { id: "maintenance", label: t('dashboard.sidebar.maintenance'), icon: Wrench },
          { id: "settings", label: t('dashboard.sidebar.settings'), icon: Settings },
          { id: "guide", label: "Guide", icon: HelpCircle },
        ].map((item) => {
          // Calculer le nombre de messages non lus
          const unreadCount = item.id === "messages"
            ? messages.filter(msg => msg.receiver_id === user?.id && !msg.is_read).length
            : item.id === "contracts"
              ? notifications.filter(n => (n.type === "receipt" || n.type === "contract_created") && !n.is_read).length
              : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "back-to-site") {
                  navigate("/");
                } else if (item.id === "search") {
                  navigate("/search");
                } else {
                  navigate(`/tenant-dashboard/${item.id}`);
                  setMobileMenuOpen(false);
                }
                if (isCompactLayout) setIsSidebarCollapsed(true);
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                ? "bg-primary text-white"
                : "hover:bg-secondary text-muted-foreground"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
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
        className={`w-full mt-8 justify-start text-muted-foreground ${isSidebarCollapsed ? "px-2" : ""}`}
      >
        <LogOut className={`${isSidebarCollapsed ? "" : "mr-3"} h-5 w-5 shrink-0`} />
        {!isSidebarCollapsed && <span>{t('dashboard.sidebar.logout')}</span>}
      </Button>
    </>
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      {/* Tablette : la barre ouverte passe par-dessus le contenu ; cet espace garde la place de la barre repliée */}
      {sidebarOverlay && (
        <>
          <div className="hidden md:block w-20 shrink-0" aria-hidden />
          <div className="hidden md:block fixed inset-0 z-30 bg-black/30" onClick={() => setIsSidebarCollapsed(true)} aria-hidden />
        </>
      )}
      <aside
        className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-card border-r shadow-soft hidden md:block h-screen transition-all duration-300 ease-in-out ${sidebarOverlay ? "fixed left-0 top-0 z-40 shadow-2xl" : "sticky top-0 z-20"}`}
      >
        <div className={`p-4 h-full flex flex-col ${isSidebarCollapsed ? "items-center" : ""}`}>
          <div className="flex-1 overflow-y-auto scrollbar-none w-full">
            {sidebarContent}
          </div>
        </div>

        {/* Floating Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-8 h-8 w-8 rounded-full border shadow-md bg-background hover:bg-secondary z-50 hidden md:flex"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-6">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setActiveTab("guide")}
                title="Guide d'utilisation"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <NotificationBell />
              <UserProfile />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 pb-32 md:p-8 md:pb-24 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('dashboard.sidebar.home')}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-muted-foreground text-sm">
                        {t('dashboard.common.welcome')}, <span className="font-semibold text-foreground">{tenantProfile?.full_name || tenantProfile?.email || "Locataire"}</span>
                      </p>
                      {user?.customId && (
                        // Identifiant à communiquer au propriétaire pour qu'il retrouve le compte lors de l'affectation
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(user.customId!);
                              toast({ title: t('tenant.id_copied'), description: t('tenant.id_copied_desc') });
                            } catch {
                              toast({ title: t('common.error'), description: t('tenant.id_copy_error'), variant: "destructive" });
                            }
                          }}
                          title={t('tenant.copy_id')}
                          aria-label={t('tenant.copy_id')}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[11px] text-primary hover:bg-primary/10 transition-colors"
                        >
                          {t('common.id')} : {user.customId}
                          <Copy className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-11 sm:h-9 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-all text-xs"
                    onClick={() => {
                      const ownerId = tenantData?.owner_id || ownerProfile?.id;
                      if (ownerId) {
                        setCurrentOwnerId(ownerId);
                        setReportDialogOpen(true);
                      } else {
                        toast({
                          title: t('tenant.no_owner_title'),
                          description: t('tenant.no_owner_error'),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t('tenant.report_owner')}
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <Card className="shadow-soft hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Mes reçus
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-foreground">{receipts.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Rental(s) */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold px-1">{t('tenant.my_rentals')}</h2>
                  {leases.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {leases.map((lease) => (
                        <Card
                          key={lease.id}
                          className="group shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative h-full flex flex-col cursor-pointer"
                          onClick={() => setSelectedLease(lease)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center mb-2">
                              <Badge
                                variant={lease.status === "active" ? "default" : "secondary"}
                                className="text-[10px] h-5 px-2"
                              >
                                {lease.status === "active" ? t('common.active') : lease.status}
                              </Badge>
                              <div className="flex items-center gap-1 text-[11px] font-medium text-primary/75 group-hover:text-primary transition-colors">
                                <span className="hidden sm:inline">Détails</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                            <CardTitle className="text-sm font-bold leading-tight line-clamp-1">
                              {lease.property_name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col gap-3">
                            {lease.photo_url && (
                              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                <img
                                  src={lease.photo_url}
                                  alt="Location"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                            )}
                            <p className="text-muted-foreground text-[11px] flex items-center gap-1.5 bg-secondary/30 w-full px-2 py-1 rounded-md line-clamp-1">
                              <MapPin className="h-3 w-3 shrink-0" /> {lease.property_address}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">{t('tenant.rent')}</p>
                                <p className="text-xs font-bold text-primary">
                                  {formatCurrencyLocal(lease.monthly_rent, lease.ownerProfile?.currency)}
                                </p>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">{t('tenant.unit')}</p>
                                <p className="text-xs font-semibold">
                                  {lease.unit_number || "Villa"}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Arrivée</p>
                                <p className="text-[11px] font-medium">
                                  {lease.move_in_date ? formatDate(lease.move_in_date) : t('tenant.not_defined')}
                                </p>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Propriétaire</p>
                                <p className="text-[11px] font-medium truncate">
                                  {lease.owner_name || "N/A"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="shadow-soft border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Home className="h-12 w-12 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{t('dashboard.common.no_active_lease')}</h3>
                            <p className="text-muted-foreground mb-4">
                              {t('tenant.no_lease_desc')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

              </div>
            )}

            {/* Dossier Tab */}
            {activeTab === "dossier" && (
              <DossierDigitalTab />
            )}

            {/* Logements Tab */}
            {activeTab === "logements" && (
              <TenantLeasesTab 
                currency={ownerProfile?.currency || 'XOF'}
              />
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="space-y-6 h-full">
                <h2 className={`text-2xl font-bold ${selectedChat ? 'hidden lg:block' : ''}`}>{t('dashboard.sidebar.messages')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] lg:h-auto">
                  {/* Liste des Conversations */}
                  <Card className={`lg:col-span-1 h-full ${selectedChat ? 'hidden lg:block' : 'block'}`}>
                    <CardHeader>
                      <CardTitle>{t('dashboard.common.conversations')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        {(() => {
                          if (!user?.id) return null;

                          // Créer une liste unique de propriétaires avec qui il y a des messages
                          const contacts = new Map();
                          const lastMessageTime = new Map();

                          // Compter les messages non lus par propriétaire
                          const unreadCount = new Map();

                          // Ajouter les propriétaires depuis les messages
                          messages.forEach((msg) => {
                            // Identifier le propriétaire dans la conversation
                            const isSender = msg.sender_id === user.id;
                            const ownerUserId = isSender ? msg.receiver_id : msg.sender_id;
                            const ownerName = isSender ? msg.receiver_name : msg.sender_name;
                            const ownerEmail = isSender ? msg.receiver_email : msg.sender_email;

                            if (ownerUserId && ownerUserId !== user.id) {
                              // Mettre à jour l'heure du dernier message
                              const msgTime = new Date(msg.created_at).getTime();
                              if (!lastMessageTime.has(ownerUserId) || msgTime > lastMessageTime.get(ownerUserId)) {
                                lastMessageTime.set(ownerUserId, msgTime);
                              }

                              // Compter les messages non lus (messages reçus du propriétaire)
                              if (msg.sender_id === ownerUserId && !msg.is_read) {
                                unreadCount.set(ownerUserId, (unreadCount.get(ownerUserId) || 0) + 1);
                              }

                              // Si ce propriétaire n'est pas déjà dans la liste, l'ajouter
                              if (!contacts.has(ownerUserId)) {
                                contacts.set(ownerUserId, {
                                  id: `owner_${ownerUserId}`,
                                  user_id: ownerUserId,
                                  full_name: ownerName || t('tenant.owner'),
                                  email: ownerEmail || "",
                                  subtitle: t('tenant.owner'),
                                  type: "owner",
                                  unreadCount: 0,
                                });
                              }
                            }
                          });

                          // Ajouter tous les propriétaires des baux actifs même s'il n'y a pas encore de messages
                          leases.forEach((lease) => {
                            if (lease.owner_id && !contacts.has(lease.owner_id)) {
                              contacts.set(lease.owner_id, {
                                id: `owner_${lease.owner_id}`,
                                user_id: lease.owner_id,
                                full_name: lease.owner_name || t('tenant.owner'),
                                email: lease.owner_email || "",
                                subtitle: lease.property_name || t('tenant.owner'),
                                type: "owner",
                                unreadCount: 0,
                              });
                            }
                          });

                          // Ajouter le nombre de messages non lus à chaque contact
                          contacts.forEach((contact, userId) => {
                            contact.unreadCount = unreadCount.get(userId) || 0;
                            contact.lastTime = lastMessageTime.get(userId) || 0;
                          });

                          // Trier les contacts par date du dernier message (plus récent en premier)
                          const contactsList = Array.from(contacts.values()).sort((a, b) => {
                            const timeA = lastMessageTime.get(a.user_id) || 0;
                            const timeB = lastMessageTime.get(b.user_id) || 0;
                            return timeB - timeA;
                          });

                          return contactsList.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 px-4">{t('dashboard.common.no_conversations')}</p>
                          ) : (
                            contactsList.map((contact) => (
                              <div
                                key={contact.id}
                                className={`p-4 cursor-pointer hover:bg-secondary transition-colors border-b ${selectedChat?.user_id === contact.user_id ? "bg-secondary" : ""
                                  }`}
                                onClick={async () => {
                                  setSelectedChat(contact);
                                  setCurrentOwnerId(contact.user_id);

                                  // Marquer les messages de cette conversation comme lus
                                  const unreadMessages = messages
                                    .filter(msg => msg.sender_id === contact.user_id && !msg.is_read)
                                    .map(msg => msg.id);

                                  if (unreadMessages.length > 0) {
                                    try {
                                      await markMessagesAsRead(unreadMessages);
                                      // Mettre à jour localement immédiatement
                                      setMessages(prev => prev.map(m =>
                                        unreadMessages.includes(m.id) ? { ...m, is_read: true } : m
                                      ));
                                      // Facultatif: recharger pour être sûr de la cohérence avec le serveur
                                      loadMessages();
                                    } catch (error) {
                                      console.error("Error marking messages as read:", error);
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{contact.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium truncate">{contact.full_name}</p>
                                      {contact.lastTime > 0 && (
                                        <span className={`text-xs shrink-0 ${contact.unreadCount > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                          {formatConversationTime(new Date(contact.lastTime), dateLocale, t)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm text-muted-foreground truncate">
                                        {contact.subtitle}
                                      </p>
                                      {contact.unreadCount > 0 && (
                                        <Badge
                                          variant="destructive"
                                          className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shrink-0"
                                        >
                                          {contact.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          );
                        })()}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Zone de Chat */}
                  <Card className={`lg:col-span-2 h-full flex flex-col ${!selectedChat ? 'hidden lg:block' : 'block'}`}>
                    {selectedChat ? (
                      <>
                        <CardHeader className="border-b py-3 px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                <AvatarFallback>{selectedChat.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <CardTitle className="truncate">{selectedChat.full_name}</CardTitle>
                                <p className="text-xs text-muted-foreground truncate">
                                  {selectedChat.subtitle || selectedChat.email}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleShareDossierInChat}
                              disabled={sharingDossier}
                              className="h-9 px-4 border-primary text-primary hover:bg-primary/5 flex items-center gap-2 font-semibold shadow-sm shrink-0"
                            >
                              {sharingDossier ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                              <span>Partager mon dossier</span>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[400px] p-4">
                            {(() => {
                              if (!user?.id) return null;

                              const filteredMessages = messages.filter(
                                (m) =>
                                  (m.sender_id === user.id || m.receiver_id === user.id) &&
                                  (m.sender_id === selectedChat.user_id || m.receiver_id === selectedChat.user_id)
                              );

                              if (filteredMessages.length === 0) {
                                return (
                                  <p className="text-center text-muted-foreground py-8">
                                    {t('dashboard.common.no_messages')}
                                  </p>
                                );
                              }
                              return filteredMessages.map((message, index) => {
                                // Le message vient du propriétaire si sender_id correspond à user_id du contact
                                const isFromOwner = message.sender_id === selectedChat.user_id;
                                const showDay = startsNewDay(message.created_at, filteredMessages[index - 1]?.created_at);

                                return (
                                  <Fragment key={message.id}>
                                  {showDay && (
                                    <div className="flex justify-center my-3">
                                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {formatMessageDay(new Date(message.created_at), dateLocale, t)}
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    className={`mb-4 flex group ${isFromOwner ? "justify-start" : "justify-end"
                                      }`}
                                    onMouseEnter={async () => {
                                      // Marquer le message comme lu automatiquement quand il est visible
                                      if (isFromOwner && !message.is_read && user.id) {
                                        // Mises à jour locales effectuées lors du survol ou sélection
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === message.id ? { ...m, is_read: true } : m
                                          )
                                        );
                                      }
                                    }}
                                  >
                                    <div className="flex items-start gap-2 max-w-[70%]">
                                      <div
                                        className={`rounded-lg p-3 ${isFromOwner
                                          ? "bg-secondary"
                                          : "bg-primary text-white"
                                          }`}
                                      >
                                        <p className="text-sm">{message.message}</p>
                                        <p className="text-[10px] opacity-70 mt-1">
                                          {format(new Date(message.created_at), 'p', { locale: dateLocale })}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteMessage(message.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                  </Fragment>
                                );
                              });
                            })()}
                            <div ref={messagesEndRef} />
                          </ScrollArea>
                          <div className="p-4 border-t">
                            <div className="flex gap-2">
                              <Input
                                placeholder={t('dashboard.common.type_message')}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
                          <p>{t('dashboard.common.select_chat')}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === "contracts" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('dashboard.sidebar.contracts')}</h2>

                <Tabs defaultValue="receipts" className="w-full">
                  <TabsList className="flex bg-muted p-1 rounded-xl w-full max-w-[280px] shrink-0 mb-6 border border-border/40">
                    <TabsTrigger 
                      value="receipts"
                      className="flex-1 rounded-lg font-bold text-xs h-8 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                    >
                      Mes reçus
                    </TabsTrigger>
                    <TabsTrigger 
                      value="leases"
                      className="flex-1 rounded-lg font-bold text-xs h-8 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                    >
                      Contrats
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="leases" className="space-y-6">
                    <TenantContractsTab 
                      currency={ownerProfile?.currency || 'XOF'}
                    />
                  </TabsContent>

                  <TabsContent value="receipts" className="space-y-6">
                    <Card className="shadow-soft">
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
                        <CardTitle className="text-lg font-bold">{t('dashboard.sidebar.documents')}</CardTitle>

                        {/* Filtre par Date */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>Date :</span>
                          </div>

                          {/* Filtre Mois */}
                          <Select value={receiptMonthFilter} onValueChange={setReceiptMonthFilter}>
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                              <SelectValue placeholder="Tous les mois" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les mois</SelectItem>
                              {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, idx) => (
                                <SelectItem key={idx + 1} value={(idx + 1).toString()}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Filtre Année */}
                          <Select value={receiptYearFilter} onValueChange={setReceiptYearFilter}>
                            <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                              <SelectValue placeholder="Toutes années" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes années</SelectItem>
                              {availableYears.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {(receiptMonthFilter !== "all" || receiptYearFilter !== "all") && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setReceiptMonthFilter("all");
                                setReceiptYearFilter("all");
                              }}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Réinitialiser
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {filteredReceipts.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            {receipts.length === 0 ? t('tenant.no_receipts') : "Aucun reçu ne correspond aux filtres de date sélectionnés."}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {filteredReceipts.map((receipt) => {
                              const monthName = format(new Date(receipt.year, receipt.month - 1), 'MMMM yyyy', { locale: dateLocale });
                              const isCancelled = receipt.status === 'cancelled';
                              return (
                                <div
                                  key={receipt.id}
                                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg transition-colors gap-4 ${
                                    isCancelled ? 'bg-red-50/50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 opacity-85' : 'bg-secondary/30 hover:bg-secondary/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCancelled ? 'bg-red-500' : 'bg-primary'}`}>
                                      <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-sm sm:text-base">{t('tenant.receipt_n')} {receipt.receipt_number}</p>
                                        {isCancelled && (
                                          <Badge variant="destructive" className="text-[10px] font-bold uppercase bg-red-600 text-white">
                                            ANNULÉ
                                          </Badge>
                                        )}
                                      </div>
                                      <p className={`text-xs sm:text-sm ${isCancelled ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                        {monthName} - {formatCurrencyLocal(receipt.amount, receipt.currency)}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                        {receipt.property_name || t('hero.search_property')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handlePreviewReceipt(receipt)}
                                       className="flex-1 sm:flex-initial bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 transition-all font-semibold"
                                       title="Ouvrir le reçu dans un nouvel onglet"
                                     >
                                       <ExternalLink className="h-4 w-4 mr-1.5" />
                                       <span>Voir</span>
                                     </Button>
                                     {isCancelled ? (
                                       <Button
                                         size="sm"
                                         variant="outline"
                                         onClick={() => {
                                           setSelectedTenantReasonReceipt(receipt);
                                           setTenantReasonModalOpen(true);
                                         }}
                                         className="flex-1 sm:flex-initial border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 font-semibold"
                                         title="Voir le motif d'annulation"
                                       >
                                         <Info className="h-4 w-4 mr-1.5" />
                                         <span>Motif</span>
                                       </Button>
                                     ) : (
                                       <Button
                                         size="sm"
                                         variant="outline"
                                         onClick={() => handleDownloadReceipt(receipt.id)}
                                         className="flex-1 sm:flex-initial bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 transition-all"
                                         title="Télécharger le PDF"
                                       >
                                         <Download className="h-4 w-4 mr-1.5" />
                                         <span>PDF</span>
                                       </Button>
                                     )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Modal Motif d'annulation pour locataire */}
                    <Dialog open={tenantReasonModalOpen} onOpenChange={setTenantReasonModalOpen}>
                      <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-lg shrink-0">
                              <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span>Motif d'annulation de la quittance</span>
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Quittance N° <span className="font-mono font-semibold text-foreground">{selectedTenantReasonReceipt?.receipt_number}</span>
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-3">
                          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2">
                            <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                              Raison d'annulation :
                            </p>
                            <p className="text-sm font-medium text-red-950 dark:text-red-100 leading-relaxed whitespace-pre-wrap">
                              "{selectedTenantReasonReceipt?.cancellation_reason || 'Aucun motif renseigné'}"
                            </p>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setTenantReasonModalOpen(false)}
                            className="w-full sm:w-auto"
                          >
                            Fermer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <MaintenanceTab />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('dashboard.sidebar.settings')}</h2>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="flex bg-muted p-1 rounded-xl w-full max-w-[260px] shrink-0 mb-6 border border-border/40">
                    <TabsTrigger 
                      value="profile"
                      className="flex-1 rounded-lg font-bold text-xs h-8 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                    >
                      {t('dashboard.common.profile')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="account"
                      className="flex-1 rounded-lg font-bold text-xs h-8 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-white data-[state=inactive]:text-slate-900 data-[state=inactive]:border data-[state=inactive]:border-border/40 data-[state=inactive]:shadow-sm font-semibold"
                    >
                      {t('dashboard.common.account')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <TenantProfileSettings />
                  </TabsContent>

                  <TabsContent value="account">
                    <AccountSettings />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Guide Tab */}
            {activeTab === "guide" && <TenantDocumentationTab />}
          </div>
        </div>
      </main>

      <ReportOwnerDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        ownerId={currentOwnerId || ""}
        ownerName={ownerProfile?.company_name || ownerProfile?.full_name || tenantData?.owner_name || t('tenant.owner')}
        leases={leases}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
      />

      <ReceiptPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        receiptId={selectedPreviewReceipt?.id || null}
        receiptNumber={selectedPreviewReceipt?.number}
        paymentDate={selectedPreviewReceipt?.date}
      />

      {/* Detail Modal */}
      <LeaseDetailModal 
        lease={selectedLease}
        open={!!selectedLease}
        onClose={() => setSelectedLease(null)}
      />
    </div>
  );
};

export default DashboardLocataire;
