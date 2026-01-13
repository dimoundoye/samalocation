import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { category: "Appartements", active: 245, pending: 23, occupied: 189 },
  { category: "Villas", active: 89, pending: 12, occupied: 67 },
  { category: "Studios", active: 156, pending: 18, occupied: 123 },
  { category: "Bureaux", active: 45, pending: 7, occupied: 34 },
  { category: "Commerces", active: 67, pending: 9, occupied: 52 },
];

export const PropertyStatsChart = () => {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Statistiques par type de bien</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="category" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
            />
            <Legend />
            <Bar dataKey="active" fill="hsl(var(--primary))" name="Actifs" radius={[4, 4, 0, 0]} />
            <Bar dataKey="occupied" fill="hsl(var(--accent))" name="Occupés" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="hsl(var(--muted-foreground))" name="En attente" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
