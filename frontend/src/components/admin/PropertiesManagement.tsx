import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, CheckCircle, XCircle, Eye, MapPin, Image as ImageIcon, Info, Calendar, User, Layout, Home, Bed, Bath, Maximize } from "lucide-react";
import { getAllProperties, togglePropertyPublication } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Property } from "@/types";

interface PropertiesManagementProps {
  onViewProfile?: (ownerName: string) => void;
}

const PropertiesManagement = ({ onViewProfile }: PropertiesManagementProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, properties]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await getAllProperties();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error: any) {
      console.error("Error loading properties:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les biens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchTerm) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter((property) => {
      const name = property.name?.toLowerCase() || "";
      const address = property.address?.toLowerCase() || "";
      const owner = property.owner_name?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      return name.includes(search) || address.includes(search) || owner.includes(search);
    });

    setFilteredProperties(filtered);
  };

  const togglePropertyStatus = async (property: Property) => {
    try {
      await togglePropertyPublication(property.id);

      toast({
        title: property.is_published ? "Bien dépublié" : "Bien publié",
        description: `${property.name} a été ${property.is_published ? "dépublié" : "publié"} avec succès`,
      });

      loadProperties();
    } catch (error: any) {
      console.error("Error updating property status:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isPublished: boolean) => {
    if (isPublished) {
      return <Badge variant="default" className="bg-green-500">Publié</Badge>;
    }
    return <Badge variant="secondary">Brouillon</Badge>;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Chargement des biens...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des biens</CardTitle>
          <CardDescription>Visualisez et gérez tous les biens immobiliers de la plateforme.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, adresse ou propriétaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border p-0 overflow-hidden">
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {filteredProperties.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Aucun bien trouvé</div>
              ) : (
                filteredProperties.map((property) => (
                  <div key={property.id} className="p-4 border-b last:border-0 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3">
                        {property.photo_url ? (
                          <img src={property.photo_url} alt={property.name} className="h-12 w-12 rounded-md object-cover border" />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center border">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{property.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{property.address}</p>
                        </div>
                      </div>
                      {getStatusBadge(property.is_published)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Type</p>
                        <p className="text-sm capitalize">{property.property_type}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Loyer min</p>
                        <p className="text-sm font-medium text-primary">
                          {property.min_rent ? formatCurrency(property.min_rent) : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Propriétaire</p>
                        <p className="text-sm truncate max-w-[120px]">{property.owner_name || "N/A"}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Unités</p>
                        <p className="text-sm">{property.units_count || 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedProperty(property)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button
                        variant={property.is_published ? "outline" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => togglePropertyStatus(property)}
                      >
                        {property.is_published ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bien</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Aucun bien trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProperties.map((property) => (
                      <TableRow key={property.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {property.photo_url ? (
                              <img src={property.photo_url} alt={property.name} className="h-10 w-10 rounded-md object-cover border" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-sm">{property.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{property.address}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-xs">{property.property_type}</TableCell>
                        <TableCell>
                          {property.min_rent ? (
                            <>
                              <div className="text-sm font-medium">{formatCurrency(property.min_rent)}</div>
                              {property.units_count && property.units_count > 1 && (
                                <div className="text-[10px] text-muted-foreground">
                                  {property.units_count} unités
                                </div>
                              )}
                            </>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {property.owner_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {property.latitude && property.longitude ? (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <MapPin className="h-3 w-3" /> Fixé
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Non spécifiée</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(property.is_published)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => setSelectedProperty(property)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${property.is_published ? 'text-destructive' : 'text-green-600'}`}
                              onClick={() => togglePropertyStatus(property)}
                              title={property.is_published ? "Dépublier" : "Publier"}
                            >
                              {property.is_published ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Détails */}
      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/20">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold">{selectedProperty?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{selectedProperty?.address}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {selectedProperty && getStatusBadge(selectedProperty.is_published)}
                <p className="text-xs text-muted-foreground">
                  Ajouté le {selectedProperty?.created_at ? new Date(selectedProperty.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Colonne Gauche: Photos & Stats */}
              <div className="md:col-span-2 space-y-6">
                {/* Photos Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Photos du bien
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProperty?.photos && selectedProperty.photos.length > 0 ? (
                      selectedProperty.photos.map((photo, idx) => (
                        <div key={idx} className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                          <img src={photo} alt={`${selectedProperty.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : selectedProperty?.photo_url ? (
                      <div className="col-span-2 aspect-video relative rounded-lg overflow-hidden border bg-muted">
                        <img src={selectedProperty.photo_url} alt={selectedProperty.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="col-span-2 aspect-video rounded-lg border bg-muted flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-xs italic">Aucune photo disponible</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2 border border-muted-foreground/10">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedProperty?.description || "Aucune description fournie pour ce bien."}
                  </p>
                </div>

                {/* Localisation Détail */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Coordonnées GPS</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span>Latitude:</span>
                        <span className="font-mono">{selectedProperty?.latitude || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Longitude:</span>
                        <span className="font-mono">{selectedProperty?.longitude || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Type de structure</p>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-secondary-foreground" />
                      <span className="text-sm font-bold capitalize">{selectedProperty?.property_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne Droite: Info Propriétaire & Détails techniques */}
              <div className="space-y-6">
                {/* Owner Cardio */}
                <div className="p-4 bg-white rounded-xl shadow-sm border space-y-3">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400">Propriétaire</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {selectedProperty?.owner_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedProperty?.owner_name || 'N/A'}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {selectedProperty?.owner_id?.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => {
                      if (selectedProperty?.owner_name && onViewProfile) {
                        onViewProfile(selectedProperty.owner_name);
                        setSelectedProperty(null);
                      }
                    }}
                  >
                    <User className="h-3 w-3 mr-2" />
                    Voir le profil
                  </Button>
                </div>

                {/* Amenities / Features */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400">Caractéristiques</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bed className="h-4 w-4" /> <span>Chambres</span>
                      </div>
                      <span className="font-bold">{selectedProperty?.bedrooms || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bath className="h-4 w-4" /> <span>Douches</span>
                      </div>
                      <span className="font-bold">{selectedProperty?.bathrooms || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Maximize className="h-4 w-4" /> <span>Surface</span>
                      </div>
                      <span className="font-bold">{selectedProperty?.area_sqm || 0} m²</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Layout className="h-4 w-4" /> <span>Unités</span>
                      </div>
                      <span className="font-bold">{selectedProperty?.units_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Equipments */}
                {selectedProperty?.equipments && selectedProperty.equipments.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-[10px] uppercase font-bold text-slate-400">Équipements</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProperty.equipments.map((eq, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedProperty(null)}>Fermer</Button>
            <Button
              variant={selectedProperty?.is_published ? "destructive" : "default"}
              onClick={() => selectedProperty && togglePropertyStatus(selectedProperty)}
            >
              {selectedProperty?.is_published ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Dépublier le bien
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publier pour tous
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesManagement;
