import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getOwnerProfile, updateOwnerProfile } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { X, FileText } from "lucide-react";

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
    signatureUrl: "",
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
          signatureUrl: data.signature_url || "",
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
          signatureUrl: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Information",
        description: "Impossible de charger les données du profil pour le moment.",
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
        signature_url: profile.signatureUrl,
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
        title: "Action impossible",
        description: "La mise à jour du profil a échoué. Veuillez réessayer.",
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

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Signature ou Cachet</Label>
                <p className="text-sm text-muted-foreground">
                  Cette signature ou cachet sera automatiquement apposé sur tous vos reçus de loyer.
                </p>

                <div className="flex flex-col gap-4">
                  {profile.signatureUrl ? (
                    <div className="relative w-48 h-32 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
                      <img
                        src={profile.signatureUrl}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setProfile({ ...profile, signatureUrl: "" })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
                      <FileText className="h-8 w-8 opacity-20" />
                      <span className="text-xs">Aucune signature</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setLoading(true);
                          const { uploadPhotos } = await import("@/lib/api");
                          const urls = await uploadPhotos([file]);
                          if (urls && urls.length > 0) {
                            setProfile({ ...profile, signatureUrl: urls[0] });
                            toast({
                              title: "Signature téléchargée",
                              description: "N'oubliez pas d'enregistrer les modifications.",
                            });
                          }
                        } catch (error: any) {
                          toast({
                            title: "Transfert échoué",
                            description: "Le chargement de l'image a rencontré un problème.",
                            variant: "destructive",
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto">
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
