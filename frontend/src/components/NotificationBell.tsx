import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api";
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

export const NotificationBell = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Polling des notifications toutes les 30 secondes
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (!user) return;

      const data = await getNotifications();
      console.log("[NOTIF] Fetched:", data);
      if (data) {
        setNotifications(data);
        const unread = data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
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
                  className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${!notification.is_read ? "bg-secondary/30" : ""
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
      </PopoverContent>
    </Popover>
  );
};
