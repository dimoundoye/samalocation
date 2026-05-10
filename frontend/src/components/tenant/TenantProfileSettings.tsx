import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { User, Phone, Mail, MapPin, Save, Loader2 } from "lucide-react";
import { updateTenantProfile } from "@/api/tenant";

export const TenantProfileSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: (user as any).name || "",
        phone: (user as any).phone || "",
        email: (user as any).email || "",
        address: (user as any).address || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      if (!profile.name.trim()) {
        toast({
          title: "Erreur",
          description: "Le nom est obligatoire.",
          variant: "destructive",
        });
        return;
      }

      await updateTenantProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      });

      if (refreshUser) await refreshUser();

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Informations Personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nom complet
            </Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Votre nom complet"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Ex : +221 77 000 00 00"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>E-mail</span>
              <span className="text-xs font-normal text-muted-foreground">(lecture seule)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              readOnly
              className="h-11 rounded-xl bg-muted/40 cursor-not-allowed text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Pour modifier votre e-mail, veuillez contacter le support.
            </p>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Adresse
            </Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Ex : Dakar, Plateau, Rue 10"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="w-full sm:w-auto gradient-primary shadow-soft h-11 px-8 rounded-xl font-bold gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
