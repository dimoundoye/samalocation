import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
    Mail, Send, Building2, Gift, FileText, ShieldCheck, 
    AlertTriangle, Ban, Sparkles, RefreshCw, CheckCircle2, 
    Clock, Eye, Laptop, Smartphone, Users, UserCheck, KeyRound
} from "lucide-react";
import { 
    sendAdminEmail, previewAdminEmail, getEmailLogs, 
    getPropertiesForEmail, EmailLog, EmailPropertyOption 
} from "@/api/adminEmails";

interface TemplateDefinition {
    id: string;
    title: string;
    category: string;
    badgeColor: string;
    icon: any;
    description: string;
    defaultAudience: 'all' | 'tenants' | 'owners' | 'custom';
}

const TEMPLATES: TemplateDefinition[] = [
    {
        id: "new_property",
        title: "Nouveau bien disponible",
        category: "Marketing",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
        icon: Building2,
        description: "Annoncez une nouvelle offre de location aux locataires avec fiche du bien et photos",
        defaultAudience: "tenants"
    },
    {
        id: "referral_program",
        title: "Programme Parrainage Bailleurs",
        category: "Croissance / Fidélisation",
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
        icon: Gift,
        description: "Incitez les propriétaires à parrainer pour débloquer jusqu'à 5 mois d'abonnement gratuits",
        defaultAudience: "owners"
    },
    {
        id: "terms_update",
        title: "Mise à jour CGU & Confidentialité",
        category: "Légal & Conformité",
        badgeColor: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
        icon: FileText,
        description: "Notification formelle de mise à jour des conditions générales et politique de vie privée",
        defaultAudience: "all"
    },
    {
        id: "security_tips",
        title: "Conseils Sécurité & Anti-Arnaque",
        category: "Sensibilisation",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
        icon: ShieldCheck,
        description: "Rappel des 4 règles d'or pour louer en toute sérénité (aucun versement avant visite, etc.)",
        defaultAudience: "all"
    },
    {
        id: "account_suspended",
        title: "Avis officiel de suspension de compte",
        category: "Modération",
        badgeColor: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
        icon: Ban,
        description: "Notification officielle de suspension ou blocage d'un compte avec motif de la sanction",
        defaultAudience: "custom"
    },
    {
        id: "user_reported_warning",
        title: "Avertissement suite à signalement",
        category: "Modération",
        badgeColor: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
        icon: AlertTriangle,
        description: "Avertissement officiel adressé à un compte signalé pour comportement non conforme",
        defaultAudience: "custom"
    },
    {
        id: "custom",
        title: "Message Libre & Annonce Générale",
        category: "Général",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
        icon: Mail,
        description: "Rédigez un message sur mesure avec titre, corps riche et bouton d'action au choix",
        defaultAudience: "all"
    }
];

export const AdminEmailsManagement = () => {
    const { toast } = useToast();
    
    // State principal
    const [selectedTemplate, setSelectedTemplate] = useState<string>("new_property");
    const [targetAudience, setTargetAudience] = useState<'all' | 'tenants' | 'owners' | 'custom'>("tenants");
    const [customRecipientEmail, setCustomRecipientEmail] = useState<string>("");
    const [customRecipientName, setCustomRecipientName] = useState<string>("");
    const [customSubject, setCustomSubject] = useState<string>("");

    // Données de formulaire contextuelles selon le template
    const [propertyTitle, setPropertyTitle] = useState<string>("");
    const [propertyLocation, setPropertyLocation] = useState<string>("");
    const [propertyPrice, setPropertyPrice] = useState<string>("250000");
    const [propertyType, setPropertyType] = useState<string>("Appartement");
    const [propertyBedrooms, setPropertyBedrooms] = useState<string>("2");
    const [propertyImage, setPropertyImage] = useState<string>("");
    const [propertyUrl, setPropertyUrl] = useState<string>("");

    const [effectiveDate, setEffectiveDate] = useState<string>("1er novembre 2024");
    const [suspensionReason, setSuspensionReason] = useState<string>("Non-respect répété des conditions d'utilisation et signalements d'utilisateurs vérifiés.");
    const [warningReason, setWarningReason] = useState<string>("Annonce avec informations imprécises ou photos non conformes.");
    
    const [customTitle, setCustomTitle] = useState<string>("");
    const [customMessage, setCustomMessage] = useState<string>("");
    const [customButtonText, setCustomButtonText] = useState<string>("");
    const [customButtonUrl, setCustomButtonUrl] = useState<string>("");

    // Biens récents pour le template "new_property"
    const [availableProperties, setAvailableProperties] = useState<EmailPropertyOption[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

    // Logs & Historique
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

    // Prévisualisation
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [previewSubject, setPreviewSubject] = useState<string>("");
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    // Dialogue de confirmation
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
    const [sending, setSending] = useState<boolean>(false);

    // Initialisation
    useEffect(() => {
        loadProperties();
        loadLogs();
    }, []);

    // Mise à jour de l'audience par défaut quand on change de template
    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const tpl = TEMPLATES.find(t => t.id === templateId);
        if (tpl) {
            setTargetAudience(tpl.defaultAudience);
        }
    };

    // Chargement des biens récents
    const loadProperties = async () => {
        try {
            const data = await getPropertiesForEmail();
            setAvailableProperties(data || []);
            if (data && data.length > 0) {
                applyPropertyToForm(data[0]);
            }
        } catch (error) {
            console.error("Erreur chargement biens pour email:", error);
        }
    };

    // Remplissage automatique lors du choix d'un bien
    const applyPropertyToForm = (prop: EmailPropertyOption) => {
        setSelectedPropertyId(prop.id);
        setPropertyTitle(prop.title || "");
        setPropertyLocation(`${prop.address || ''}${prop.city ? `, ${prop.city}` : ''}`.trim() || "Dakar, Sénégal");
        setPropertyPrice(prop.price ? String(prop.price) : "250000");
        setPropertyType(prop.property_type || "Appartement");
        setPropertyBedrooms(prop.bedrooms ? String(prop.bedrooms) : "2");
        const img = (prop.images && prop.images.length > 0) ? prop.images[0] : "";
        setPropertyImage(img);
        setPropertyUrl(`${window.location.origin}/property/${prop.id}`);
    };

    // Chargement des logs
    const loadLogs = async () => {
        try {
            setLoadingLogs(true);
            const data = await getEmailLogs();
            setLogs(data || []);
        } catch (error) {
            console.error("Erreur chargement logs email:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Construction du payload de données pour le template
    const getTemplateData = () => {
        switch (selectedTemplate) {
            case "new_property":
                return {
                    propertyTitle,
                    propertyLocation,
                    propertyPrice: Number(propertyPrice) || 0,
                    propertyType,
                    bedrooms: Number(propertyBedrooms) || 0,
                    propertyImage,
                    propertyUrl
                };
            case "referral_program":
                return {
                    referralCode: "PROP-DEMO-99",
                    referralCount: 2
                };
            case "terms_update":
                return {
                    effectiveDate
                };
            case "security_tips":
                return {};
            case "account_suspended":
                return {
                    reason: suspensionReason,
                    date: new Date().toLocaleDateString('fr-FR')
                };
            case "user_reported_warning":
                return {
                    reason: warningReason
                };
            case "custom":
            default:
                return {
                    title: customTitle || "Information importante SamaLocation",
                    message: customMessage || "Bonjour,\n\nNous vous informons d'une nouveauté sur notre plateforme.",
                    buttonText: customButtonText,
                    buttonUrl: customButtonUrl
                };
        }
    };

    // Génération de la prévisualisation
    const handleGeneratePreview = async () => {
        try {
            setLoadingPreview(true);
            const res = await previewAdminEmail({
                templateId: selectedTemplate,
                templateData: getTemplateData()
            });

            if (res) {
                setPreviewHtml(res.html || "");
                setPreviewSubject(customSubject || res.subject || "");
            }
        } catch (error: any) {
            toast({
                title: "Erreur prévisualisation",
                description: error.message || "Impossible de générer l'aperçu.",
                variant: "destructive"
            });
        } finally {
            setLoadingPreview(false);
        }
    };

    // Envoi effectif de la campagne
    const handleSendCampaign = async () => {
        if (targetAudience === 'custom' && (!customRecipientEmail || !customRecipientEmail.includes('@'))) {
            toast({
                title: "Adresse e-mail requise",
                description: "Veuillez renseigner une adresse e-mail valide pour la cible personnalisée.",
                variant: "destructive"
            });
            return;
        }

        try {
            setSending(true);
            const res = await sendAdminEmail({
                templateId: selectedTemplate,
                targetAudience,
                customRecipientEmail: targetAudience === 'custom' ? customRecipientEmail.trim() : undefined,
                customRecipientName: targetAudience === 'custom' ? customRecipientName.trim() : undefined,
                customSubject: customSubject.trim() || undefined,
                templateData: getTemplateData()
            });

            toast({
                title: "Campagne envoyée avec succès ! 🚀",
                description: res?.message || `${res?.sent || 1} e-mail(s) distribué(s).`,
            });

            setConfirmModalOpen(false);
            loadLogs();
        } catch (error: any) {
            toast({
                title: "Erreur lors de l'envoi",
                description: error.message || "Une erreur est survenue lors de l'envoi des e-mails.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const currentTemplateObj = TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
                        <Mail className="h-7 w-7 text-primary" />
                        Emails & Campagnes de Diffusion
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Communiquez efficacement avec vos locataires, bailleurs et utilisateurs grâce à des modèles pré-conçus et professionnels.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadLogs} 
                    className="self-start sm:self-auto gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            <Tabs defaultValue="compose" className="space-y-6">
                <TabsList className="bg-secondary/60 p-1 rounded-xl">
                    <TabsTrigger value="compose" className="gap-2 text-sm font-semibold rounded-lg">
                        <Send className="h-4 w-4" />
                        Créer & Diffuser un E-mail
                    </TabsTrigger>
                    <TabsTrigger value="history" onClick={() => loadLogs()} className="gap-2 text-sm font-semibold rounded-lg">
                        <Clock className="h-4 w-4" />
                        Historique des Envois ({logs.length})
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: COMPOSE & SEND */}
                <TabsContent value="compose" className="space-y-6">
                    {/* Étape 1 : Choix du Template */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-black">1</span>
                                Choisissez un Modèle d'E-mail (Template)
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                            {TEMPLATES.map((tpl) => {
                                const IconComponent = tpl.icon;
                                const isSelected = selectedTemplate === tpl.id;
                                return (
                                    <div
                                        key={tpl.id}
                                        onClick={() => handleTemplateSelect(tpl.id)}
                                        className={`cursor-pointer rounded-xl p-3 sm:p-4 border transition-all duration-200 relative flex flex-col justify-between ${
                                            isSelected 
                                                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" 
                                                : "border-border hover:border-primary/40 hover:bg-secondary/40 bg-card"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-1.5 mb-2">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
                                                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </div>
                                                <Badge variant="outline" className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 truncate max-w-[100px] ${tpl.badgeColor}`}>
                                                    {tpl.category}
                                                </Badge>
                                            </div>
                                            <h4 className="font-bold text-xs sm:text-sm text-foreground mb-1 leading-snug line-clamp-2">
                                                {tpl.title}
                                            </h4>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                                                {tpl.description}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary">
                                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Sélectionné
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Étape 2 : Configuration & Formulaire */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Formulaire de configuration (gauche) */}
                        <div className="lg:col-span-6 space-y-5">
                            <Card className="shadow-soft">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-black">2</span>
                                        Destinataires & Personnalisation
                                    </CardTitle>
                                    <CardDescription>
                                        Configurez la cible de diffusion et les variables du message.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Cible des destinataires */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-sm">Cible de diffusion</Label>
                                        <Select 
                                            value={targetAudience} 
                                            onValueChange={(val: any) => setTargetAudience(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez les destinataires" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-primary" />
                                                        <span>Tous les utilisateurs inscrits</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="tenants">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="h-4 w-4 text-blue-600" />
                                                        <span>Locataires uniquement</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="owners">
                                                    <div className="flex items-center gap-2">
                                                        <KeyRound className="h-4 w-4 text-emerald-600" />
                                                        <span>Propriétaires / Bailleurs uniquement</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="custom">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-amber-600" />
                                                        <span>Destinataire unique (Email spécifique)</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Si destinataire spécifique */}
                                    {targetAudience === 'custom' && (
                                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold text-foreground">Adresse e-mail du destinataire *</Label>
                                                <Input 
                                                    placeholder="ex: client@gmail.com" 
                                                    value={customRecipientEmail}
                                                    onChange={(e) => setCustomRecipientEmail(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold text-foreground">Nom complet (Optionnel)</Label>
                                                <Input 
                                                    placeholder="ex: Amadou Diallo" 
                                                    value={customRecipientName}
                                                    onChange={(e) => setCustomRecipientName(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Sujet personnalisé facultatif */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Objet de l'e-mail (Laissez vide pour le sujet par défaut)</Label>
                                        <Input 
                                            placeholder="ex: Sujet personnalisé pour cette campagne..." 
                                            value={customSubject}
                                            onChange={(e) => setCustomSubject(e.target.value)}
                                        />
                                    </div>

                                    {/* Formulaire spécifique : Nouveau bien */}
                                    {selectedTemplate === 'new_property' && (
                                        <div className="border-t pt-4 space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-bold text-sm flex items-center gap-1.5 text-primary">
                                                    <Sparkles className="h-4 w-4" /> Sélectionner un bien récent
                                                </Label>
                                                <span className="text-xs text-muted-foreground">Pré-remplissage auto</span>
                                            </div>

                                            {availableProperties.length > 0 ? (
                                                <Select 
                                                    value={selectedPropertyId} 
                                                    onValueChange={(val) => {
                                                        const p = availableProperties.find(item => item.id === val);
                                                        if (p) applyPropertyToForm(p);
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choisir un bien..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableProperties.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.title} - {p.city || 'Dakar'} ({new Intl.NumberFormat('fr-FR').format(p.price)} FCFA)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">Aucun bien publié récent trouvé.</p>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Titre du bien</Label>
                                                    <Input value={propertyTitle} onChange={(e) => setPropertyTitle(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Localisation / Quartier</Label>
                                                    <Input value={propertyLocation} onChange={(e) => setPropertyLocation(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Loyer mensuel (FCFA)</Label>
                                                    <Input type="number" value={propertyPrice} onChange={(e) => setPropertyPrice(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Nombre de chambres</Label>
                                                    <Input type="number" value={propertyBedrooms} onChange={(e) => setPropertyBedrooms(e.target.value)} />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs">URL de la photo de couverture</Label>
                                                <Input value={propertyImage} onChange={(e) => setPropertyImage(e.target.value)} placeholder="https://..." />
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire spécifique : Parrainage */}
                                    {selectedTemplate === 'referral_program' && (
                                        <div className="border-t pt-4 space-y-3 bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/20">
                                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                                                <Gift className="h-4 w-4" /> Personnalisation dynamique active
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Chaque propriétaire destinataire recevra un e-mail avec <strong>son propre code de parrainage</strong>, son lien direct et un bouton de partage WhatsApp personnalisé en 1 clic !
                                            </p>
                                            <div className="text-xs font-mono bg-background p-2 rounded border">
                                                Code parrain : [Propriétaire.custom_id] <br />
                                                Progression : [Propriétaire.referral_count] / 5 mois offerts
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire spécifique : CGU / Conditions */}
                                    {selectedTemplate === 'terms_update' && (
                                        <div className="border-t pt-4 space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold">Date d'entrée en vigueur</Label>
                                                <Input 
                                                    value={effectiveDate} 
                                                    onChange={(e) => setEffectiveDate(e.target.value)} 
                                                    placeholder="ex: Immédiatement, ou 1er novembre 2024"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire spécifique : Suspension */}
                                    {selectedTemplate === 'account_suspended' && (
                                        <div className="border-t pt-4 space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold text-red-600 dark:text-red-400">Motif officiel de la suspension *</Label>
                                                <Textarea 
                                                    rows={3} 
                                                    value={suspensionReason} 
                                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                                    placeholder="Précisez la raison de la suspension du compte..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire spécifique : Avertissement */}
                                    {selectedTemplate === 'user_reported_warning' && (
                                        <div className="border-t pt-4 space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold text-amber-600 dark:text-amber-400">Objet du signalement & motif de rappel à l'ordre *</Label>
                                                <Textarea 
                                                    rows={3} 
                                                    value={warningReason} 
                                                    onChange={(e) => setWarningReason(e.target.value)}
                                                    placeholder="Expliquez la faute constatée..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulaire spécifique : Message Libre */}
                                    {selectedTemplate === 'custom' && (
                                        <div className="border-t pt-4 space-y-3">
                                            <div>
                                                <Label className="text-xs font-bold">Titre principal dans l'e-mail</Label>
                                                <Input 
                                                    value={customTitle} 
                                                    onChange={(e) => setCustomTitle(e.target.value)} 
                                                    placeholder="ex: Grande mise à jour SamaLocation"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold">Corps du message (Texte complet)</Label>
                                                <Textarea 
                                                    rows={6} 
                                                    value={customMessage} 
                                                    onChange={(e) => setCustomMessage(e.target.value)} 
                                                    placeholder="Rédigez votre message ici. Les sauts de ligne sont conservés..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div>
                                                    <Label className="text-xs">Texte du bouton CTA (Optionnel)</Label>
                                                    <Input 
                                                        value={customButtonText} 
                                                        onChange={(e) => setCustomButtonText(e.target.value)} 
                                                        placeholder="ex: En savoir plus"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Lien du bouton (Optionnel)</Label>
                                                    <Input 
                                                        value={customButtonUrl} 
                                                        onChange={(e) => setCustomButtonUrl(e.target.value)} 
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 flex flex-wrap gap-2">
                                        <Button 
                                            variant="secondary" 
                                            className="flex-1 gap-2" 
                                            onClick={handleGeneratePreview}
                                            disabled={loadingPreview}
                                        >
                                            <Eye className="h-4 w-4" />
                                            {loadingPreview ? "Génération..." : "Actualiser l'aperçu"}
                                        </Button>

                                        <Button 
                                            variant="default" 
                                            className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
                                            onClick={() => setConfirmModalOpen(true)}
                                        >
                                            <Send className="h-4 w-4" />
                                            Diffuser la campagne
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Fenêtre de prévisualisation en direct (droite) */}
                        <div className="lg:col-span-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-sm">Aperçu en direct (Live Preview)</h3>
                                </div>
                                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border text-xs">
                                    <button
                                        onClick={() => setPreviewDevice('desktop')}
                                        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${previewDevice === 'desktop' ? 'bg-primary text-white font-bold' : 'text-muted-foreground'}`}
                                    >
                                        <Laptop className="h-3.5 w-3.5" /> Desktop
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice('mobile')}
                                        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${previewDevice === 'mobile' ? 'bg-primary text-white font-bold' : 'text-muted-foreground'}`}
                                    >
                                        <Smartphone className="h-3.5 w-3.5" /> Mobile
                                    </button>
                                </div>
                            </div>

                            <Card className="border-border shadow-soft overflow-hidden">
                                {/* En-tête simulateur client de messagerie */}
                                <div className="bg-secondary/40 p-3 border-b text-xs space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-bold text-foreground">De :</span> SamaLocation &lt;contact@samalocation.com&gt;
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-bold text-foreground">À :</span> {targetAudience === 'all' ? 'Tous les utilisateurs' : targetAudience === 'tenants' ? 'Locataires' : targetAudience === 'owners' ? 'Propriétaires' : (customRecipientEmail || 'client@example.com')}
                                    </div>
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <span className="text-muted-foreground font-bold">Objet :</span> {previewSubject || currentTemplateObj?.title}
                                    </div>
                                </div>

                                {/* Iframe ou conteneur de rendu HTML */}
                                <div className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-[380px] p-2' : 'w-full'}`}>
                                    {previewHtml ? (
                                        <iframe
                                            srcDoc={previewHtml}
                                            title="Prévisualisation e-mail"
                                            className="w-full h-[580px] rounded-b-lg border-0 bg-white"
                                            sandbox="allow-same-origin"
                                        />
                                    ) : (
                                        <div className="h-[520px] flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-secondary/10">
                                            <Eye className="h-10 w-10 mb-3 opacity-30 text-primary" />
                                            <p className="font-semibold text-sm mb-2">Aucun aperçu généré pour l'instant</p>
                                            <p className="text-xs max-w-sm mb-4">Cliquez sur « Actualiser l'aperçu » pour visualiser le rendu HTML exact de cet e-mail.</p>
                                            <Button size="sm" variant="outline" onClick={handleGeneratePreview}>
                                                Générer l'aperçu
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: LOGS & HISTORIQUE */}
                <TabsContent value="history" className="space-y-4">
                    <Card className="shadow-soft">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Historique des campagnes d'e-mails diffusées</span>
                                <Badge variant="secondary">{logs.length} envoi(s)</Badge>
                            </CardTitle>
                            <CardDescription>
                                Consultez la liste des e-mails automatiques et campagnes envoyés depuis l'administration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Mail className="h-10 w-10 mx-auto mb-2 opacity-25" />
                                    <p className="text-sm font-semibold">Aucune campagne envoyée pour le moment</p>
                                    <p className="text-xs">Les e-mails diffusés apparaîtront ici automatiquement.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                                                <th className="py-3 px-3 text-left">Date</th>
                                                <th className="py-3 px-3 text-left">Modèle (Template)</th>
                                                <th className="py-3 px-3 text-left">Objet</th>
                                                <th className="py-3 px-3 text-left">Audience</th>
                                                <th className="py-3 px-3 text-center">Destinataires</th>
                                                <th className="py-3 px-3 text-right">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {logs.map((log) => {
                                                const dateStr = new Date(log.created_at).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });

                                                return (
                                                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                                                        <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                            {dateStr}
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-xs whitespace-nowrap">
                                                            <span className="font-mono bg-secondary px-2 py-0.5 rounded">
                                                                {log.template_id}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 font-medium text-xs max-w-xs truncate" title={log.subject}>
                                                            {log.subject}
                                                        </td>
                                                        <td className="py-3 px-3 text-xs">
                                                            <Badge variant="outline" className="capitalize">
                                                                {log.target_audience === 'all' ? 'Tous' : log.target_audience}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-bold text-xs">
                                                            {log.recipient_count}
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <Badge className={
                                                                log.status === 'sent' ? 'bg-emerald-600 text-white' :
                                                                log.status === 'partial' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                                                            }>
                                                                {log.status === 'sent' ? 'Envoyé' : log.status === 'partial' ? 'Partiel' : 'Échec'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de confirmation avant envoi */}
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" /> Confirmer l'envoi de la campagne
                        </DialogTitle>
                        <DialogDescription>
                            Vérifiez les paramètres de diffusion avant de confirmer l'expédition des e-mails.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-3 text-sm">
                        <div className="bg-secondary/40 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Modèle sélectionné :</span>
                                <span className="font-bold">{currentTemplateObj?.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cible :</span>
                                <span className="font-bold capitalize">
                                    {targetAudience === 'all' ? 'Tous les utilisateurs' :
                                     targetAudience === 'tenants' ? 'Locataires uniquement' :
                                     targetAudience === 'owners' ? 'Propriétaires uniquement' :
                                     customRecipientEmail}
                                </span>
                            </div>
                        </div>

                        {targetAudience !== 'custom' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                                ⚠️ Attention : Cet e-mail sera expédié à l'ensemble des utilisateurs correspondant à cette catégorie. L'opération ne peut pas être annulée une fois lancée.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setConfirmModalOpen(false)}
                            disabled={sending}
                        >
                            Annuler
                        </Button>
                        <Button 
                            onClick={handleSendCampaign}
                            disabled={sending}
                            className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                            {sending ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" /> Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" /> Confirmer & Envoyer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminEmailsManagement;
