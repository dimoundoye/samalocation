import { useState, useEffect, useRef } from "react";
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
import { Home, Search, Settings, LogOut, MessageSquare, FileText, Menu, Send, Download, TrendingUp, Trash2, AlertTriangle, ArrowLeft, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfile } from "@/components/UserProfile";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { ReportOwnerDialog } from "@/components/tenant/ReportOwnerDialog";
import { MaintenanceTab } from "@/components/tenant/MaintenanceTab";
import { TenantContractsTab } from "@/components/tenant/TenantContractsTab";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantMe, getReceipts, getTenantReceipts, downloadReceipt, getMessages, sendMessage, deleteMessage, updateTenantProfile, markMessagesAsRead, getNotifications, markNotificationAsRead } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSocket } from "@/contexts/SocketContext";
import { useTranslation } from "react-i18next";

const DashboardLocataire = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const dateLocale = i18n.language === 'en' ? enUS : fr;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ownerUserProfile, setOwnerUserProfile] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
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

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      console.log("[SOCKET] Tenant received new message:", msg);
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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} F CFA`;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: dateLocale });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm(t('tenant.delete_confirm'))) {
      return;
    }

    try {
      await deleteMessage(messageId);

      // Refresh messages list
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
        // Recharger tous les messages au lieu d'essayer d'ajouter manuellement
        loadMessages();
        // Note: La notification est créée automatiquement par le backend
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
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
      >
        <Home className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Samalocation
        </span>
      </button>

      <nav className="space-y-2">
        {[
          { id: "dashboard", label: t('dashboard.sidebar.home'), icon: TrendingUp },
          { id: "search", label: t('dashboard.sidebar.search'), icon: Search },
          { id: "messages", label: t('dashboard.sidebar.messages'), icon: MessageSquare },
          { id: "contracts", label: t('dashboard.sidebar.contracts'), icon: FileText },
          { id: "maintenance", label: t('dashboard.sidebar.maintenance'), icon: Wrench },
          { id: "settings", label: t('dashboard.sidebar.settings'), icon: Settings },
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
                if (item.id === "search") {
                  navigate("/search");
                } else {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
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
        className="w-full mt-8 justify-start text-muted-foreground"
      >
        <LogOut className="mr-3 h-5 w-5" />
        {t('dashboard.sidebar.logout')}
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
      <main className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-6">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <ThemeToggle />
              <NotificationBell />
              <UserProfile />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
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
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px] px-2 py-0">
                          {t('common.id')} : {user.customId}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-all text-xs"
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
                    <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                    {t('tenant.report_owner')}
                  </Button>
                </div>

                {/* Current Rental(s) */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold px-1">{t('tenant.my_rentals')}</h2>
                  {leases.length > 0 ? (
                    leases.map((lease) => (
                      <Card key={lease.id} className="group shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-primary relative">
                        <CardHeader className="pb-3 pr-20 sm:pr-6">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={lease.status === "active" ? "default" : "secondary"}
                              className="w-fit absolute top-4 right-4 sm:static mb-2"
                            >
                              {lease.status === "active" ? t('common.active') : lease.status}
                            </Badge>
                            <CardTitle className="text-base sm:text-xl font-bold leading-tight line-clamp-2">
                              {lease.property_name}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            {lease.photo_url && (
                              <div className="relative shrink-0">
                                <img
                                  src={lease.photo_url}
                                  alt="Location"
                                  className="w-full md:w-40 h-32 md:h-28 object-cover rounded-xl shadow-sm"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl md:hidden" />
                              </div>
                            )}
                            <div className="flex-1 space-y-4">
                              <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2 bg-secondary/30 w-fit px-2 py-1 rounded-md">
                                <Search className="h-3 w-3" /> {lease.property_address}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('tenant.rent')}</p>
                                  <p className="text-sm sm:text-base font-bold text-primary">
                                    {formatCurrency(lease.monthly_rent)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('tenant.unit')}</p>
                                  <p className="text-sm sm:text-base font-semibold">
                                    {lease.unit_number || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('tenant.move_in')}</p>
                                  <p className="text-xs sm:text-sm font-medium">
                                    {lease.move_in_date ? formatDate(lease.move_in_date) : t('tenant.not_defined')}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('tenant.owner')}</p>
                                  <p className="text-xs sm:text-sm font-medium">
                                    {lease.owner_name || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
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

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('dashboard.sidebar.documents')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{receipts.length}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
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

                  {/* Zone de Chat */}
                  <Card className={`lg:col-span-2 h-full flex flex-col ${!selectedChat ? 'hidden lg:block' : 'block'}`}>
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
                              <AvatarFallback>{selectedChat.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle>{selectedChat.full_name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {selectedChat.company_name && selectedChat.email
                                  ? `${selectedChat.company_name} • ${selectedChat.email}`
                                  : selectedChat.email || selectedChat.company_name || ""}
                              </p>
                            </div>
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
                              return filteredMessages.map((message) => {
                                // Le message vient du propriétaire si sender_id correspond à user_id du contact
                                const isFromOwner = message.sender_id === selectedChat.user_id;

                                return (
                                  <div
                                    key={message.id}
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
                                        <p className="text-xs opacity-70 mt-1">
                                          {new Date(message.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')}
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

                <Tabs defaultValue="leases" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="leases">Contract</TabsTrigger>
                    <TabsTrigger value="receipts">{t('dashboard.sidebar.documents')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="leases" className="space-y-6">
                    <TenantContractsTab />
                  </TabsContent>

                  <TabsContent value="receipts" className="space-y-6">
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle>{t('dashboard.sidebar.documents')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {receipts.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            {t('tenant.no_receipts')}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {receipts.map((receipt) => {
                              const monthName = format(new Date(receipt.year, receipt.month - 1), 'MMMM yyyy', { locale: dateLocale });
                              return (
                                <div
                                  key={receipt.id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors gap-4"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                                      <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm sm:text-base">{t('tenant.receipt_n')} {receipt.receipt_number}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground">
                                        {monthName} - {Number(receipt.amount).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR')} FCFA
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                        {receipt.property_name || t('hero.search_property')}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadReceipt(receipt.id)}
                                    className="w-full sm:w-auto"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    <span>{t('tenant.download_pdf')}</span>
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('dashboard.sidebar.maintenance')}</h2>
                <MaintenanceTab />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('dashboard.sidebar.settings')}</h2>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">{t('dashboard.common.profile')}</TabsTrigger>
                    <TabsTrigger value="account">{t('dashboard.common.account')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle>{t('dashboard.common.personal_info')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <UserProfile />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="account">
                    <AccountSettings />
                  </TabsContent>
                </Tabs>
              </div>
            )}
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
    </div>
  );
};

export default DashboardLocataire;
