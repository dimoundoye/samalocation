import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, UserPlus, Home, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminEvents } from "@/api/admin";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const getEventConfig = (type: string) => {
  switch (type) {
    case "user":
      return { icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10", badge: "Utilisateur" };
    case "property":
      return { icon: Home, color: "text-blue-500", bg: "bg-blue-500/10", badge: "Bien" };
    case "report":
      return { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", badge: "Signalement" };
    case "payment":
      return { icon: CreditCard, color: "text-purple-500", bg: "bg-purple-500/10", badge: "Paiement" };
    default:
      return { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-secondary", badge: "Événement" };
  }
};

export const ActivityFeed = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const data = await getAdminEvents(20);
      setEvents(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading admin events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();

    // Polling toutes les 30 secondes
    const interval = setInterval(loadEvents, 30_000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            Activité en temps réel
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </CardTitle>
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Mise à jour {formatDistanceToNow(lastUpdated, { locale: fr, addSuffix: true })}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadEvents}
          disabled={loading}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Actualiser"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && events.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-secondary/30 rounded-lg animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {events.map((event, i) => {
              const config = getEventConfig(event.type);
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                      {config.badge}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {event.created_at ? formatDistanceToNow(new Date(event.created_at), { locale: fr, addSuffix: true }) : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
