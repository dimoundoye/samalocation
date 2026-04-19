import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Sparkles, Loader2, Home, Layers, Building2, Building, BedDouble, Warehouse, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProperty, uploadPhotos, generateAIDescription } from "@/lib/api";
import { compressImage } from "@/lib/imageCompression";
import { Property } from "@/types";
import LocationPicker from "./LocationPicker";

interface EditPropertyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    property: Property | null;
}

export const EditPropertyModal = ({ open, onOpenChange, onSuccess, property }: EditPropertyModalProps) => {
    const { toast } = useToast();
    const [propertyType, setPropertyType] = useState<string>("");
    const [propertyData, setPropertyData] = useState({
        name: "",
        address: "",
        description: "",
        latitude: "",
        longitude: "",
    });

    // For single property units (since current UI handles them as one)
    const [unitData, setUnitData] = useState({
        id: "",
        monthly_rent: "",
        area_sqm: "",
        bedrooms: "",
        bathrooms: "",
        rooms_count: "",
        rent_period: "mois",
    });

    const [propertyEquipments, setPropertyEquipments] = useState<string[]>([]);
    const [equipmentInput, setEquipmentInput] = useState("");
    const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
    const [propertyPhotosPreviews, setPropertyPhotosPreviews] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        if (property) {
            setPropertyType(property.property_type || "");
            setPropertyData({
                name: property.name || "",
                address: property.address || "",
                description: property.description || "",
                latitude: property.latitude?.toString() || "",
                longitude: property.longitude?.toString() || "",
            });
            setPropertyEquipments(property.equipments || []);
            setExistingPhotos(property.photos || []);
            setPropertyPhotos([]);
            setPropertyPhotosPreviews([]);

            // Load unit data (assuming one unit for now, as in AddPropertyModal)
            const unit = property.property_units && property.property_units.length > 0
                ? property.property_units[0]
                : null;

            if (unit) {
                setUnitData({
                    id: unit.id || "",
                    monthly_rent: unit.monthly_rent?.toString() || "",
                    area_sqm: unit.area_sqm?.toString() || "",
                    bedrooms: unit.bedrooms?.toString() || "",
                    bathrooms: unit.bathrooms?.toString() || "",
                    rooms_count: unit.rooms_count?.toString() || "0",
                    rent_period: unit.rent_period || "mois",
                });
            } else {
                setUnitData({
                    id: "",
                    monthly_rent: "",
                    area_sqm: "",
                    bedrooms: "",
                    bathrooms: "",
                    rooms_count: "",
                    rent_period: "mois",
                });
            }
        }
    }, [property]);

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

    const handleSubmit = async () => {
        if (!property) return;

        if (!propertyData.name.trim() || !propertyData.address.trim()) {
            toast({
                title: "Informations incomplètes",
                description: "Veuillez renseigner le nom et l'adresse de la propriété.",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploading(true);

            let newPhotoUrls: string[] = [];
            if (propertyPhotos.length > 0) {
                newPhotoUrls = await uploadPhotos(propertyPhotos);
            }

            const allPhotos = [...existingPhotos, ...newPhotoUrls];

            const propertyUpdate: any = {
                property_type: propertyType,
                name: propertyData.name.trim(),
                address: propertyData.address.trim(),
                description: propertyData.description.trim() || null,
                photos: allPhotos,
                photo_url: allPhotos[0] || null,
                equipments: propertyEquipments.length > 0 ? propertyEquipments : null,
                latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : 14.7167,
                longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : -17.4677,
                units: [
                    {
                        id: unitData.id || undefined,
                        unit_type: propertyType,
                        monthly_rent: unitData.monthly_rent ? parseInt(unitData.monthly_rent) : 0,
                        area_sqm: unitData.area_sqm ? parseFloat(unitData.area_sqm) : null,
                        bedrooms: unitData.bedrooms ? parseInt(unitData.bedrooms) : 0,
                        bathrooms: unitData.bathrooms ? parseInt(unitData.bathrooms) : 0,
                        rooms_count: unitData.rooms_count ? parseInt(unitData.rooms_count) : 0,
                        rent_period: unitData.rent_period,
                        unit_number: propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
                    }
                ]
            };

            await updateProperty(property.id, propertyUpdate);

            toast({
                title: "Bien modifié",
                description: "Les informations de votre bien ont été mises à jour.",
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Action impossible",
                description: "La modification du bien a échoué.",
                variant: "destructive",
            });
            console.error("Erreur lors de la modification:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!property) return;

        if (!propertyData.name || !propertyData.address) {
            toast({
                title: "Informations minimales requises",
                description: "Le nom et l'adresse sont requis pour que l'IA puisse travailler.",
                variant: "destructive",
            });
            return;
        }

        // Hint: Encouraging more data for better AI
        const hasEnoughData = unitData.monthly_rent && unitData.area_sqm && propertyEquipments.length > 0;
        if (!hasEnoughData) {
            toast({
                title: "Conseil pour l'IA",
                description: "Plus vous remplissez de détails (prix, surface, équipements), plus la description sera précise.",
            });
        }

        try {
            setGeneratingAI(true);
            const firstUnit = property.property_units?.[0];

            const description = await generateAIDescription({
                name: propertyData.name,
                type: propertyType,
                address: propertyData.address,
                equipments: propertyEquipments,
                bedrooms: unitData.bedrooms || firstUnit?.bedrooms?.toString(),
                bathrooms: unitData.bathrooms || firstUnit?.bathrooms?.toString(),
                area: unitData.area_sqm || firstUnit?.area_sqm?.toString(),
            });

            setPropertyData(prev => ({ ...prev, description }));
            toast({
                title: "Description générée",
                description: "L'IA a mis à jour la description de votre bien.",
            });
        } catch (error) {
            toast({
                title: "Erreur de génération",
                description: "Impossible de générer la description.",
                variant: "destructive",
            });
        } finally {
            setGeneratingAI(false);
        }
    };

    const propertyTypes = [
        { value: "maison", label: "Maison", icon: Home },
        { value: "villa", label: "Villa", icon: Layers },
        { value: "appartement", label: "Appartement", icon: Building2 },
        { value: "studio", label: "Studio", icon: Building },
        { value: "chambre", label: "Chambre", icon: BedDouble },
        { value: "garage", label: "Garage", icon: Warehouse },
        { value: "locale", label: "Local", icon: Store },
    ];

    const needsDetailedFields = ["maison", "villa", "appartement", "studio", "chambre"].includes(propertyType);

    const rentPeriodOptions = [
        { value: "jour", label: "Jour" },
        { value: "semaine", label: "Semaine" },
        { value: "mois", label: "Mois" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>Modifier le bien</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations de votre propriété.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="space-y-2">
                        <Label>Type de propriété *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {propertyTypes.map((type) => (
                                <div
                                    key={type.value}
                                    className={`cursor-pointer p-2 rounded-lg border text-center transition-all ${propertyType === type.value
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:border-primary/50"
                                        }`}
                                    onClick={() => setPropertyType(type.value)}
                                >
                                    <type.icon className={`h-5 w-5 mx-auto mb-1 ${propertyType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <p className={`text-[10px] font-medium ${propertyType === type.value ? "text-primary" : ""}`}>{type.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="shadow-soft">
                        <CardHeader>
                            <CardTitle>Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-name">Nom de la propriété *</Label>
                                    <Input
                                        id="edit-name"
                                        value={propertyData.name}
                                        onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-address">Adresse complète *</Label>
                                    <Input
                                        id="edit-address"
                                        value={propertyData.address}
                                        onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Localisation sur la carte (Optionnel)</Label>
                                <LocationPicker
                                    initialLat={propertyData.latitude ? parseFloat(propertyData.latitude) : null}
                                    initialLng={propertyData.longitude ? parseFloat(propertyData.longitude) : null}
                                    onChange={(lat, lng) => setPropertyData(prev => ({
                                        ...prev,
                                        latitude: lat.toString(),
                                        longitude: lng.toString()
                                    }))}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-latitude" className="text-xs">Latitude</Label>
                                        <Input
                                            id="edit-latitude"
                                            type="number"
                                            step="any"
                                            value={propertyData.latitude}
                                            onChange={(e) => setPropertyData({ ...propertyData, latitude: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-longitude" className="text-xs">Longitude</Label>
                                        <Input
                                            id="edit-longitude"
                                            type="number"
                                            step="any"
                                            value={propertyData.longitude}
                                            onChange={(e) => setPropertyData({ ...propertyData, longitude: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="edit-description">Description</Label>
                                        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                            <Sparkles className="h-2 w-2 text-primary" />
                                            Plus d'infos (prix, surface, équipements) = meilleure description
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
                                        Régénérer avec l'IA
                                    </Button>
                                </div>
                                <Textarea
                                    id="edit-description"
                                    value={propertyData.description}
                                    onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Décrivez votre propriété ou laissez l'IA le faire pour vous..."
                                />
                            </div>

                            <div>
                                <Label>Équipements / Services</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        placeholder="Ajouter un équipement"
                                        value={equipmentInput}
                                        onChange={(e) => setEquipmentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEquipment())}
                                    />
                                    <Button type="button" variant="outline" onClick={addEquipment}>
                                        Ajouter
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {Array.isArray(propertyEquipments) && propertyEquipments.map((equipment, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                            {equipment}
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-4 w-4"
                                                onClick={() => removeEquipment(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Photos</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                    {existingPhotos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <img src={photo} className="w-full h-20 object-cover rounded-md" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                                                onClick={() => setExistingPhotos(prev => prev.filter((_, i) => i !== index))}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Input
                                        type="file"
                                        id="edit-photos"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            
                                            const totalPhotos = existingPhotos.length + propertyPhotos.length + files.length;
                                            if (totalPhotos > 15) {
                                                toast({
                                                    title: "Limite atteinte",
                                                    description: "Le nombre total de photos ne peut pas dépasser 15.",
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
                                                    reader.onloadend = () => setPropertyPhotosPreviews(prev => [...prev, reader.result as string]);
                                                    reader.readAsDataURL(compressed);
                                                } catch (err) {
                                                    console.error("Compression error:", err);
                                                    compressedFiles.push(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setPropertyPhotosPreviews(prev => [...prev, reader.result as string]);
                                                    reader.readAsDataURL(file);
                                                }
                                            }
                                            setPropertyPhotos(prev => [...prev, ...compressedFiles]);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-20 flex flex-col items-center justify-center border-dashed"
                                        onClick={() => document.getElementById("edit-photos")?.click()}
                                    >
                                        <Upload className="h-4 w-4 mb-1" />
                                        <span className="text-[10px]">Ajouter</span>
                                    </Button>
                                </div>
                                {propertyPhotosPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                        {propertyPhotosPreviews.map((preview, index) => (
                                            <div key={index} className="relative group border-2 border-primary rounded-md">
                                                <img src={preview} className="w-full h-20 object-cover rounded-sm" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-1 -right-1 h-5 w-5"
                                                    onClick={() => {
                                                        setPropertyPhotos(prev => prev.filter((_, i) => i !== index));
                                                        setPropertyPhotosPreviews(prev => prev.filter((_, i) => i !== index));
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                        <CardHeader>
                            <CardTitle>Informations de location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Durée du loyer *</Label>
                                    <Select
                                        value={unitData.rent_period}
                                        onValueChange={(value) => setUnitData({ ...unitData, rent_period: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez la durée" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rentPeriodOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="edit-rent">Montant du loyer (F CFA) *</Label>
                                    <Input
                                        id="edit-rent"
                                        type="number"
                                        value={unitData.monthly_rent}
                                        onChange={(e) => setUnitData({ ...unitData, monthly_rent: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="edit-area">Surface (m²)</Label>
                                    <Input
                                        id="edit-area"
                                        type="number"
                                        value={unitData.area_sqm}
                                        onChange={(e) => setUnitData({ ...unitData, area_sqm: e.target.value })}
                                    />
                                </div>

                                {needsDetailedFields && (
                                    <>
                                        <div>
                                            <Label htmlFor="edit-bedrooms">Nombre de chambres</Label>
                                            <Input
                                                id="edit-bedrooms"
                                                type="number"
                                                value={unitData.bedrooms}
                                                onChange={(e) => setUnitData({ ...unitData, bedrooms: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit-bathrooms">Nombre de salles de bain</Label>
                                            <Input
                                                id="edit-bathrooms"
                                                type="number"
                                                value={unitData.bathrooms}
                                                onChange={(e) => setUnitData({ ...unitData, bathrooms: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-rooms">Nombre de pièces</Label>
                                            <Input
                                                id="edit-rooms"
                                                type="number"
                                                value={unitData.rooms_count}
                                                onChange={(e) => setUnitData({ ...unitData, rooms_count: e.target.value })}
                                                min="1"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditPropertyModal;
