import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProperty, uploadPhotos, generateAIDescription } from "@/lib/api";
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
    const [propertyData, setPropertyData] = useState({
        name: "",
        address: "",
        description: "",
        latitude: "",
        longitude: "",
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
                name: propertyData.name.trim(),
                address: propertyData.address.trim(),
                description: propertyData.description.trim() || null,
                photos: allPhotos,
                photo_url: allPhotos[0] || null,
                equipments: propertyEquipments.length > 0 ? propertyEquipments : null,
                latitude: propertyData.latitude ? parseFloat(propertyData.latitude) : null,
                longitude: propertyData.longitude ? parseFloat(propertyData.longitude) : null
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
                title: "Informations manquantes",
                description: "Le nom et l'adresse sont requis pour générer une description.",
                variant: "destructive",
            });
            return;
        }

        try {
            setGeneratingAI(true);
            const firstUnit = property.property_units?.[0];

            const description = await generateAIDescription({
                name: propertyData.name,
                type: property.property_type,
                address: propertyData.address,
                equipments: propertyEquipments,
                bedrooms: firstUnit?.unit_type !== 'commercial' ? firstUnit?.bedrooms : undefined,
                bathrooms: firstUnit?.unit_type !== 'commercial' ? firstUnit?.bathrooms : undefined,
                area: firstUnit?.area_sqm,
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
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs flex items-center gap-1.5"
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
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setPropertyPhotos(prev => [...prev, ...files]);
                                            files.forEach(file => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setPropertyPhotosPreviews(prev => [...prev, reader.result as string]);
                                                reader.readAsDataURL(file);
                                            });
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
