import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getOwnerProfile, updateOwnerProfile } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/shared/AccountSettings";
import { X, FileText, Scan, Shield, CheckCircle2, Clock, Crown } from "lucide-react";
import { SignatureScanner } from "./SignatureScanner";
import { uploadPhotos, getMySubscription } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { UpgradeModal } from "./UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import classicImg from "@/assets/classic.png";
import modernImg from "@/assets/modern.png";
import minimalImg from "@/assets/minimal.png";
import agenceImg from "@/assets/agence.png";

export const OwnerSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
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
    logoUrl: "",
    idCardUrl: "",
    ownershipProofUrl: "",
    livenessSelfieUrl: "",
    verificationStatus: "none" as "none" | "pending" | "verified" | "rejected",
    receiptTemplate: "classic",
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const { hasFeature } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState({
    open: false,
    title: "",
    description: ""
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
          logoUrl: data.logo_url || "",
          idCardUrl: data.id_card_url || "",
          ownershipProofUrl: data.ownership_proof_url || "",
          livenessSelfieUrl: data.liveness_selfie_url || "",
          verificationStatus: data.verification_status || "none",
          receiptTemplate: data.receipt_template || "classic",
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('common.loading_error'),
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
        id_card_url: profile.idCardUrl,
        ownership_proof_url: profile.ownershipProofUrl,
        liveness_selfie_url: profile.livenessSelfieUrl,
        verification_status: profile.verificationStatus,
        receipt_template: profile.receiptTemplate,
        logo_url: profile.logoUrl,
      };

      const result = await updateOwnerProfile(profileData);

      if (!result) {
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      toast({
        title: t('common.success'),
        description: t('common.save_success'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('common.save_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'idCardUrl' | 'ownershipProofUrl' | 'livenessSelfieUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const urls = await uploadPhotos([file]);
      if (urls && urls.length > 0) {
        setProfile({
          ...profile,
          [field]: urls[0],
        });
        toast({
          title: t('common.upload_success'),
          description: t('common.save_success'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.upload_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasFeature('branding')) {
      setUpgradeModal({
        open: true,
        title: "Logo et Branding non inclus",
        description: "L'ajout d'un logo personnalisé sur vos quittances est une fonctionnalité exclusive des plans supérieurs."
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const urls = await uploadPhotos([file]);
      if (urls && urls.length > 0) {
        setProfile({
          ...profile,
          logoUrl: urls[0],
        });
        toast({
          title: t('common.upload_success'),
          description: t('common.save_success'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.upload_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('settings.title')}</h2>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">{t('settings.profile_tab')}</TabsTrigger>
          <TabsTrigger value="account">{t('settings.account_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">{t('settings.full_name')}</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder={t('settings.full_name_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">{t('settings.company_name')}</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder={t('settings.company_placeholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">{t('settings.contact_phone')}</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={profile.contactPhone}
                    onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                    placeholder={t('settings.phone_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">{t('settings.contact_email')}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                    placeholder={t('settings.email_placeholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t('common.address')}</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder={t('settings.address_placeholder')}
                />
              </div>

              <div>
                <Label htmlFor="bio">{t('settings.bio')}</Label>
                <Input
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder={t('settings.bio_placeholder')}
                />
              </div>

              <div className="space-y-6 pt-6 border-t mt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">{t('settings.identity_verification')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.verification_desc')}</p>
                  </div>
                  <div className="flex gap-2">
                    {profile.verificationStatus === 'verified' && (
                      <Badge className="bg-green-500 hover:bg-green-600 gap-1.5 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('settings.profile_verified')}
                      </Badge>
                    )}
                    {profile.verificationStatus === 'pending' && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 gap-1.5 px-3 py-1">
                        <Clock className="h-3.5 w-3.5" /> {t('settings.verification_pending')}
                      </Badge>
                    )}
                    {profile.verificationStatus === 'rejected' && (
                      <Badge variant="destructive" className="gap-1.5 px-3 py-1">
                        <X className="h-3.5 w-3.5" /> {t('settings.verification_rejected')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> {t('settings.verification_docs_desc')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ID Card */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.id_card')}</Label>
                      <div className="relative aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-background group overflow-hidden">
                        {profile.idCardUrl ? (
                          <>
                            <img src={profile.idCardUrl} alt="ID" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="destructive" size="icon" onClick={() => setProfile({ ...profile, idCardUrl: "" })}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <FileText className="h-8 w-8 mx-auto mb-1 opacity-20" />
                            <p className="text-[10px]">{t('settings.id_card_desc')}</p>
                            <label className="mt-2 block">
                              <Button variant="secondary" size="sm" className="h-7 text-[10px]" asChild>
                                <span>{t('common.change')}</span>
                              </Button>
                              <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'idCardUrl')} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ownership Proof */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.ownership_proof')}</Label>
                      <div className="relative aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-background group overflow-hidden">
                        {profile.ownershipProofUrl ? (
                          <>
                            <img src={profile.ownershipProofUrl} alt="Proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="destructive" size="icon" onClick={() => setProfile({ ...profile, ownershipProofUrl: "" })}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <Shield className="h-8 w-8 mx-auto mb-1 opacity-20" />
                            <p className="text-[10px]">{t('settings.proof_desc')}</p>
                            <label className="mt-2 block">
                              <Button variant="secondary" size="sm" className="h-7 text-[10px]" asChild>
                                <span>{t('common.change')}</span>
                              </Button>
                              <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ownershipProofUrl')} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selfie Liveness */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.liveness_check')}</Label>
                      <div className="relative aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-background group overflow-hidden">
                        {profile.livenessSelfieUrl ? (
                          <>
                            <img src={profile.livenessSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="destructive" size="icon" onClick={() => setProfile({ ...profile, livenessSelfieUrl: "" })}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <Scan className="h-8 w-8 mx-auto mb-1 opacity-20" />
                            <p className="text-[10px]">{t('settings.selfie_desc')}</p>
                            <label className="mt-2 block">
                              <Button variant="secondary" size="sm" className="h-7 text-[10px]" asChild>
                                <span>{t('common.change')}</span>
                              </Button>
                              <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'livenessSelfieUrl')} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {profile.verificationStatus !== 'verified' && profile.verificationStatus !== 'pending' && (
                    <Button
                      className="w-full mt-4"
                      disabled={!profile.idCardUrl || !profile.ownershipProofUrl || !profile.livenessSelfieUrl || loading}
                      onClick={() => {
                        setProfile({ ...profile, verificationStatus: 'pending' });
                        toast({
                          title: t('common.success'),
                          description: t('settings.verification_pending'),
                        });
                      }}
                    >
                      {t('settings.submit_id')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">{t('settings.signature_stamp')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.signature_desc')}
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
                      <span className="text-xs">{t('settings.no_signature')}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setScannerOpen(true)}
                      className="gap-2"
                    >
                      <Scan className="h-4 w-4" /> {t('settings.scan_signature_stamp')}
                    </Button>

                    <SignatureScanner
                      open={scannerOpen}
                      onOpenChange={setScannerOpen}
                      onSave={async (blob) => {
                        try {
                          setLoading(true);
                          const file = new File([blob], "signature.png", { type: "image/png" });
                          const urls = await uploadPhotos([file]);
                          if (urls && urls.length > 0) {
                            setProfile({ ...profile, signatureUrl: urls[0] });
                            toast({
                              title: t('common.success'),
                              description: t('common.save_success'),
                            });
                          }
                        } catch (error) {
                          toast({
                            title: t('common.error'),
                            description: t('common.upload_error'),
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

              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col gap-1">
                  <Label className="text-base font-semibold">{t('settings.branding')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.branding_desc')}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {!hasFeature('branding') ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold">Branding Personnalisé</h4>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Pour faire afficher votre propre logo sur vos reçus, vous devez passer à un format <strong>Entreprise</strong> (Plan Professionnel).
                        </p>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="gradient-primary text-white"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        Passer au plan Professionnel
                      </Button>
                    </div>
                  ) : (
                    <>
                      {profile.logoUrl ? (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
                          <img
                            src={profile.logoUrl}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setProfile({ ...profile, logoUrl: "" })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
                          <Shield className="h-8 w-8 opacity-20" />
                          <span className="text-xs">{t('settings.no_logo')}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          asChild
                        >
                          <label className="cursor-pointer">
                            <Scan className="h-4 w-4" /> {t('settings.upload_logo')}
                            <Input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col gap-1">
                  <Label className="text-base font-semibold">{t('settings.receipt_form')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.receipt_form_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'classic', name: t('settings.receipt_templates.classic'), img: classicImg, premium: false },
                    { id: 'modern', name: t('settings.receipt_templates.modern'), img: modernImg, premium: false },
                    { id: 'minimal', name: t('settings.receipt_templates.minimal'), img: minimalImg, premium: false },
                    { id: 'corporate', name: t('settings.receipt_templates.corporate'), img: agenceImg, premium: true }
                  ].map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        if (template.premium && !hasFeature('branding')) {
                          setUpgradeModal({
                            open: true,
                            title: "Modèle Premium",
                            description: "Le modèle d'agence est réservé aux utilisateurs disposant du plan Professionnel."
                          });
                          return;
                        }
                        setProfile({ ...profile, receiptTemplate: template.id });
                      }}
                      className={`relative cursor-pointer group rounded-xl border-2 transition-all p-2 bg-card hover:shadow-md ${profile.receiptTemplate === template.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-muted hover:border-muted-foreground/30'
                        }`}
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted mb-2 border shadow-sm">
                        <img
                          src={template.img}
                          alt={template.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <span className={`text-sm font-medium ${profile.receiptTemplate === template.id ? 'text-primary' : 'text-foreground'}`}>
                          {template.name}
                        </span>
                        {profile.receiptTemplate === template.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>

                      {profile.receiptTemplate === template.id && (
                        <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto">
                {loading ? t('settings.saving') : t('settings.save_changes')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>
      </Tabs>

      <UpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) => setUpgradeModal(prev => ({ ...prev, open }))}
        title={upgradeModal.title}
        description={upgradeModal.description}
      />
    </div>
  );
};
