import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getOwnerProfile, updateOwnerProfile, uploadPhotos } from "@/lib/api";
import { X, FileText, Clock, Facebook, Instagram, Linkedin, Globe, MessageSquare, Mail } from "lucide-react";

export const OwnerPublicProfileEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    bio: "",
    companyName: "",
    bannerUrl: "",
    externalEmail: "",
    website: "",
    socialLinks: { facebook: "", instagram: "", linkedin: "" },
    prestations: [] as string[],
    horaires: {
      mon: { open: "08:00", close: "18:00", closed: false },
      tue: { open: "08:00", close: "18:00", closed: false },
      wed: { open: "08:00", close: "18:00", closed: false },
      thu: { open: "08:00", close: "18:00", closed: false },
      fri: { open: "08:00", close: "18:00", closed: false },
      sat: { open: "09:00", close: "13:00", closed: false },
      sun: { open: "00:00", close: "00:00", closed: true },
    },
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
          ...profile,
          bio: data.bio || "",
          companyName: data.company_name || "",
          bannerUrl: data.banner_url || "",
          externalEmail: data.external_email || "",
          website: data.website || "",
          socialLinks: {
            facebook: "",
            instagram: "",
            linkedin: "",
            ...(typeof data.social_links === 'string' ? JSON.parse(data.social_links) : (data.social_links || {}))
          },
          prestations: Array.isArray(data.prestations) ? data.prestations : (typeof data.prestations === 'string' ? JSON.parse(data.prestations) : []),
          horaires: {
            mon: { open: "08:00", close: "18:00", closed: false },
            tue: { open: "08:00", close: "18:00", closed: false },
            wed: { open: "08:00", close: "18:00", closed: false },
            thu: { open: "08:00", close: "18:00", closed: false },
            fri: { open: "08:00", close: "18:00", closed: false },
            sat: { open: "09:00", close: "13:00", closed: false },
            sun: { open: "00:00", close: "00:00", closed: true },
            ...(typeof data.horaires === 'string' ? JSON.parse(data.horaires) : (data.horaires || {}))
          },
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du profil.",
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
        bio: profile.bio,
        banner_url: profile.bannerUrl,
        external_email: profile.externalEmail,
        website: profile.website,
        social_links: profile.socialLinks,
        prestations: profile.prestations,
        horaires: profile.horaires,
      };

      await updateOwnerProfile(profileData);
      toast({
        title: "Succès",
        description: "Votre profil public a été mis à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "La mise à jour a échoué.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration du Profil Public</h2>
          <p className="text-muted-foreground">Gérez la vitrine de votre agence et vos informations de contact pour les locataires.</p>
        </div>
        <Button onClick={handleUpdateProfile} disabled={loading} className="gradient-primary text-white shadow-lg">
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Bannière de l'agence</Label>
                <div className="relative h-56 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center bg-muted/10 overflow-hidden group transition-all hover:bg-muted/20">
                  {profile.bannerUrl ? (
                    <>
                      <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer">
                          <Button variant="secondary" size="sm" asChild>
                            <span>Changer l'image</span>
                          </Button>
                          <Input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const localPreview = URL.createObjectURL(file);
                                setProfile({ ...profile, bannerUrl: localPreview });
                                setBannerLoading(true);
                                try {
                                  const urls = await uploadPhotos([file]);
                                  if (urls && urls.length > 0) setProfile({ ...profile, bannerUrl: urls[0] });
                                } catch (err) {
                                  toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" });
                                  setProfile({ ...profile, bannerUrl: "" });
                                } finally {
                                  setBannerLoading(false);
                                  URL.revokeObjectURL(localPreview);
                                }
                              }
                            }} 
                          />
                        </label>
                        <Button variant="destructive" size="sm" onClick={() => setProfile({ ...profile, bannerUrl: "" })}>
                          Supprimer
                        </Button>
                      </div>
                      {bannerLoading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                           <p className="text-sm font-bold tracking-wide">Optimisation de l'image...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-base font-bold mb-1">Image de couverture</p>
                      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">Ajoutez une bannière pour personnaliser la vitrine de votre agence (1200x400).</p>
                      <label className="cursor-pointer">
                        <Button className="gradient-primary text-white" asChild>
                          <span>Choisir une image</span>
                        </Button>
                        <Input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const localPreview = URL.createObjectURL(file);
                              setProfile({ ...profile, bannerUrl: localPreview });
                              setBannerLoading(true);
                              try {
                                const urls = await uploadPhotos([file]);
                                if (urls && urls.length > 0) setProfile({ ...profile, bannerUrl: urls[0] });
                              } catch (err) {
                                toast({ title: "Erreur", description: "Échec du téléchargement.", variant: "destructive" });
                                setProfile({ ...profile, bannerUrl: "" });
                              } finally {
                                setBannerLoading(false);
                                URL.revokeObjectURL(localPreview);
                              }
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Description de l'agence</Label>
                <Textarea 
                  placeholder="Présentez votre agence, vos années d'expérience et votre vision..."
                  className="min-h-[180px] resize-y"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email Public (affiché sur le profil)</Label>
                  <div className="relative">
                    <Input 
                      className="pl-10"
                      value={profile.externalEmail} 
                      onChange={(e) => setProfile({ ...profile, externalEmail: e.target.value })}
                      placeholder="contact@agence.com"
                    />
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Site Web</Label>
                  <div className="relative">
                    <Input 
                      className="pl-10"
                      value={profile.website} 
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://www.monagence.com"
                    />
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réseaux Sociaux</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                </Label>
                <Input 
                  placeholder="URL Facebook"
                  value={profile.socialLinks?.facebook || ""}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, facebook: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-[#E4405F]" /> Instagram
                </Label>
                <Input 
                  placeholder="URL Instagram"
                  value={profile.socialLinks?.instagram || ""}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, instagram: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                </Label>
                <Input 
                  placeholder="URL LinkedIn"
                  value={profile.socialLinks?.linkedin || ""}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: e.target.value } })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Horaires d'ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'mon', label: 'Lundi' },
                { key: 'tue', label: 'Mardi' },
                { key: 'wed', label: 'Mercredi' },
                { key: 'thu', label: 'Jeudi' },
                { key: 'fri', label: 'Vendredi' },
                { key: 'sat', label: 'Samedi' },
                { key: 'sun', label: 'Dimanche' },
              ].map((day) => (
                <div key={day.key} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{day.label}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`closed-${day.key}`}
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                        checked={profile.horaires[day.key]?.closed || false}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          horaires: { 
                            ...profile.horaires, 
                            [day.key]: { ...profile.horaires[day.key], closed: e.target.checked } 
                          } 
                        })}
                      />
                      <Label htmlFor={`closed-${day.key}`} className="text-xs cursor-pointer">Fermé</Label>
                    </div>
                  </div>
                  {!profile.horaires[day.key]?.closed && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time" 
                        className="h-8 text-xs" 
                        value={profile.horaires[day.key]?.open || ""}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          horaires: { 
                            ...profile.horaires, 
                            [day.key]: { ...profile.horaires[day.key], open: e.target.value } 
                          } 
                        })}
                      />
                      <span className="text-xs">-</span>
                      <Input 
                        type="time" 
                        className="h-8 text-xs" 
                        value={profile.horaires[day.key]?.close || ""}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          horaires: { 
                            ...profile.horaires, 
                            [day.key]: { ...profile.horaires[day.key], close: e.target.value } 
                          } 
                        })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prestations & Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  id="new-prestation-editor"
                  placeholder="Nouveau service..."
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val && !profile.prestations.includes(val)) {
                        setProfile({ ...profile, prestations: [...profile.prestations, val] });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button size="sm" onClick={() => {
                  const el = document.getElementById('new-prestation-editor') as HTMLInputElement;
                  const val = el.value.trim();
                  if (val && !profile.prestations.includes(val)) {
                    setProfile({ ...profile, prestations: [...profile.prestations, val] });
                    el.value = "";
                  }
                }}>Ajouter</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.prestations.map((p: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 px-2 py-1 bg-primary/5 text-primary border-primary/20">
                    {p}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setProfile({ ...profile, prestations: profile.prestations.filter((_ : any, idx: number) => idx !== i) })} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
