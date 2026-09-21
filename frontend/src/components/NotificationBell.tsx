import { useState, useEffect } from "react";
import { 
  Bell, 
  CreditCard, 
  AlertTriangle, 
  Shield, 
  MessageSquare, 
  Users, 
  Building2, 
  CheckCircle,
  ExternalLink 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getAdminStatistics 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

interface AdminStatistics {
  pendingReportsCount?: number;
  pendingVerificationsCount?: number;
  pendingPaymentsCount?: number;
  pendingContactsCount?: number;
  newUsersCount?: number;
  newPropertiesCount?: number;
}

export const NotificationBell = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatistics | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin" || user?.role === "admin";

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Polling des notifications toutes les 30 secondes
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const loadNotifications = async () => {
    try {
      if (!user) return;

      if (isAdmin) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastUsersCheck = localStorage.getItem("admin_last_users_check") || sevenDaysAgo.toISOString();
        const lastPropertiesCheck = localStorage.getItem("admin_last_properties_check") || sevenDaysAgo.toISOString();

        const [statsData, notifsData] = await Promise.all([
          getAdminStatistics({ lastUsersCheck, lastPropertiesCheck }).catch(err => {
            console.error("Error fetching admin statistics in bell:", err);
            return null;
          }),
          getNotifications().catch(err => {
            console.error("Error fetching user notifications in bell:", err);
            return [];
          })
        ]);

        if (statsData) {
          setAdminStats(statsData);
          const adminCount =
            (statsData.pendingReportsCount || 0) +
            (statsData.pendingVerificationsCount || 0) +
            (statsData.pendingPaymentsCount || 0) +
            (statsData.pendingContactsCount || 0) +
            (statsData.newUsersCount || 0) +
            (statsData.newPropertiesCount || 0);

          const personalUnread = Array.isArray(notifsData)
            ? notifsData.filter((n: any) => !n.is_read).length
            : 0;
          setUnreadCount(adminCount + personalUnread);
        } else if (Array.isArray(notifsData)) {
          const personalUnread = notifsData.filter((n: any) => !n.is_read).length;
          setUnreadCount(personalUnread);
        }

        if (Array.isArray(notifsData)) {
          setNotifications(notifsData);
        }
      } else {
        const data = await getNotifications();
        if (data) {
          setNotifications(data);
          const unread = data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
      toast({
        title: "Notifications marquées comme lues",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "property":
        return "🏠";
      case "tenant":
        return "👤";
      case "receipt":
        return "📄";
      case "maintenance":
        return "🛠️";
      default:
        return "🔔";
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return notifDate.toLocaleDateString("fr-FR");
  };

  const totalAdminPending = adminStats
    ? (adminStats.pendingReportsCount || 0) +
      (adminStats.pendingVerificationsCount || 0) +
      (adminStats.pendingPaymentsCount || 0) +
      (adminStats.pendingContactsCount || 0) +
      (adminStats.newUsersCount || 0) +
      (adminStats.newPropertiesCount || 0)
    : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-premium rounded-2xl overflow-hidden" align="end">
        {isAdmin ? (
          <div>
            <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Notifications Admin</h3>
                <p className="text-[11px] text-muted-foreground">Alertes et tâches en attente</p>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 font-semibold">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <ScrollArea className="max-h-[350px]">
              {adminStats && (
                <div className="divide-y">
                  {adminStats.pendingPaymentsCount! > 0 && (
                    <button
                      onClick={() => {
                        navigate("/admin-dashboard/finances");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-green-600 shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.pendingPaymentsCount} paiement{adminStats.pendingPaymentsCount! > 1 ? "s" : ""} en attente</p>
                        <p className="text-xs text-muted-foreground">À valider dans Finances</p>
                      </div>
                    </button>
                  )}

                  {adminStats.pendingReportsCount! > 0 && (
                    <button
                      onClick={() => {
                        navigate("/admin-dashboard/reports");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.pendingReportsCount} signalement{adminStats.pendingReportsCount! > 1 ? "s" : ""} en attente</p>
                        <p className="text-xs text-muted-foreground">Examiner les signalements</p>
                      </div>
                    </button>
                  )}

                  {adminStats.pendingVerificationsCount! > 0 && (
                    <button
                      onClick={() => {
                        navigate("/admin-dashboard/verifications");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 shrink-0">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.pendingVerificationsCount} vérification{adminStats.pendingVerificationsCount! > 1 ? "s" : ""} d'identité</p>
                        <p className="text-xs text-muted-foreground">Profils bailleurs à valider</p>
                      </div>
                    </button>
                  )}

                  {(adminStats.pendingContactsCount || 0) > 0 && (
                    <button
                      onClick={() => {
                        navigate("/admin-dashboard/support");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.pendingContactsCount} message{adminStats.pendingContactsCount! > 1 ? "s" : ""} de support</p>
                        <p className="text-xs text-muted-foreground">À traiter dans Support</p>
                      </div>
                    </button>
                  )}

                  {adminStats.newUsersCount! > 0 && (
                    <button
                      onClick={() => {
                        localStorage.setItem("admin_last_users_check", new Date().toISOString());
                        navigate("/admin-dashboard/users");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.newUsersCount} nouvel utilisateur{adminStats.newUsersCount! > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">Inscrits récemment</p>
                      </div>
                    </button>
                  )}

                  {adminStats.newPropertiesCount! > 0 && (
                    <button
                      onClick={() => {
                        localStorage.setItem("admin_last_properties_check", new Date().toISOString());
                        navigate("/admin-dashboard/properties");
                        setOpen(false);
                      }}
                      className="w-full text-left p-3.5 hover:bg-secondary/50 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{adminStats.newPropertiesCount} nouvelle{adminStats.newPropertiesCount! > 1 ? "s" : ""} propriété{adminStats.newPropertiesCount! > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">Ajoutées récemment</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Regular notifications if any */}
              {notifications.length > 0 && (
                <div className="divide-y border-t">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3.5 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        !notification.is_read ? "bg-secondary/30" : ""
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        if (notification.link) {
                          navigate(notification.link);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalAdminPending === 0 && notifications.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-green-500" />
                  <p className="text-sm font-medium">Tout est à jour !</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aucune alerte administrative en attente</p>
                </div>
              )}
            </ScrollArea>

            <div className="p-2.5 border-t bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate("/admin-dashboard");
                  setOpen(false);
                }}
                className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 h-8"
              >
                <span>Accéder au tableau de bord admin</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        !notification.is_read ? "bg-secondary/30" : ""
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        if (notification.link) {
                          navigate(notification.link);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
