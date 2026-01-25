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
import { Home, Search, Settings, LogOut, MessageSquare, FileText, Menu, Send, Download, TrendingUp, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfile } from "@/components/UserProfile";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { ReportOwnerDialog } from "@/components/tenant/ReportOwnerDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantMe, getReceipts, getTenantReceipts, downloadReceipt, getMessages, sendMessage, deleteMessage, updateTenantProfile, markMessagesAsRead, getNotifications, markNotificationAsRead } from "@/lib/api";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
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

  useEffect(() => {
    if (activeTab === "messages") {
      loadMessages();
    }

    // Polling des messages toutes les 10 secondes si on est sur l'onglet messages
    const interval = setInterval(() => {
      if (activeTab === "messages") {
        loadMessages();
      }
    }, 10000);

    return () => clearInterval(interval);
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
    if (activeTab === "documents" && notifications.some(n => n.type === "receipt" && !n.is_read)) {
      const clearReceiptNotifications = async () => {
        try {
          const receiptNotifs = notifications.filter(n => n.type === "receipt" && !n.is_read);
          for (const notif of receiptNotifs) {
            await markNotificationAsRead(notif.id);
          }
          // Recharger les notifications pour mettre à jour le badge
          loadNotifications();
        } catch (error) {
          console.error("Error clearing receipt notifications:", error);
        }
      };
      clearReceiptNotifications();
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
        title: "Erreur",
        description: "Impossible de charger vos données",
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
    return format(new Date(date), "dd MMM yyyy", { locale: fr });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      await deleteMessage(messageId);

      // Refresh messages list
      loadMessages();

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Le message n'a pas pu être supprimé.",
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
        title: "Erreur",
        description: "L'envoi du message a échoué.",
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
          { id: "dashboard", label: "Tableau de bord", icon: TrendingUp },
          { id: "search", label: "Rechercher", icon: Search },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "documents", label: "Mes documents", icon: FileText },
          { id: "settings", label: "Paramètres", icon: Settings },
        ].map((item) => {
          // Calculer le nombre de messages non lus
          const unreadCount = item.id === "messages"
            ? messages.filter(msg => msg.receiver_id === user?.id && !msg.is_read).length
            : item.id === "documents"
              ? notifications.filter(n => n.type === "receipt" && !n.is_read).length
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

            <div className="flex items-center gap-3 ml-auto">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground">
                        Bienvenue, {tenantProfile?.full_name || tenantProfile?.email || "Locataire"}
                      </p>
                      {user?.customId && (
                        <Badge variant="outline" className="text-primary font-mono font-bold">
                          ID: {user.customId}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      // Use owner from tenantData if available, otherwise use ownerProfile
                      const ownerId = tenantData?.owner_id || ownerProfile?.id;
                      if (ownerId) {
                        setCurrentOwnerId(ownerId);
                        setReportDialogOpen(true);
                      } else {
                        toast({
                          title: "Aucun propriétaire",
                          description: "Vous devez avoir une location active pour signaler un propriétaire.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Signaler un problème
                  </Button>
                </div>

                {/* Current Rental(s) */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold px-1">Mes locations</h2>
                  {leases.length > 0 ? (
                    leases.map((lease) => (
                      <Card key={lease.id} className="shadow-soft hover:shadow-md transition-shadow transition-all duration-300 overflow-hidden border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Location: {lease.property_name}</CardTitle>
                            <Badge variant={lease.status === "active" ? "default" : "secondary"}>
                              {lease.status === "active" ? "Actif" : lease.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col md:flex-row gap-6">
                            {lease.photo_url && (
                              <img
                                src={lease.photo_url}
                                alt="Location"
                                className="w-full md:w-32 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-muted-foreground mb-3 text-sm flex items-center gap-1">
                                <Search className="h-3 w-3" /> {lease.property_address}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Loyer</p>
                                  <p className="font-bold text-primary">
                                    {formatCurrency(lease.monthly_rent)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Unité</p>
                                  <p className="font-semibold">
                                    {lease.unit_number || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Arrivée</p>
                                  <p className="text-sm">
                                    {lease.move_in_date ? formatDate(lease.move_in_date) : "Non définie"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Propriétaire</p>
                                  <p className="text-sm font-medium">
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
                            <h3 className="font-semibold text-lg mb-2">Aucune location active</h3>
                            <p className="text-muted-foreground mb-4">
                              Vous n'avez pas encore de location assignée. Contactez le propriétaire ou l'administrateur pour plus d'informations.
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
                      <CardTitle className="text-sm">Documents</CardTitle>
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
                <h2 className={`text-2xl font-bold ${selectedChat ? 'hidden lg:block' : ''}`}>Messages</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] lg:h-auto">
                  {/* Liste des Conversations */}
                  <Card className={`lg:col-span-1 h-full ${selectedChat ? 'hidden lg:block' : 'block'}`}>
                    <CardHeader>
                      <CardTitle>Conversations</CardTitle>
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
                                  full_name: ownerName || "Propriétaire",
                                  email: ownerEmail || "",
                                  subtitle: "Propriétaire",
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
                                full_name: lease.owner_name || "Mon propriétaire",
                                email: lease.owner_email || "",
                                subtitle: lease.property_name || "Propriétaire",
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
                            <p className="text-center text-muted-foreground py-8 px-4">Aucune conversation</p>
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
                                    Aucun message dans cette conversation
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
                                        // TODO: Implémenter PATCH /api/messages/:id/read au besoin
                                        // Pour l'instant on met juste à jour localement
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
                                          {new Date(message.created_at).toLocaleString('fr-FR')}
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
                                placeholder="Tapez votre message..."
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
                          <p>Sélectionnez une conversation pour commencer</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Mes documents</h2>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Reçus de paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {receipts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun reçu disponible
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {receipts.map((receipt) => {
                          const monthName = format(new Date(receipt.year, receipt.month - 1), 'MMMM yyyy', { locale: fr });
                          return (
                            <div
                              key={receipt.id}
                              className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">Reçu N° {receipt.receipt_number}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {monthName} - {Number(receipt.amount).toLocaleString('fr-FR')} FCFA
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {receipt.property_name || 'Propriété'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await downloadReceipt(receipt.id, receipt.receipt_number, receipt.payment_date);
                                    toast({
                                      title: "Téléchargement réussi",
                                      description: "Le reçu PDF a été téléchargé"
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erreur",
                                      description: "Impossible de télécharger le reçu",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger PDF
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Paramètres</h2>
                  <p className="text-muted-foreground">Gérez votre profil et vos préférences</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList>
                    <TabsTrigger value="profile">Profil</TabsTrigger>
                    <TabsTrigger value="account">Compte</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle>Informations personnelles</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Nom complet</Label>
                          <Input
                            value={tenantProfile?.full_name || ""}
                            onChange={(e) => setTenantProfile({ ...tenantProfile, full_name: e.target.value })}
                            placeholder="Votre nom complet"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={tenantProfile?.email || ""}
                            onChange={(e) => setTenantProfile({ ...tenantProfile, email: e.target.value })}
                            placeholder="Votre email"
                            type="email"
                          />
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={tenantProfile?.phone || ""}
                            onChange={(e) => setTenantProfile({ ...tenantProfile, phone: e.target.value })}
                            placeholder="Votre numéro de téléphone"
                            type="tel"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              const updateData = {
                                full_name: tenantProfile?.full_name,
                                email: tenantProfile?.email,
                                phone: tenantProfile?.phone
                              };

                              await updateTenantProfile(updateData);

                              toast({
                                title: "Profil mis à jour",
                                description: "Vos informations ont été enregistrées avec succès."
                              });

                              // Recharger les données
                              loadTenantData();
                            } catch (error: any) {
                              toast({
                                title: "Erreur",
                                description: error.message || "Impossible de mettre à jour le profil",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Enregistrer les modifications
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="account" className="space-y-4">
                    <AccountSettings />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Report Owner Dialog */}
      {currentOwnerId && (
        <ReportOwnerDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          ownerId={currentOwnerId}
          ownerName={ownerProfile?.company_name || ownerProfile?.full_name || tenantData?.owner_name || "le propriétaire"}
        />
      )}
    </div>
  );
};

export default TenantDashboard;
