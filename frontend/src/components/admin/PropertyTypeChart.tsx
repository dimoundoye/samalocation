import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { getPropertiesOverview } from "@/lib/api";
import { Home, Layers, Building2, Building, BedDouble, Warehouse, Store, Hotel, PieChart as PieIcon } from "lucide-react";

// Configuration et couleurs harmonisées pour les types de propriétés officiels de SamaLocation
const PROPERTY_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  maison:      { label: "Maison",      color: "#3B82F6", icon: Home },        // Bleu
  villa:       { label: "Villa",       color: "#8B5CF6", icon: Layers },      // Violet
  appartement: { label: "Appartement", color: "#2D3FE2", icon: Building2 },   // Bleu SamaLocation
  apartment:   { label: "Appartement", color: "#2D3FE2", icon: Building2 },
  immeuble:    { label: "Immeuble",    color: "#EC4899", icon: Hotel },       // Rose
  studio:      { label: "Studio",      color: "#06B6D4", icon: Building },    // Cyan
  chambre:     { label: "Chambre",     color: "#10B981", icon: BedDouble },   // Émeraude
  garage:      { label: "Garage",      color: "#64748B", icon: Warehouse },   // Ardoise
  locale:      { label: "Local",       color: "#F59E0B", icon: Store },       // Ambre
  local:       { label: "Local",       color: "#F59E0B", icon: Store },
  terrain:     { label: "Terrain",     color: "#84CC16", icon: Layers },      // Vert lime
};

const getPropertyConfig = (type: string) => {
  const normalized = (type || "").toLowerCase().trim();
  if (PROPERTY_TYPE_CONFIG[normalized]) {
    return PROPERTY_TYPE_CONFIG[normalized];
  }
  // Fallback si un type non répertorié apparaît
  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    color: "#94A3B8",
    icon: Building2
  };
};

export const PropertyTypeChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getPropertiesOverview();

      if (data && Array.isArray(data.byType)) {
        const total = data.byType.reduce((acc: number, item: any) => acc + Number(item.count || 0), 0);

        const transformedData = data.byType.map((item: any) => {
          const config = getPropertyConfig(item.property_type);
          const count = Number(item.count) || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return {
            key: item.property_type,
            name: config.label,
            color: config.color,
            icon: config.icon,
            value: count,
            percentage
          };
        });

        // Trier par nombre décroissant
        transformedData.sort((a: any, b: any) => b.value - a.value);
        setChartData(transformedData);
      }
    } catch (error) {
      console.error("Error loading property type data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalProperties = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  // Tooltip stylisé évitant tout chevauchement de texte
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-2.5 rounded-lg border border-border shadow-md text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between gap-4">
            <span>Nombre :</span>
            <span className="font-bold text-foreground">{data.value}</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between gap-4">
            <span>Part :</span>
            <span className="font-bold text-primary">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">Propriétés par type</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[260px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold">Propriétés par type</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Aucune propriété enregistrée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden border-border/80">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-accent/10 text-accent">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Propriétés par type</CardTitle>
              <p className="text-xs text-muted-foreground">Répartition des annonces par catégorie</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {totalProperties} {totalProperties > 1 ? "biens" : "bien"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Diagramme circulaire (Donut moderne sans texte qui déborde) */}
        <div className="relative h-[190px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Indicateur central dans le donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-foreground leading-none">
              {totalProperties}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Légende détaillée et responsive : résout les coupures de texte sur mobile */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
          {chartData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center gap-1 min-w-0">
                    {Icon && <Icon className="w-3 h-3 text-muted-foreground shrink-0 hidden sm:inline-block" />}
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-bold text-foreground">{item.value}</span>
                  <span className="text-[10px] text-muted-foreground">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
