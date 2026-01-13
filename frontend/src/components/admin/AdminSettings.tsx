import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Bell, Database, Settings, User } from "lucide-react";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres administrateur</h2>
        <p className="text-muted-foreground">Gérez vos paramètres et préférences</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Mon compte</TabsTrigger>
          <TabsTrigger value="platform">Plateforme</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6 mt-6">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="platform" className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres de sécurité
          </CardTitle>
          <CardDescription>
            Gérez les paramètres de sécurité de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Tentatives de connexion maximum</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              defaultValue="5"
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              defaultValue="60"
              className="max-w-xs"
            />
          </div>
          <Button>Sauvegarder les paramètres</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications admin
          </CardTitle>
          <CardDescription>
            Configurez les notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouveaux signalements</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouveau signalement
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouvelles inscriptions</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouvelle inscription
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouveaux paiements</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouveau paiement
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <Button>Sauvegarder les préférences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Maintenance de la base de données
          </CardTitle>
          <CardDescription>
            Outils de maintenance et de nettoyage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Nettoyage des données</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Supprime les données obsolètes et optimise les performances
            </p>
            <Button variant="outline">Lancer le nettoyage</Button>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Sauvegarde de la base de données</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crée une sauvegarde complète de toutes les données
            </p>
            <Button variant="outline">Créer une sauvegarde</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres généraux
          </CardTitle>
          <CardDescription>
            Configuration générale de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nom du site</Label>
            <Input
              id="siteName"
              defaultValue="Samalocation"
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de support</Label>
            <Input
              id="supportEmail"
              type="email"
              defaultValue="support@samalocation.com"
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenanceMode">Mode maintenance</Label>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="maintenanceMode" className="h-4 w-4" />
              <Label htmlFor="maintenanceMode" className="font-normal">
                Activer le mode maintenance
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Le site sera inaccessible aux utilisateurs pendant la maintenance
            </p>
          </div>
          <Button>Sauvegarder les paramètres</Button>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
