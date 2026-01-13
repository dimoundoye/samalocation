import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, UserPlus, XCircle } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "user",
    icon: UserPlus,
    color: "text-green-500",
    title: "Nouvelle inscription",
    description: "Fatou Sall s'est inscrite comme locataire",
    time: "Il y a 5 min",
  },
  {
    id: 2,
    type: "property",
    icon: AlertCircle,
    color: "text-orange-500",
    title: "Annonce en attente",
    description: "Villa Fann nécessite une modération",
    time: "Il y a 15 min",
  },
  {
    id: 3,
    type: "property",
    icon: CheckCircle,
    color: "text-green-500",
    title: "Annonce approuvée",
    description: "Appartement Almadies a été approuvé",
    time: "Il y a 2h",
  },
  {
    id: 4,
    type: "property",
    icon: XCircle,
    color: "text-destructive",
    title: "Annonce rejetée",
    description: "Studio Mermoz - photos non conformes",
    time: "Il y a 3h",
  },
  {
    id: 5,
    type: "user",
    icon: UserPlus,
    color: "text-green-500",
    title: "Nouveau propriétaire",
    description: "Moussa Ba a créé un compte propriétaire",
    time: "Il y a 5h",
  },
];

export const ActivityFeed = () => {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Activité en temps réel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0`}>
                <activity.icon className={`h-5 w-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
