import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getOwnerProfile, updateOwnerProfile } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/shared/AccountSettings";

export const OwnerSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    contactPhone: "",
    phone: "",
    bio: "",
    companyName: "",
    contactEmail: "",
    address: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getOwnerProfile();

      if (data) {
        setProfile({
          fullName: data.full_name || "",
          contactPhone: data.contact_phone || "",
          phone: data.phone || "",
          bio: data.bio || "",
          companyName: data.company_name || "",
          contactEmail: data.contact_email || "",
          address: data.address || "",
        });
      } else {
        // Reset profile if no data is found
        setProfile({
          fullName: "",
          contactPhone: "",
          phone: "",
          bio: "",
          companyName: "",
          contactEmail: "",
          address: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      const profileData = {
        full_name: profile.fullName,
        contact_phone: profile.contactPhone,
        phone: profile.phone,
        bio: profile.bio,
        company_name: profile.companyName,
        contact_email: profile.contactEmail,
        address: profile.address,
      };

      const result = await updateOwnerProfile(profileData);

      if (!result) {
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres</h2>
        <p className="text-muted-foreground">Gérez votre profil et vos préférences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Ex: Immobilier Dakar"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Téléphone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={profile.contactPhone}
                  onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                  placeholder="Ex: +221 77 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Email de contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="Ex: contact@immobilierdakar.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Ex: Dakar, Sénégal"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Quelques mots sur vous..."
                />
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
