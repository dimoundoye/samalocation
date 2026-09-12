import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAIPerformance } from "@/lib/api";
import { Bot, Zap, Clock, Sparkles, Search, MessageSquare, BrainCircuit, Calendar } from "lucide-react";

interface AIStatItem {
  action: string;
  count: number;
  last_used?: string | null;
  total_tokens?: number;
}

const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

const AI_ACTION_CARDS = [
  {
    action: "description_generation",
    label: "Descriptions générées",
    desc: "Annonces rédigées via l'IA",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20"
  },
  {
    action: "smart_search",
    label: "Recherche Smart",
    desc: "Recherches sémantiques",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20"
  },
  {
    action: "chat",
    label: "Chat Support",
    desc: "Assistance conversationnelle",
    icon: MessageSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20"
  },
  {
    action: "parse_listing",
    label: "Analyse d'annonces",
    desc: "Extraction & parsing automatique",
    icon: BrainCircuit,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20"
  }
];

export const AIPerformanceCard = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const [period, setPeriod] = useState<"all" | "year" | "month">("month");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [stats, setStats] = useState<AIStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period, selectedYear, selectedMonth]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getAIPerformance({
        period,
        year: period !== "all" ? selectedYear : undefined,
        month: period === "month" ? selectedMonth : undefined,
      });

      if (Array.isArray(data)) {
        setStats(data);
      } else {
        setStats([]);
      }
    } catch (error) {
      console.error("Error loading AI performance:", error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCalls = useMemo(() => {
    return stats.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [stats]);

  const periodDescription = useMemo(() => {
    if (period === "all") return "Depuis le lancement de la plateforme";
    if (period === "year") return `Statistiques cumulées pour l'année ${selectedYear}`;
    const mLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || "";
    return `Statistiques pour ${mLabel} ${selectedYear}`;
  }, [period, selectedYear, selectedMonth]);

  return (
    <Card className="shadow-soft mb-6 overflow-hidden border-border/80">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                <Bot className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Performance de l'IA
              </CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase font-medium bg-background text-indigo-600 border-indigo-200 dark:border-indigo-900 ml-1">
                Google Gemini 1.5 Pro
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {periodDescription}
            </p>
          </div>

          {/* Filtres par période */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Tout / Par an / Par mois */}
            <div className="inline-flex items-center rounded-lg bg-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  period === "month"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Par mois
              </button>
              <button
                type="button"
                onClick={() => setPeriod("year")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  period === "year"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Par année
              </button>
              <button
                type="button"
                onClick={() => setPeriod("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  period === "all"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tout
              </button>
            </div>

            {/* Sélecteur de mois si "Par mois" */}
            {period === "month" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                aria-label="Sélectionner le mois"
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            {/* Sélecteur d'année si non "Tout" */}
            {period !== "all" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                aria-label="Sélectionner l'année"
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Badge récapitulatif total */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
              <Zap className="h-3 w-3 text-indigo-500 fill-indigo-500" />
              {totalCalls} requêtes IA au total
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {AI_ACTION_CARDS.map((card) => {
              const item = stats.find((s) => s.action === card.action);
              const count = item?.count || 0;
              const Icon = card.icon;

              return (
                <div
                  key={card.action}
                  className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-indigo-500/40 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg border ${card.bg}`}>
                        <Icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                      <span className="text-2xl font-black text-foreground tracking-tight">
                        {count}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-foreground block">
                      {card.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {card.desc}
                    </span>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0 opacity-70" />
                    {item?.last_used ? (
                      <span className="truncate">
                        {new Date(item.last_used).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="italic">Aucun usage</span>
                    )}
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
