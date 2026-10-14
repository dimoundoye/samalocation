import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, History, Loader2, ShieldCheck } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveAnalytics } from "@/lib/api";

interface Count { visitors: number; pageviews: number }
interface Row { label: string; visitors: number; pageviews?: number }
interface TrafficStats {
  online_now: number;
  periods: { today: Count; d7: Count; d30: Count; year: Count };
  monthly: (Count & { month: string })[];
  daily: (Count & { date: string })[];
  top_pages: Row[];
  devices: Row[];
  browsers: Row[];
  os: Row[];
  sources: Row[];
  audience: Row[];
  bots_filtered: number;
  tracking_since: string | null;
}

const REFRESH_MS = 30_000;
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n || 0);

const PAGE_NAMES: Record<string, string> = {
  "/": "Accueil",
  "/search": "Recherche",
  "/property/:id": "Fiche d'un bien",
  "/auth": "Connexion / inscription",
  "/proprio/:id": "Profil public d'un propriétaire",
  "/owner-dashboard": "Tableau de bord propriétaire",
  "/tenant-dashboard": "Espace locataire",
  "/favorites": "Favoris",
  "/dossier-digital": "Dossier locataire",
  "/about": "À propos",
  "/pricing": "Tarifs",
  "/contact": "Contact",
  "/terms": "Conditions d'utilisation",
  "/privacy": "Politique de confidentialité",
};
const DEVICE_NAMES: Record<string, string> = { mobile: "Mobile", tablet: "Tablette", desktop: "Ordinateur" };
const AUDIENCE_NAMES: Record<string, string> = { visitor: "Non connectés", owner: "Propriétaires", tenant: "Locataires" };

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** Liste classée : libellé, barre proportionnelle, valeur. */
const RankedList = ({ title, rows, nameOf, showPath = false }: { title: string; rows: Row[]; nameOf?: (label: string) => string; showPath?: boolean }) => {
  const max = Math.max(1, ...rows.map(r => r.visitors));
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">Visiteurs uniques, 12 derniers mois</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">Pas encore de données.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map(row => {
              const name = nameOf ? nameOf(row.label) : row.label;
              return (
                <li key={row.label} className="space-y-1" title={`${name} : ${fmt(row.visitors)} visiteur(s)${row.pageviews !== undefined ? `, ${fmt(row.pageviews)} page(s) vue(s)` : ""}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {name}
                      {showPath && name !== row.label && <span className="ml-2 font-mono text-[11px] text-muted-foreground">{row.label}</span>}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {fmt(row.visitors)}
                      {row.pageviews !== undefined && <span className="ml-1.5 text-xs font-normal text-muted-foreground">· {fmt(row.pageviews)} vue{row.pageviews > 1 ? "s" : ""}</span>}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(row.visitors / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metric: "visitors" | "pageviews";
  labelOf: (value: string) => string;
}

const ChartTooltip = ({ active, payload, label, metric, labelOf }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground text-xs mb-0.5">{labelOf(label || "")}</p>
      <p className="font-semibold">{fmt(payload[0].value)} {metric === "visitors" ? "visiteur(s)" : "page(s) vue(s)"}</p>
    </div>
  );
};

const AdminTrafficTab = () => {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"year" | "month">("year");
  const [metric, setMetric] = useState<"visitors" | "pageviews">("visitors");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLiveAnalytics();
      setStats(data);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les statistiques.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const periods = stats
    ? [
        { label: "Aujourd'hui", data: stats.periods.today },
        { label: "7 derniers jours", data: stats.periods.d7 },
        { label: "30 derniers jours", data: stats.periods.d30 },
        { label: "12 derniers mois", data: stats.periods.year },
      ]
    : [];

  const chartData = range === "year" ? stats?.monthly || [] : stats?.daily || [];
  const xKey = range === "year" ? "month" : "date";
  const labelOf = range === "year" ? monthLabel : dayLabel;
  const since = stats?.tracking_since ? new Date(stats.tracking_since) : null;
  const recentStart = since && Date.now() - since.getTime() < 365 * 24 * 3600 * 1000;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            Vue en direct
          </h1>
          <p className="text-sm text-muted-foreground">
            Fréquentation du site sur les 12 derniers mois · actualisation automatique toutes les 30 secondes
            {updatedAt && <> · mis à jour à {updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start md:self-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!stats && !error ? (
        <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : stats && (
        <>
          {recentStart && (
            <p className="text-xs text-muted-foreground rounded-lg bg-secondary/40 px-3 py-2">
              Mesure démarrée le {since!.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} : les périodes plus anciennes sont vides.
            </p>
          )}

          {/* Chiffres clés */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <Card className="shadow-soft border-green-500/20 bg-green-500/5 col-span-2 lg:col-span-1">
              <CardContent className="p-4 md:p-5">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  En ligne maintenant
                </p>
                <p className="text-3xl font-black mt-2 tabular-nums">{fmt(stats.online_now)}</p>
                <p className="text-xs text-muted-foreground mt-1">actifs ces 5 dernières minutes</p>
              </CardContent>
            </Card>
            {periods.map(p => (
              <Card key={p.label} className="shadow-soft">
                <CardContent className="p-4 md:p-5">
                  <p className="text-xs font-semibold text-muted-foreground">{p.label}</p>
                  <p className="text-2xl md:text-3xl font-black mt-2 tabular-nums">{fmt(p.data.visitors)}</p>
                  <p className="text-xs text-muted-foreground mt-1">visiteurs · {fmt(p.data.pageviews)} pages vues</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Évolution */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <CardTitle className="text-base">
                {metric === "visitors" ? "Visiteurs uniques" : "Pages vues"} {range === "year" ? "par mois" : "par jour"}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex rounded-lg border p-0.5 text-xs">
                  {([["visitors", "Visiteurs"], ["pageviews", "Pages vues"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setMetric(key)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${metric === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border p-0.5 text-xs">
                  {([["year", "12 mois"], ["month", "30 jours"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setRange(key)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${range === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[340px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {range === "year" ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey={xKey} tickFormatter={labelOf} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.06)" }} content={<ChartTooltip metric={metric} labelOf={labelOf} />} />
                    <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey={xKey} tickFormatter={labelOf} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip metric={metric} labelOf={labelOf} />} />
                    <Area type="linear" dataKey={metric} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#trafficFill)" activeDot={{ r: 4 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Détails */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RankedList title="Pages les plus consultées" rows={stats.top_pages} nameOf={l => PAGE_NAMES[l] || l} showPath />
            <RankedList title="Provenance" rows={stats.sources} />
            <RankedList title="Qui visite" rows={stats.audience} nameOf={l => AUDIENCE_NAMES[l] || l} />
            <RankedList title="Appareils" rows={stats.devices} nameOf={l => DEVICE_NAMES[l] || l} />
            <RankedList title="Navigateurs" rows={stats.browsers} />
            <RankedList title="Systèmes" rows={stats.os} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" /> {fmt(stats.bots_filtered)} passage(s) de robots écarté(s) des chiffres</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Aucune adresse IP enregistrée · données supprimées après 1 an · pages admin non comptées</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTrafficTab;
