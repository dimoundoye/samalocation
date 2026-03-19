import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Bell, Database, Settings, User, Save, RefreshCw } from "lucide-react";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlatformSettings, updatePlatformSetting } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Settings States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState({
    reports: true,
    registrations: true,
    payments: true
  });
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Samalocation",
    supportEmail: "support@samalocation.com"
  });
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    sessionTimeout: 60
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings = await getPlatformSettings();
      if (settings.maintenance_mode !== undefined) setMaintenanceMode(settings.maintenance_mode === true);
      if (settings.admin_notifications) setNotifications(settings.admin_notifications);
      if (settings.general_settings) setGeneralSettings(settings.general_settings);
      if (settings.security_settings) setSecuritySettings(settings.security_settings);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: any) => {
    setSaving(key);
    try {
      await updatePlatformSetting(key, value);
      toast({
        title: "Succès",
        description: "Paramètre mis à jour avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour.",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres administrateur</h2>
        <p className="text-muted-foreground">Gérez la plateforme et vos préférences de sécurité</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Mon compte
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            <Settings className="h-4 w-4" />
            Plateforme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6 mt-6 animate-fade-in">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="platform" className="space-y-6 mt-6 animate-fade-in">
          {/* Security Settings */}
          <Card className="shadow-soft border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Paramètres de sécurité
              </CardTitle>
              <CardDescription>Configurez les règles de protection du site</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Tentatives de connexion maximum</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Délai d'expiration (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSave('security_settings', securitySettings)}
                disabled={saving === 'security_settings'}
                className="gap-2"
              >
                {saving === 'security_settings' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Sauvegarder la sécurité
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card className="shadow-soft border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Alertes Administrateur
              </CardTitle>
              <CardDescription>Choisissez les événements qui déclenchent une notification</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { id: 'reports', label: 'Nouveaux signalements', desc: 'Alertes pour comportement suspect' },
                { id: 'registrations', label: 'Nouvelles inscriptions', desc: 'Suivre la croissance des membres' },
                { id: 'payments', label: 'Nouveaux paiements', desc: 'Notifications pour validation de revenus' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors group">
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={(notifications as any)[item.id]} 
                    onCheckedChange={(val) => {
                      const newNotifs = { ...notifications, [item.id]: val };
                      setNotifications(newNotifs);
                      handleSave('admin_notifications', newNotifs);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* General Platform Settings */}
          <Card className="shadow-soft border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                Configuration Générale
              </CardTitle>
              <CardDescription>Informations publiques et état du site</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom de la Plateforme</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Support</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 text-white rounded-lg">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-red-700">MODE MAINTENANCE</p>
                      <p className="text-xs text-red-600 opacity-80">Bloque l'accès au site pour tous sauf admins</p>
                    </div>
                  </div>
                  <Switch 
                    checked={maintenanceMode}
                    onCheckedChange={(val) => {
                      setMaintenanceMode(val);
                      handleSave('maintenance_mode', val);
                    }}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
              </div>

              <Button 
                onClick={() => handleSave('general_settings', generalSettings)}
                disabled={saving === 'general_settings'}
                className="gap-2"
              >
                {saving === 'general_settings' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Sauvegarder les réglages
              </Button>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Maintenance Technique
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg border border-border/50">
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Nettoyage Automatique</h4>
                <p className="text-xs text-muted-foreground mb-4">Supprime les notifications et logs de plus de 90 jours.</p>
                <Button variant="outline" size="sm" className="w-full">Lancer</Button>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-border/50">
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Sauvegarde Database</h4>
                <p className="text-xs text-muted-foreground mb-4">Générer un export complet des données (SQL dump).</p>
                <Button variant="outline" size="sm" className="w-full">Exporter</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
