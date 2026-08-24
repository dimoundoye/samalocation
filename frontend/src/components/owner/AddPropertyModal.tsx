import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Home,
  Warehouse,
  Building2,
  Building,
  BedDouble,
  Store,
  Upload,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createProperty, createPropertyUnits, uploadPhotos, generateAIDescription, getMySubscription, getOwnerProperties } from "@/lib/api";
import { getPropertyGroups, syncPropertyGroups } from "@/api/propertyGroups";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/lib/imageCompression";
import LocationPicker from "./LocationPicker";
import { UpgradeModal } from "./UpgradeModal";
import { useEffect } from "react";

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddPropertyModal = ({ open, onOpenChange, onSuccess }: AddPropertyModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [propertyType, setPropertyType] = useState<string>("");
  const [propertyData, setPropertyData] = useState({
    name: "",
    address: "",
    description: "",
    latitude: "",
    longitude: "",
    listing_type: "location",
    sale_price: "",
  });
  const [propertyEquipments, setPropertyEquipments] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
  const [propertyPhotosPreviews, setPropertyPhotosPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [nameConflict, setNameConflict] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({
    open: false,
    title: "",
    description: "",
    feature: ""
  });
  const generalInfoRef = useRef<HTMLDivElement>(null);

  const [customGroups, setCustomGroups] = useState<{ id: string; name: string; propertyIds: string[]; parentId?: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("none");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupParentId, setNewGroupParentId] = useState<string>("none");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroupExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  useEffect(() => {
    if (open) {
      loadSubscription();
    }
  }, [open]);

  const loadSubscription = async () => {
    try {
      const [sub, props, groups] = await Promise.all([
        getMySubscription(),
        getOwnerProperties(),
        getPropertyGroups()
      ]);
      setSubscription(sub);
      setMyProperties(props || []);
      setCustomGroups(groups || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const getFlatGroupOptions = (groups: { id: string; name: string; propertyIds: string[]; parentId?: string }[]) => {
    const result: { id: string; name: string; label: string; depth: number }[] = [];

    const addNodes = (parentId?: string, depth = 0) => {
      const children = groups.filter(g => (parentId ? g.parentId === parentId : !g.parentId));
      children.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));
      children.forEach(group => {
        const prefix = depth > 0 ? `${'\u00A0'.repeat(depth * 3)}↳ ` : '';
        result.push({
          id: group.id,
          name: group.name,
          label: `${prefix}${depth > 0 ? '📁 ' : '📁 '}${group.name}`,
          depth
        });
        addNodes(group.id, depth + 1);
      });
    };

    addNodes(undefined, 0);
    return result;
  };

  // Pour les biens simples, on utilise directement les champs
  const [simplePropertyData, setSimplePropertyData] = useState({
    monthly_rent: "",
    area_sqm: "",
    bedrooms: "",
    bathrooms: "",
    floors: "", // Nombre d'étages (pour maison et villa)
    rent_period: "mois",
    rooms_count: "",
  });

  const addEquipment = () => {
    const value = equipmentInput.trim();
    if (!value) return;

    if (!propertyEquipments.includes(value)) {
      setPropertyEquipments((prev) => [...prev, value]);
    }
    setEquipmentInput("");
  };

  const removeEquipment = (index: number) => {
    setPropertyEquipments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEquipmentKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addEquipment();
    }
  };

  const capitalize = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

  const PROPERTY_LABELS: Record<string, { singular: string; plural: string }> = {
    maison: { singular: "maison", plural: "maisons" },
    garage: { singular: "garage", plural: "garages" },
    appartement: { singular: "appartement", plural: "appartements" },
    studio: { singular: "studio", plural: "studios" },
    chambre: { singular: "chambre", plural: "chambres" },
    locale: { singular: "locale", plural: "locales" },
    terrain: { singular: "terrain", plural: "terrains" },
  };

  const propertyTypes = [
    { value: "maison", label: "Maison", icon: Home },
    { value: "villa", label: "Villa", icon: Layers },
    { value: "appartement", label: "Appartement", icon: Building2 },
    { value: "studio", label: "Studio", icon: Building },
    { value: "chambre", label: "Chambre", icon: BedDouble },
    { value: "garage", label: "Garage", icon: Warehouse },
    { value: "locale", label: "Local", icon: Store },
    { value: "terrain", label: "Terrain", icon: Layers },
  ];

  // Types de biens simples (un seul bien) - tous les types sont maintenant simples
  const isSimpleProperty = ["maison", "villa", "appartement", "studio", "chambre", "garage", "locale", "terrain"].includes(propertyType);

  // Types qui nécessitent des champs supplémentaires (étages, chambres, salles de bain)
  const needsDetailedFields = ["maison", "villa", "appartement", "studio", "chambre"].includes(propertyType);

  const rentPeriodOptions = [
    { value: "jour", label: "Jour" },
    { value: "semaine", label: "Semaine" },
    { value: "mois", label: "Mois" },
  ];



  const handleSubmit = async () => {
    // Guard against double submission
    if (uploading) return;

    if (!propertyType) {
      toast({
        title: "Type requis",
        description: "Veuillez sélectionner le type de propriété.",
        variant: "destructive",
      });
      return;
    }

    if (!propertyData.name.trim() || !propertyData.address.trim()) {
      toast({
        title: "Informations incomplètes",
        description: "Veuillez renseigner le nom et l'adresse de la propriété.",
        variant: "destructive",
      });
      return;
    }

    // Pour les biens simples, vérifier que les champs requis sont remplis
    if (isSimpleProperty) {
      if (propertyData.listing_type === 'location') {
        if (!simplePropertyData.monthly_rent || parseFloat(simplePropertyData.monthly_rent) <= 0) {
          toast({
            title: "Loyer requis",
            description: "Veuillez renseigner le montant du loyer.",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (!propertyData.sale_price || parseFloat(propertyData.sale_price) <= 0) {
          toast({
            title: "Prix de vente requis",
            description: "Veuillez renseigner le prix de vente.",
            variant: "destructive",
          });
          return;
        }
      }
    }


    setUploading(true);
    try {
      // Check subscription limits - REMOVED: Property creation is now free for all plans
      /* 
      if (subscription) {
        if (subscription.properties_limit !== -1 && subscription.properties_count >= subscription.properties_limit) {
          setUpgradeModal({
            open: true,
            title: "Limite de biens atteinte",
            description: `Votre plan actuel (${subscription.plan_name}) est limité à ${subscription.properties_limit} biens. Passez au plan supérieur pour en ajouter plus.`,
            feature: "properties"
          });
          return;
        }
      }
      */

      setUploading(true);
      if (!user) throw new Error("Non authentifié");

      // Préparer les unités
      let preparedUnits: any[] = [];

      if (isSimpleProperty) {
        let monthlyRentValue = 0;
        if (propertyData.listing_type === 'location') {
          monthlyRentValue = parseInt(simplePropertyData.monthly_rent, 10);

          if (Number.isNaN(monthlyRentValue) || monthlyRentValue <= 0) {
            throw new Error("Le loyer doit être un nombre positif.");
          }
        }

        const unitLabels: Record<string, string> = {
          maison: "Maison",
          villa: "Villa",
          appartement: "Appartement",
          chambre: "Chambre",
          garage: "Garage",
          locale: "Local",
        };

        preparedUnits = [{
          unit_type: propertyType,
          unit_number: unitLabels[propertyType] || propertyType,
          monthly_rent: propertyData.listing_type === 'location' ? monthlyRentValue : 0,
          area_sqm: simplePropertyData.area_sqm ? parseFloat(simplePropertyData.area_sqm) : null,
          bedrooms: needsDetailedFields && simplePropertyData.bedrooms
            ? parseInt(simplePropertyData.bedrooms, 10) : 0,
          bathrooms: needsDetailedFields && simplePropertyData.bathrooms
            ? parseInt(simplePropertyData.bathrooms, 10) : 0,
          rooms_count: needsDetailedFields && simplePropertyData.rooms_count
            ? parseInt(simplePropertyData.rooms_count, 10) : 0,
          description: propertyData.description || null,
          is_available: true,
          rent_period: simplePropertyData.rent_period || "mois",
        }];
      } else {
        throw new Error(`Le type de bien "${propertyType}" n'est pas reconnu.`);
      }

      let photoUrls: string[] = [];
      if (propertyPhotos.length > 0) {
        photoUrls = await uploadPhotos(propertyPhotos);
      }

      // Créer la propriété avec ses unités en une seule fois
      const propertyInsert: any = {
        property_type: propertyType,
        name: propertyData.name.trim(),
        address: propertyData.address.trim(),
        description: propertyData.description.trim() || null,
        photos: photoUrls,
        photo_url: photoUrls[0] || null,
        is_published: false,
        equipments: propertyEquipments.length > 0 ? propertyEquipments : null,
        latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : 14.7167,
        longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : -17.4677,
        listing_type: propertyData.listing_type,
        sale_price: propertyData.listing_type === 'vente' ? parseFloat(propertyData.sale_price) : null,
        units: preparedUnits // Ajout des unités ici
      };

      const property = await createProperty(propertyInsert);

      if (!property) {
        throw new Error("Erreur lors de la création de la propriété");
      }

      // Rattacher le bien au dossier ou sous-dossier sélectionné (ou créer le nouveau dossier)
      try {
        if (selectedGroupId === "new" && newGroupName.trim()) {
          const createdGroup = {
            id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: newGroupName.trim(),
            propertyIds: [property.id],
            parentId: newGroupParentId !== "none" ? newGroupParentId : undefined
          };
          await syncPropertyGroups([...customGroups, createdGroup]);
        } else if (selectedGroupId && selectedGroupId !== "none" && selectedGroupId !== "new") {
          const updatedGroups = customGroups.map(g => {
            if (g.id === selectedGroupId) {
              const currentProps = g.propertyIds || [];
              if (!currentProps.includes(property.id)) {
                return { ...g, propertyIds: [...currentProps, property.id] };
              }
            }
            return g;
          });
          await syncPropertyGroups(updatedGroups);
        }
      } catch (groupErr) {
        console.error("Erreur lors du rattachement au dossier:", groupErr);
      }

      toast({
        title: "Bien ajouté",
        description: "Votre bien a été ajouté avec succès. Vous pouvez le publier depuis la liste de vos biens.",
      });

      onSuccess();
      setTimeout(() => {
        handleDialogChange(false);
      }, 300);
    } catch (error: any) {
      toast({
        title: "Action impossible",
        description: "L'ajout du bien a échoué. Veuillez vérifier les informations et réessayer.",
        variant: "destructive",
      });

      // Aussi logger le message complet dans la console pour le développeur
      console.error("Erreur lors de la création:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!propertyData.name || !propertyType || !propertyData.address) {
      toast({
        title: "Informations minimales requises",
        description: "Veuillez renseigner au moins le nom et l'adresse pour que l'IA puisse travailler.",
        variant: "destructive",
      });
      return;
    }

    // Hint: Encouraging more data for better AI
    const hasEnoughData = simplePropertyData.monthly_rent && simplePropertyData.area_sqm && propertyEquipments.length > 0;
    if (!hasEnoughData) {
      toast({
        title: "Conseil pour l'IA",
        description: "Plus vous remplissez de détails (loyer, surface, équipements), plus la description sera riche.",
      });
    }

    try {
      // Check IA feature access
      if (subscription && subscription.limits && subscription.limits.ai_descriptions_per_month === 0) {
        setUpgradeModal({
          open: true,
          title: "Assistant IA Gemini non inclus",
          description: `La génération de descriptions par IA n'est pas incluse dans votre plan actuel. Passez au Plan Premium pour débloquer cette fonctionnalité.`,
          feature: "ai"
        });
        return;
      }

      setGeneratingAI(true);
      const description = await generateAIDescription({
        name: propertyData.name,
        type: propertyType,
        address: propertyData.address,
        equipments: propertyEquipments,
        bedrooms: simplePropertyData.bedrooms,
        bathrooms: simplePropertyData.bathrooms,
        area: simplePropertyData.area_sqm,
        listing_type: propertyData.listing_type,
        price: propertyData.listing_type === 'vente' ? propertyData.sale_price : simplePropertyData.monthly_rent,
        rent_period: simplePropertyData.rent_period,
        rooms_count: simplePropertyData.rooms_count,
        floors: simplePropertyData.floors,
      });

      setPropertyData(prev => ({ ...prev, description }));
      toast({
        title: "Description générée",
        description: "L'IA a généré une description personnalisée pour votre bien.",
      });
    } catch (error: any) {
      if (error.response?.status === 403 || error.message?.includes('403')) {
        setUpgradeModal({
          open: true,
          title: "Limite IA atteinte",
          description: "Vous avez atteint votre limite mensuelle de générations par IA. Passez au plan Professionnel pour un usage illimité !",
          feature: "ai"
        });
      } else {
        toast({
          title: "Erreur de génération",
          description: "Impossible de générer la description. Vérifiez votre connexion.",
          variant: "destructive",
        });
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setPropertyType("");
    setPropertyData({
      name: "",
      address: "",
      description: "",
      latitude: "",
      longitude: "",
      listing_type: "location",
      sale_price: "",
    });
    setPropertyEquipments([]);
    setEquipmentInput("");
    setPropertyPhotos([]);
    setPropertyPhotosPreviews([]);
    setSimplePropertyData({
      monthly_rent: "",
      area_sqm: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      rooms_count: "",
      rent_period: "mois",
    });
    setSelectedGroupId("none");
    setNewGroupName("");
    setNewGroupParentId("none");
    setUploading(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Ajouter un bien</DialogTitle>
          <DialogDescription>
            {propertyType
              ? `Renseignez les informations de votre ${propertyType}.`
              : "Sélectionnez le type de bien que vous souhaitez ajouter."
            }
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div>
            <Label>Type de propriété *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
              {propertyTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${propertyType === type.value
                    ? "border-primary ring-2 ring-primary"
                    : "hover:border-primary/50"
                    }`}
                  onClick={() => {
                    if (propertyType !== type.value) {
                      const prevType = propertyType;
                      setPropertyType(type.value);
                      
                      // Auto-set listing type for terrain
                      const newListingType = type.value === 'terrain' ? 'vente' : 'location';

                      setPropertyData(prev => ({
                        ...prev,
                        listing_type: newListingType
                      }));

                      setSimplePropertyData({
                        monthly_rent: "",
                        area_sqm: "",
                        bedrooms: "",
                        bathrooms: "",
                        floors: "",
                        rooms_count: "",
                        rent_period: "mois",
                      });

                      // Auto-scroll to General Information if selecting for the first time
                      if (!prevType) {
                        setTimeout(() => {
                          generalInfoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 100);
                      }
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <type.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{type.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {propertyType && (
            <>
              <Card className="shadow-soft" ref={generalInfoRef}>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la propriété *</Label>
                      <Input
                        id="name"
                        value={propertyData.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setPropertyData({ ...propertyData, name: newName });
                          setNameConflict(myProperties.some(p => p.name?.toLowerCase() === newName.toLowerCase().trim()));
                        }}
                        placeholder="Ex: Villa Fleurie"
                        className={nameConflict ? "border-orange-400 focus-visible:ring-orange-400" : ""}
                      />
                      {nameConflict && (
                        <p className="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Vous avez déjà un bien avec ce nom.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse complète *</Label>
                      <Input
                        id="address"
                        value={propertyData.address}
                        onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                        placeholder="Ex: 123 Rue de la Paix, Centre Ville"
                      />
                    </div>
                  </div>

                  {/* Section Dossier / Groupe de biens */}
                  <div className="border-t pt-4 mt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <Label className="font-semibold text-sm">Dossier / Immeuble de rattachement (Optionnel)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>Classez ce bien dans un dossier. Cliquez sur la flèche</span>
                      <ChevronDown className="h-3 w-3 inline text-primary font-bold" />
                      <span>pour afficher/masquer les sous-dossiers.</span>
                    </p>

                    {/* Arborescence interactive des dossiers */}
                    <div
                      className="border rounded-lg p-3 bg-muted/20 space-y-2 max-h-60 overflow-y-auto overscroll-contain touch-pan-y"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <div
                        onClick={() => {
                          setSelectedGroupId("none");
                          setNewGroupName("");
                          setNewGroupParentId("none");
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedGroupId === "none"
                            ? "bg-primary/10 border-2 border-primary font-bold text-primary shadow-sm"
                            : "bg-background hover:bg-muted/60 border border-border"
                        }`}
                      >
                        <span className="text-xs">-- Aucun dossier (Bien indépendant) --</span>
                      </div>

                      {(() => {
                        const renderGroupNodes = (parentId?: string, depth = 0) => {
                          const children = customGroups.filter(g => (parentId ? g.parentId === parentId : !g.parentId));
                          children.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));
                          if (children.length === 0) return null;

                          return (
                            <div className={`space-y-1.5 ${depth > 0 ? "ml-4 pl-2 border-l-2 border-primary/20" : ""}`}>
                              {children.map(group => {
                                const subChildren = customGroups.filter(g => g.parentId === group.id);
                                const hasSub = subChildren.length > 0;
                                const isCollapsed = !openGroups[group.id];
                                const isSelected = selectedGroupId === group.id;

                                return (
                                  <div key={group.id} className="space-y-1">
                                    <div
                                      onClick={() => {
                                        setSelectedGroupId(group.id);
                                        setNewGroupName("");
                                        setNewGroupParentId("none");
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                          ? "bg-primary/10 border-2 border-primary font-bold text-primary shadow-sm"
                                          : "bg-background hover:bg-muted/60 border border-border"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {hasSub ? (
                                          <button
                                            type="button"
                                            onClick={(e) => toggleGroupExpand(group.id, e)}
                                            className="p-1 hover:bg-muted rounded transition-colors text-primary"
                                            title={isCollapsed ? "Afficher les sous-dossiers" : "Masquer les sous-dossiers"}
                                          >
                                            {isCollapsed ? (
                                              <ChevronRight className="h-4 w-4 text-primary font-bold" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4 text-primary font-bold" />
                                            )}
                                          </button>
                                        ) : depth > 0 ? (
                                          <span className="text-xs text-muted-foreground font-mono">↳</span>
                                        ) : null}

                                        <Folder className={`h-4 w-4 ${depth === 0 ? "text-amber-500 fill-amber-100" : "text-amber-400 fill-amber-50"}`} />
                                        <span className="text-xs font-medium">{group.name}</span>
                                      </div>

                                      {hasSub && (
                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                                          {subChildren.length} sous-dossier{subChildren.length > 1 ? "s" : ""}
                                        </span>
                                      )}
                                    </div>

                                    {/* Sub-folders displayed only when NOT collapsed */}
                                    {hasSub && !isCollapsed && renderGroupNodes(group.id, depth + 1)}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        };

                        return renderGroupNodes(undefined, 0);
                      })()}

                      <div
                        onClick={() => setSelectedGroupId("new")}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border border-dashed ${
                          selectedGroupId === "new"
                            ? "bg-primary/10 border-primary font-bold text-primary shadow-sm"
                            : "border-primary/40 text-primary hover:bg-primary/5 bg-background"
                        }`}
                      >
                        <FolderPlus className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">+ Créer un nouveau dossier...</span>
                      </div>
                    </div>

                    {selectedGroupId === "new" && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-lg border space-y-3 animate-in fade-in duration-200">
                        <div>
                          <Label htmlFor="new-group-name" className="text-xs font-medium">Nom du nouveau dossier *</Label>
                          <Input
                            id="new-group-name"
                            placeholder="Ex: Immeuble Horizon, Résidence Les Palmiers..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="mt-1 bg-background"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Dossier parent (Optionnel - pour créer un sous-dossier)</Label>
                          <Select
                            value={newGroupParentId}
                            onValueChange={setNewGroupParentId}
                          >
                            <SelectTrigger className="mt-1 bg-background">
                              <SelectValue placeholder="Aucun (Dossier principal)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Aucun (Dossier principal) --</SelectItem>
                              {getFlatGroupOptions(customGroups).map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Localisation sur la carte (Optionnel)</Label>
                    <LocationPicker
                      onChange={(lat, lng) => setPropertyData(prev => ({
                        ...prev,
                        latitude: lat.toString(),
                        longitude: lng.toString()
                      }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={propertyData.latitude}
                          onChange={(e) => setPropertyData({ ...propertyData, latitude: e.target.value })}
                          placeholder="Ex: 14.7167"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={propertyData.longitude}
                          onChange={(e) => setPropertyData({ ...propertyData, longitude: e.target.value })}
                          placeholder="Ex: -17.4677"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-primary">  Astuce :</span> Le marqueur sur la carte définit la position précise du bien sur la carte de recherche.
                  </p>

                  <div>
                    <Label>Équipements / Services inclus</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Indiquez les équipements proposés (ex : Climatisation, Parking sécurisé, Fibre optique…).
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Input
                        placeholder="Ex : Climatisation"
                        value={equipmentInput}
                        onChange={(e) => setEquipmentInput(e.target.value)}
                        onKeyDown={handleEquipmentKeyDown}
                      />
                      <Button type="button" variant="outline" onClick={addEquipment}>
                        Ajouter
                      </Button>
                    </div>
                    {propertyEquipments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {propertyEquipments.map((equipment, index) => (
                          <Badge
                            key={`${equipment}-${index}`}
                            variant="secondary"
                            className="flex items-center gap-1 py-1 pl-3 pr-1"
                          >
                            <span className="text-sm">{equipment}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => removeEquipment(index)}
                              aria-label={`Retirer ${equipment}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="photos">Photos de la propriété</Label>
                    <div className="mt-2 space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          id="photos"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            
                            if (propertyPhotos.length + files.length > 15) {
                              toast({
                                title: "Limite atteinte",
                                description: "Vous ne pouvez pas ajouter plus de 15 photos par bien.",
                                variant: "destructive",
                              });
                              return;
                            }

                            const compressedFiles: File[] = [];
                            
                            for (const file of files) {
                              try {
                                const compressed = await compressImage(file);
                                compressedFiles.push(compressed);
                                
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPropertyPhotosPreviews((prev) => [...prev, reader.result as string]);
                                };
                                reader.readAsDataURL(compressed);
                              } catch (err) {
                                console.error("Compression error:", err);
                                compressedFiles.push(file); // Fallback to original
                                
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPropertyPhotosPreviews((prev) => [...prev, reader.result as string]);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                            setPropertyPhotos((prev) => [...prev, ...compressedFiles]);
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("photos")?.click()}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Ajouter des photos
                        </Button>
                      </div>

                      {propertyPhotosPreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {propertyPhotosPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setPropertyPhotos((prev) => prev.filter((_, i) => i !== index));
                                  setPropertyPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Type de transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Transaction *</Label>
                      <Select
                        value={propertyData.listing_type}
                        onValueChange={(value) => setPropertyData({ ...propertyData, listing_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="vente">Vente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {propertyData.listing_type === 'vente' && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="sale_price">Prix de vente ({user?.currency || 'XOF'}) *</Label>
                        <Input
                          id="sale_price"
                          type="number"
                          value={propertyData.sale_price}
                          onChange={(e) => setPropertyData({ ...propertyData, sale_price: e.target.value })}
                          placeholder="Ex: 50000000"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire pour les biens (appartement, chambre, garage, local, maison, villa, terrain) */}
              {isSimpleProperty && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>
                      {propertyData.listing_type === 'vente' ? 'Informations du bien' : 'Informations de location'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {propertyData.listing_type === 'location' && (
                        <>
                          <div>
                            <Label htmlFor="simple_rent_period">Durée du loyer *</Label>
                            <Select
                              value={simplePropertyData.rent_period}
                              onValueChange={(value) => setSimplePropertyData({ ...simplePropertyData, rent_period: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la durée" />
                              </SelectTrigger>
                              <SelectContent>
                                {rentPeriodOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {capitalize(option.label)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="simple_monthly_rent">Montant du loyer ({user?.currency || 'XOF'}) *</Label>
                            <Input
                              id="simple_monthly_rent"
                              type="number"
                              value={simplePropertyData.monthly_rent}
                              onChange={(e) => setSimplePropertyData({ ...simplePropertyData, monthly_rent: e.target.value })}
                              placeholder="Ex: 150000"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="simple_area_sqm">Surface (m²)</Label>
                        <Input
                          id="simple_area_sqm"
                          type="number"
                          value={simplePropertyData.area_sqm}
                          onChange={(e) => setSimplePropertyData({ ...simplePropertyData, area_sqm: e.target.value })}
                          placeholder="Ex: 25"
                        />
                      </div>

                      {needsDetailedFields && (
                        <>
                          {(propertyType === "maison" || propertyType === "villa") && (
                            <div>
                              <Label htmlFor="simple_floors">Nombre d'étages</Label>
                              <Input
                                id="simple_floors"
                                type="number"
                                value={simplePropertyData.floors}
                                onChange={(e) => setSimplePropertyData({ ...simplePropertyData, floors: e.target.value })}
                                placeholder="Ex: 2"
                                min="0"
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="simple_bedrooms">Nombre de chambres</Label>
                            <Input
                              id="simple_bedrooms"
                              type="number"
                              value={simplePropertyData.bedrooms}
                              onChange={(e) => setSimplePropertyData({ ...simplePropertyData, bedrooms: e.target.value })}
                              placeholder="1"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label htmlFor="simple_bathrooms">Nombre de salles de bain</Label>
                            <Input
                              id="simple_bathrooms"
                              type="number"
                              value={simplePropertyData.bathrooms}
                              onChange={(e) => setSimplePropertyData({ ...simplePropertyData, bathrooms: e.target.value })}
                              placeholder="1"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="simple_rooms_count">Nombre de pièces</Label>
                            <Input
                              id="simple_rooms_count"
                              type="number"
                              value={simplePropertyData.rooms_count}
                              onChange={(e) => setSimplePropertyData({ ...simplePropertyData, rooms_count: e.target.value })}
                              placeholder="Ex: 3"
                              min="1"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Description du bien</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="description">Description</Label>
                      <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                        <Sparkles className="h-2 w-2 text-primary" />
                          Toutes vos infos sont prêtes — cliquez sur "Générer avec l'IA" pour une description optimale
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex items-center gap-1.5 border-primary/20 hover:bg-primary/5 transition-all"
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                    >
                      {generatingAI ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-primary" />
                      )}
                      Générer avec l'IA
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={propertyData.description}
                    onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                    placeholder="Décrivez votre propriété ou laissez l'IA le faire pour vous... Remplissez d'abord les informations ci-dessus pour une meilleure génération."
                    rows={6}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  Le bien sera créé en mode brouillon. Vous pourrez le publier depuis la liste de vos biens.
                </p>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={
                    uploading ||
                    !propertyType ||
                    !propertyData.name ||
                    !propertyData.address ||
                    (propertyData.listing_type === 'location' && isSimpleProperty && (!simplePropertyData.monthly_rent || parseFloat(simplePropertyData.monthly_rent) <= 0)) ||
                    (propertyData.listing_type === 'vente' && (!propertyData.sale_price || parseFloat(propertyData.sale_price) <= 0))
                  }
                >
                  {uploading
                    ? "Création en cours..."
                    : `Créer ${propertyType === "maison" ? "bien" : propertyType === "villa" ? "bien" : propertyType}`}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>

      <UpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) => setUpgradeModal(prev => ({ ...prev, open }))}
        title={upgradeModal.title}
        description={upgradeModal.description}
        feature={upgradeModal.feature}
      />
    </Dialog >
  );
};
