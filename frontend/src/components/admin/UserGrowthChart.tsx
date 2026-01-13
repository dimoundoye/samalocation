import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getUserGrowthData } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const UserGrowthChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrowthData();
  }, []);

  const loadGrowthData = async () => {
    try {
      const data = await getUserGrowthData(30);

      // Transformer les données pour Recharts
      // Grouper par date
      const groupedByDate: Record<string, any> = {};

      data.forEach((item: any) => {
        const dateKey = item.date;
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = {
            date: format(new Date(item.date), "dd MMM", { locale: fr }),
            fullDate: item.date,
            owners: 0,
            tenants: 0
          };
        }

        if (item.role === 'owner') {
          groupedByDate[dateKey].owners = item.count;
        } else if (item.role === 'tenant') {
          groupedByDate[dateKey].tenants = item.count;
        }
      });

      // Convertir en tableau et trier par date
      const chartArray = Object.values(groupedByDate).sort((a: any, b: any) =>
        new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      );

      setChartData(chartArray);
    } catch (error) {
      console.error('Error loading growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Croissance des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center just justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Croissance des utilisateurs (30 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="owners"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name="Propriétaires"
              />
              <Area
                type="monotone"
                dataKey="tenants"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
                name="Locataires"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
