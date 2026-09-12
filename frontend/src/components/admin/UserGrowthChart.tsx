import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { getUserGrowthData } from "@/lib/api";
import { Users, Calendar } from "lucide-react";

const MONTH_NAMES = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
];

const FULL_MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export const UserGrowthChart = () => {
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrowthData();
  }, [period, selectedYear]);

  const loadGrowthData = async () => {
    setLoading(true);
    try {
      if (period === "month") {
        const data = await getUserGrowthData({ period: "month", year: selectedYear });
        
        // Initialiser tous les 12 mois à 0 pour une disposition propre et régulière
        const monthsData = MONTH_NAMES.map((name, index) => ({
          label: name,
          fullLabel: `${FULL_MONTH_NAMES[index]} ${selectedYear}`,
          monthIndex: index + 1,
          owners: 0,
          tenants: 0,
          total: 0
        }));

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const mIndex = parseInt(item.month, 10) - 1;
            if (mIndex >= 0 && mIndex < 12) {
              const count = parseInt(item.count, 10) || 0;
              if (item.role === "owner") {
                monthsData[mIndex].owners += count;
              } else if (item.role === "tenant") {
                monthsData[mIndex].tenants += count;
              } else {
                monthsData[mIndex].owners += count;
              }
              monthsData[mIndex].total += count;
            }
          });
        }

        setChartData(monthsData);
      } else {
        // Période par Année
        const data = await getUserGrowthData({ period: "year" });
        const yearsMap: Record<number, { label: string; fullLabel: string; owners: number; tenants: number; total: number }> = {};

        // S'assurer que l'année courante et la précédente sont présentes
        [currentYear - 1, currentYear].forEach(y => {
          yearsMap[y] = {
            label: y.toString(),
            fullLabel: `Année ${y}`,
            owners: 0,
            tenants: 0,
            total: 0
          };
        });

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const y = parseInt(item.year, 10);
            const count = parseInt(item.count, 10) || 0;
            if (!yearsMap[y]) {
              yearsMap[y] = {
                label: y.toString(),
                fullLabel: `Année ${y}`,
                owners: 0,
                tenants: 0,
                total: 0
              };
            }
            if (item.role === "owner") {
              yearsMap[y].owners += count;
            } else if (item.role === "tenant") {
              yearsMap[y].tenants += count;
            } else {
              yearsMap[y].owners += count;
            }
            yearsMap[y].total += count;
          });
        }

        const sortedYears = Object.keys(yearsMap)
          .map(Number)
          .sort((a, b) => a - b)
          .map(y => yearsMap[y]);

        setChartData(sortedYears);
      }
    } catch (error) {
      console.error("Error loading user growth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const owners = chartData.reduce((acc, curr) => acc + (curr.owners || 0), 0);
    const tenants = chartData.reduce((acc, curr) => acc + (curr.tenants || 0), 0);
    return {
      owners,
      tenants,
      total: owners + tenants
    };
  }, [chartData]);

  // Tooltip personnalisé lisible et moderne
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-card text-card-foreground p-3 rounded-xl border border-border shadow-xl text-xs space-y-2 min-w-[170px]">
          <div className="font-semibold text-foreground text-sm border-b pb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{dataItem.fullLabel || label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2D3FE2]" />
              Propriétaires :
            </span>
            <span className="font-bold text-foreground">{dataItem.owners}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]" />
              Locataires :
            </span>
            <span className="font-bold text-foreground">{dataItem.tenants}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-xs font-semibold">
            <span className="text-muted-foreground">Total inscrits :</span>
            <span className="text-primary font-bold">{dataItem.total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-soft overflow-hidden border-border/80">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Croissance des utilisateurs
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {period === "month"
                ? `Inscriptions mensuelles (${selectedYear})`
                : "Évolution globale des inscriptions par année"}
            </p>
          </div>

          {/* Filtres & contrôles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Mois / Année */}
            <div className="inline-flex items-center rounded-lg bg-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`px-3 py-1 rounded-md transition-all ${
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
                className={`px-3 py-1 rounded-md transition-all ${
                  period === "year"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Par année
              </button>
            </div>

            {/* Sélecteur d'année (affiché en mode par mois) */}
            {period === "month" && (
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

        {/* Mini KPI badges récapitulatifs */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-background/80 border p-2 shadow-xs">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase font-medium truncate">Total période</div>
              <div className="font-bold text-sm text-foreground">{totals.total}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 p-2 shadow-xs">
            <div className="h-2 w-2 rounded-full bg-[#2D3FE2]" />
            <div className="min-w-0">
              <div className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-medium truncate">Propriétaires</div>
              <div className="font-bold text-sm text-blue-900 dark:text-blue-200">{totals.owners}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/50 p-2 shadow-xs">
            <div className="h-2 w-2 rounded-full bg-[#F97316]" />
            <div className="min-w-0">
              <div className="text-[10px] text-orange-700 dark:text-orange-400 uppercase font-medium truncate">Locataires</div>
              <div className="font-bold text-sm text-orange-900 dark:text-orange-200">{totals.tenants}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Aucune donnée disponible pour cette période</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                className="text-xs text-muted-foreground"
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="text-xs text-muted-foreground"
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "-10px" }}
              />
              <Bar
                dataKey="owners"
                name="Propriétaires"
                fill="#2D3FE2"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="tenants"
                name="Locataires"
                fill="#F97316"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
