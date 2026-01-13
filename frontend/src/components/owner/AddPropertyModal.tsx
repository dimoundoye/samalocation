import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createProperty, createPropertyUnits, uploadPhotos } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
  });
  const [propertyEquipments, setPropertyEquipments] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
  const [propertyPhotosPreviews, setPropertyPhotosPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Pour les biens simples, on utilise directement les champs
  const [simplePropertyData, setSimplePropertyData] = useState({
    monthly_rent: "",
    area_sqm: "",
    bedrooms: "",
    bathrooms: "",
    floors: "", // Nombre d'étages (pour maison et villa)
    rent_period: "mois",
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
  };

  const propertyTypes = [
    { value: "maison", label: "Maison", icon: Home },
    { value: "villa", label: "Villa", icon: Layers },
    { value: "appartement", label: "Appartement", icon: Building2 },
    { value: "chambre", label: "Chambre", icon: BedDouble },
    { value: "garage", label: "Garage", icon: Warehouse },
    { value: "locale", label: "Local", icon: Store },
  ];

  // Types de biens simples (un seul bien) - tous les types sont maintenant simples
  const isSimpleProperty = ["maison", "villa", "appartement", "chambre", "garage", "locale"].includes(propertyType);

  // Types qui nécessitent des champs supplémentaires (étages, chambres, salles de bain)
  const needsDetailedFields = ["maison", "villa", "appartement", "chambre"].includes(propertyType);

  const rentPeriodOptions = [
    { value: "jour", label: "Jour" },
    { value: "semaine", label: "Semaine" },
    { value: "mois", label: "Mois" },
  ];



  const handleSubmit = async () => {
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
      if (!simplePropertyData.monthly_rent || parseFloat(simplePropertyData.monthly_rent) <= 0) {
        toast({
          title: "Loyer requis",
          description: "Veuillez renseigner le montant du loyer.",
          variant: "destructive",
        });
        return;
      }
    }


    try {
      setUploading(true);
      if (!user) throw new Error("Non authentifié");

      // Préparer les unités
      let preparedUnits: any[] = [];

      if (isSimpleProperty) {
        const monthlyRentValue = parseInt(simplePropertyData.monthly_rent, 10);

        if (Number.isNaN(monthlyRentValue) || monthlyRentValue <= 0) {
          throw new Error("Le loyer doit être un nombre positif.");
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
          monthly_rent: monthlyRentValue,
          area_sqm: simplePropertyData.area_sqm ? parseFloat(simplePropertyData.area_sqm) : null,
          bedrooms: needsDetailedFields && simplePropertyData.bedrooms
            ? parseInt(simplePropertyData.bedrooms, 10) : 0,
          bathrooms: needsDetailedFields && simplePropertyData.bathrooms
            ? parseInt(simplePropertyData.bathrooms, 10) : 0,
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

      // Créer la propriété
      const propertyInsert: any = {
        property_type: propertyType,
        name: propertyData.name.trim(),
        address: propertyData.address.trim(),
        description: propertyData.description.trim() || null,
        photos: photoUrls,
        photo_url: photoUrls[0] || null,
        is_published: false,
        equipments: propertyEquipments.length > 0 ? propertyEquipments : null
      };

      const property = await createProperty(propertyInsert);

      if (!property) {
        throw new Error("Erreur lors de la création de la propriété");
      }

      // Créer les unités
      const unitsToInsert = preparedUnits.map(unit => ({
        property_id: property.id,
        ...unit,
      }));

      await createPropertyUnits(property.id, unitsToInsert);

      toast({
        title: "Bien ajouté",
        description: "Votre bien a été ajouté avec succès. Vous pouvez le publier depuis la liste de vos biens.",
      });

      onSuccess();
      setTimeout(() => {
        handleDialogChange(false);
      }, 300);
    } catch (error: any) {
      console.error("Submit error:", error);

      const rawMessage = typeof error?.message === "string" ? error.message : "";
      let friendlyMessage = rawMessage || "Une erreur est survenue lors de l'ajout du bien.";

      const lower = rawMessage.toLowerCase();
      if (lower.includes("property_type") || lower.includes("check constraint") || lower.includes("violates check constraint") || lower.includes("unit_type")) {
        friendlyMessage =
          "Ce type de bien n'est pas encore autorisé dans la base de données. " +
          "Veuillez exécuter la migration Supabase suivante :\n" +
          "- 20251114120000_add_villa_property_type.sql\n\n" +
          "Cette migration ajoute 'villa' et autorise 'maison' comme type d'unité.";
      } else if (lower.includes("rent_period")) {
        friendlyMessage =
          "La période de loyer n'a pas pu être enregistrée. Exécutez la migration Supabase 20251113120000_update_property_schema.sql pour ajouter la colonne rent_period.";
      } else if (lower.includes("permission denied") || lower.includes("row-level security")) {
        friendlyMessage =
          "Vous n'avez pas la permission de créer ce bien. Vérifiez que vous êtes bien connecté en tant que propriétaire.";
      } else if (lower.includes("null value") || lower.includes("not null")) {
        friendlyMessage =
          "Certains champs obligatoires sont manquants. Vérifiez que tous les champs requis sont remplis.";
      }

      // Afficher le message d'erreur (limiter la longueur pour le toast)
      const shortMessage = friendlyMessage.length > 200
        ? friendlyMessage.substring(0, 200) + "..."
        : friendlyMessage;

      toast({
        title: "Erreur lors de la création",
        description: shortMessage,
        variant: "destructive",
        duration: 10000, // Afficher plus longtemps pour les erreurs importantes
      });

      // Aussi logger le message complet dans la console
      console.error("Erreur complète:", friendlyMessage);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setPropertyType("");
    setPropertyData({
      name: "",
      address: "",
      description: "",
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
      rent_period: "mois",
    });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      setPropertyType(type.value);
                      setSimplePropertyData({
                        monthly_rent: "",
                        area_sqm: "",
                        bedrooms: "",
                        bathrooms: "",
                        floors: "",
                        rent_period: "mois",
                      });
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
              <Card className="shadow-soft">
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
                        onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
                        placeholder="Ex: Villa Almadies"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse complète *</Label>
                      <Input
                        id="address"
                        value={propertyData.address}
                        onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                        placeholder="Ex: Rue 12, Almadies, Dakar"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={propertyData.description}
                      onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                      placeholder="Décrivez votre propriété..."
                      rows={3}
                    />
                  </div>

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
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setPropertyPhotos((prev) => [...prev, ...files]);

                            files.forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPropertyPhotosPreviews((prev) => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            });
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

              {/* Formulaire pour les biens simples (appartement, chambre, garage, local) */}
              {isSimpleProperty && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Informations de location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="simple_monthly_rent">Montant du loyer (F CFA) *</Label>
                        <Input
                          id="simple_monthly_rent"
                          type="number"
                          value={simplePropertyData.monthly_rent}
                          onChange={(e) => setSimplePropertyData({ ...simplePropertyData, monthly_rent: e.target.value })}
                          placeholder="Ex: 150000"
                        />
                      </div>

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
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}


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
                    (isSimpleProperty && (!simplePropertyData.monthly_rent || parseFloat(simplePropertyData.monthly_rent) <= 0))
                  }
                >
                  {uploading
                    ? "Création en cours..."
                    : `Créer le ${propertyType === "maison" ? "bien" : propertyType === "villa" ? "bien" : propertyType}`}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
