import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, Home, ChevronRight, Map as MapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import property1 from "@/assets/property-1.jpg";
import { transformProperty, FormattedProperty } from "@/lib/property";
import { getProperties, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import MapComponent from "@/components/MapComponent";
import { useTranslation } from "react-i18next";

const Recherche = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [properties, setProperties] = useState<FormattedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
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

      // Split term into words and check if each word matches name OR address
      const words = term.split(/\s+/).filter(w => w.length > 1);
      if (words.length > 1) {
        return words.every(word => name.includes(word) || address.includes(word));
      }

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
              {t('nav.my_space')}
            </Button>
          )}

          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('search.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('search.results_count', { count: filteredProperties.length })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className={`${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}>
              {/* Filters */}
              <div className="bg-card p-6 rounded-xl shadow-soft mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={t('search.placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === "Enter" && loadProperties(1)}
                    />
                  </div>

                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('search.property_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.types.all')}</SelectItem>
                      <SelectItem value="maison">{t('search.types.house')}</SelectItem>
                      <SelectItem value="villa">{t('search.types.villa')}</SelectItem>
                      <SelectItem value="appartement">{t('search.types.apartment')}</SelectItem>
                      <SelectItem value="studio">{t('search.types.studio')}</SelectItem>
                      <SelectItem value="chambre">{t('search.types.room')}</SelectItem>
                      <SelectItem value="garage">{t('search.types.garage')}</SelectItem>
                      <SelectItem value="locale">{t('search.types.office')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.price')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('search.prices.all')}</SelectItem>
                      <SelectItem value="0-100000">{t('search.prices.under_100k')}</SelectItem>
                      <SelectItem value="100000-200000">{t('search.prices.100k_200k')}</SelectItem>
                      <SelectItem value="200000-400000">{t('search.prices.200k_400k')}</SelectItem>
                      <SelectItem value="400000+">{t('search.prices.over_440k')}</SelectItem>
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
                  {t('search.more_filters')}
                </Button>
              </div>

              {/* Properties Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('search.loading')}</p>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('search.no_results')}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t('search.no_results_desc')}</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                          isVerifiedOwner={ownerProfile?.is_verified || ownerProfile?.verification_status === 'verified'}
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
                        {t('search.pagination.prev')}
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t('search.pagination.page', { current: currentPage, total: totalPages })}</span>
                      </div>
                      <Button
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="flex items-center gap-2 px-6"
                      >
                        {t('search.pagination.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map Section */}
            <div className={`${viewMode === 'list' ? 'hidden lg:block' : 'block'} mt-12 max-w-5xl mx-auto w-full`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">{t('search.map_title')}</h2>
                </div>
                {viewMode === 'map' && (
                  <Button variant="outline" size="sm" onClick={() => setViewMode('list')} className="lg:hidden">
                    <ArrowLeft className="h-4 w-4 mr-2" /> {t('search.view_list')}
                  </Button>
                )}
              </div>
              <div className="h-[400px] w-full bg-secondary/20 rounded-xl overflow-hidden shadow-soft border border-border/50 relative z-0 isolate">
                <MapComponent properties={filteredProperties} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Seuls les biens avec des coordonnées renseignées apparaissent sur la carte.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile Toggle */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
        <Button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="rounded-full shadow-lg px-6 py-6 flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-bottom-4"
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon className="h-5 w-5" />
              Voir la carte
            </>
          ) : (
            <>
              <SearchIcon className="h-5 w-5" />
              Voir la liste
            </>
          )}
        </Button>
      </div>
    </div >
  );
};

export default Recherche;
