import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { getPropertiesOverview } from "@/lib/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PropertyTypeChart = () => {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getPropertiesOverview();

            // Transformer les données pour le graphique
            const transformedData = data.byType.map((item: any) => ({
                name: item.property_type === 'apartment' ? 'Appartement' :
                    item.property_type === 'house' ? 'Maison' :
                        item.property_type === 'studio' ? 'Studio' :
                            item.property_type === 'villa' ? 'Villa' : item.property_type,
                value: item.count
            }));

            setChartData(transformedData);
        } catch (error) {
            console.error('Error loading property type data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-soft">
                <CardHeader>
                    <CardTitle>Propriétés par type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Chargement...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card className="shadow-soft">
                <CardHeader>
                    <CardTitle>Propriétés par type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Aucune propriété</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft">
            <CardHeader>
                <CardTitle>Propriétés par type</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
