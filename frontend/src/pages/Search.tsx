import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import property1 from "@/assets/property-1.jpg";
import { transformProperty, FormattedProperty } from "@/lib/property";
import { getProperties, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Search = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [properties, setProperties] = useState<FormattedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, propertyType]);

  useEffect(() => {
    loadProperties(currentPage);
    if (user) {
      loadAppliedProperties();
    }
  }, [user, currentPage, searchTerm, propertyType]);

  // Redundant checkAuth removed, useAuth handles it now
  const isAuthenticated = !!user;
  const currentUserId = user?.id || null;

  const loadProperties = async (page = 1) => {
    try {
      setLoading(true);
      // Utiliser notre nouveau backend local avec filtres
      const data = await getProperties({
        limit: 20,
        page,
        search: searchTerm,
        type: propertyType
      });

      // The backend now returns { properties, pagination }
      const propertiesList = data.properties || [];
      const pagination = data.pagination;

      const formatted = propertiesList.map((property: any) => transformProperty(property));
      setProperties(formatted);
      if (pagination) {
        setTotalPages(pagination.pages);
      }
    } catch (error: any) {
      console.error("Error loading properties:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les biens disponibles pour le moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };



  const loadAppliedProperties = async () => {
    try {
      if (!user) {
        setAppliedPropertyIds([]);
        return;
      }

      const messages = await getMessages();
      const ids = messages
        .filter((m: any) => m.sender_id === user.id)
        .map((m: any) => m.property_id);

      setAppliedPropertyIds(Array.from(new Set(ids)));
    } catch (error) {
      console.error("Unexpected error loading applied properties:", error);
      setAppliedPropertyIds([]);
    }
  };

  const filteredProperties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (property: FormattedProperty) => {
      if (!term) return true;
      const name = property.name?.toLowerCase() || "";
      const address = property.address?.toLowerCase() || "";
      return name.includes(term) || address.includes(term);
    };

    const matchesType = (property: FormattedProperty) => {
      if (propertyType === "all") return true;

      const propertyMatches = property.property_type === propertyType;
      const unitMatches = property.property_units?.some((unit: any) => unit?.unit_type === propertyType);

      return propertyMatches || unitMatches;
    };

    const matchesPrice = (property: FormattedProperty) => {
      if (priceRange === "all") return true;

      const price = property.rent_amount || 0;
      if (price === 0) return false;

      switch (priceRange) {
        case "0-100000":
          return price <= 100000;
        case "100000-200000":
          return price > 100000 && price <= 200000;
        case "200000-400000":
          return price > 200000 && price <= 400000;
        case "400000+":
          return price > 400000;
        default:
          return true;
      }
    };

    return properties.filter((property) => matchesSearch(property) && matchesType(property) && matchesPrice(property));
  }, [properties, searchTerm, propertyType, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          {/* Back Button for authenticated users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              onClick={() => navigate("/tenant-dashboard")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à mon espace
            </Button>
          )}

          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Trouvez votre logement idéal
            </h1>
            <p className="text-muted-foreground">
              {filteredProperties.length} bien{filteredProperties.length > 1 ? "s" : ""} disponible{filteredProperties.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card p-6 rounded-xl shadow-soft mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ville, quartier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="chambre">Chambre</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="locale">Locale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les prix</SelectItem>
                  <SelectItem value="0-100000">0 - 100 000 F</SelectItem>
                  <SelectItem value="100000-200000">100 000 - 200 000 F</SelectItem>
                  <SelectItem value="200000-400000">200 000 - 400 000 F</SelectItem>
                  <SelectItem value="400000+">400 000 F+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                toast({
                  title: "Filtres avancés",
                  description: "Les filtres avancés seront bientôt disponibles.",
                });
              }}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Plus de filtres
            </Button>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des biens...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun bien disponible pour le moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Revenez plus tard pour voir les nouvelles offres.</p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProperties.map((property) => {
                  const ownerProfile = (property as any).owner_profiles
                    ? Array.isArray((property as any).owner_profiles)
                      ? (property as any).owner_profiles[0]
                      : (property as any).owner_profiles
                    : null;
                  const ownerPhone = ownerProfile?.contact_phone || ownerProfile?.phone;

                  return (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      image={property.cover_photo || property.photo_url || property1}
                      title={property.name}
                      location={property.address}
                      price={property.rent_amount || 0}
                      type={property.property_type}
                      status={property.display_status}
                      bedrooms={property.aggregated_bedrooms || undefined}
                      area={property.aggregated_area || undefined}
                      bathrooms={property.aggregated_bathrooms || undefined}
                      rentPeriod={property.primary_rent_period}
                      isApplied={currentUserId && property.id ? appliedPropertyIds.includes(property.id) : false}
                      ownerPhone={ownerPhone}
                    />
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-10 border-t">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex items-center gap-2 px-6"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Page {currentPage} sur {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex items-center gap-2 px-6"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
