import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { getAllProperties, togglePropertyPublication } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { Property } from "@/types";

const PropertiesManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
                      <div>
                        <p className="font-bold">{property.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{property.address}</p>
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

                    <div className="mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => togglePropertyStatus(property)}
                      >
                        {property.is_published ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Dépublier le bien
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Publier le bien
                          </>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Propriétaire</TableHead>
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
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.name}</TableCell>
                        <TableCell>{property.address}</TableCell>
                        <TableCell className="capitalize">{property.property_type}</TableCell>
                        <TableCell>
                          {property.min_rent ? (
                            <>
                              <div>{formatCurrency(property.min_rent)}</div>
                              {property.units_count && property.units_count > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  {property.units_count} unités
                                </div>
                              )}
                            </>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {property.owner_name || "N/A"}
                        </TableCell>
                        <TableCell>{getStatusBadge(property.is_published)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePropertyStatus(property)}
                          >
                            {property.is_published ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Dépublier
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Publier
                              </>
                            )}
                          </Button>
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
    </div>
  );
};

export default PropertiesManagement;
