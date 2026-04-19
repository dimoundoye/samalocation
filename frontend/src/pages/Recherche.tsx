import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

const Recherche = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [maxRooms, setMaxRooms] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [properties, setProperties] = useState<FormattedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { pageParam } = useParams();

  // Handle URL pagination
  useEffect(() => {
    if (pageParam && pageParam.startsWith("page_")) {
      const pageNum = parseInt(pageParam.split("_")[1]);
      if (!isNaN(pageNum) && pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
    } else if (!pageParam && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [pageParam, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);

  useEffect(() => {
    loadProperties(currentPage);
    if (user) {
      loadAppliedProperties();
    }
  }, [user, currentPage, searchTerm, propertyType, minPrice, maxPrice, minArea, maxArea, minRooms, maxRooms, minBedrooms, maxBedrooms]);

  const isAuthenticated = !!user;
  const currentUserId = user?.id || null;

  const loadProperties = async (page = 1) => {
    try {
      setLoading(true);
      const data = await getProperties({
        search: searchTerm,
        type: propertyType,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        minRooms,
        maxRooms,
        minBedrooms,
        maxBedrooms
      });

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

  const filteredProperties = properties;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className={cn("pt-32 px-4 transition-all duration-300", isSearchActive && "pt-20 sm:pt-32")}>
        <div className="container mx-auto">
          {/* Back Button for authenticated users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              onClick={() => navigate("/tenant-dashboard")}
              className={cn("mb-4 flex items-center gap-2 transition-all", isSearchActive && "md:flex hidden")}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('nav.my_space')}
            </Button>
          )}

          {/* Search Header */}
          <div className={cn(
            "mb-8 transition-all duration-500 origin-top overflow-hidden",
            isSearchActive ? "max-h-0 opacity-0 mb-0 pointer-events-none" : "max-h-40 opacity-100 mb-8"
          )}>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('search.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('search.results_count', { count: filteredProperties.length })}
            </p>
          </div>

          <div className="space-y-8">
            {/* Filters Section */}
            <div className={cn(
              "bg-card p-6 rounded-2xl shadow-soft border border-border/50 space-y-6 transition-all duration-300 relative z-50",
              isSearchActive && "md:p-6 p-4 translate-y-[-10px] sm:translate-y-0"
            )}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <SearchAutocomplete 
                    placeholder={t('search.placeholder')}
                    initialValue={searchTerm}
                    onValueChange={setSearchTerm}
                    onOpenChange={setIsSearchActive}
                    className="h-12 bg-background border border-primary/20 rounded-xl focus-within:border-primary/50 transition-all shadow-sm"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-12 bg-background border border-primary/20 rounded-xl focus:border-primary/50 transition-all shadow-sm">
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
                </div>
              </div>

              {/* Advanced Range Filters (Only visible when search is not active on mobile or always on desktop) */}
              <div className={cn(
                "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-300 overflow-hidden",
                isSearchActive ? "max-h-0 sm:max-h-96 opacity-0 sm:opacity-100 mt-0 pointer-events-none sm:pointer-events-auto" : "max-h-96 opacity-100"
              )}>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Loyer Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Loyer Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Surface Min (m²)</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Surface Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Chambres Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Chambres Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxBedrooms}
                    onChange={(e) => setMaxBedrooms(e.target.value)}
                    className="h-10 bg-background border border-border/60 focus:border-primary/50 rounded-lg transition-all shadow-sm"
                  />
                </div>
              </div>

              {!isSearchActive && (
                <div className="flex justify-between items-center bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <p className="text-xs text-muted-foreground italic">
                    Les filtres sont appliqués instantanément.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={() => {
                      setMinPrice(""); setMaxPrice(""); setMinArea(""); setMaxArea("");
                      setMinRooms(""); setMaxRooms(""); setMinBedrooms(""); setMaxBedrooms("");
                      setPropertyType("all"); setSearchTerm("");
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>

            {/* Content View */}
            <div className="relative min-h-[500px]">
              {viewMode === "list" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-dashed border-border/60">
                      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                      <p className="text-muted-foreground font-medium">{t('search.loading')}</p>
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-dashed border-border/60">
                      <div className="bg-muted/30 p-6 rounded-full mb-6">
                        <Home className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{t('search.no_results')}</h3>
                      <p className="text-muted-foreground mb-6">{t('search.no_results_desc')}</p>
                      <Button variant="outline" className="rounded-xl px-8" onClick={() => navigate(0)}>
                        Actualiser la page
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProperties.map((property) => {
                          const ownerProfile = (property as any).owner_profiles?.[0] || (property as any).owner_profiles || null;
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
                              rentPeriod={property.primary_rent_period || "mois"}
                              isApplied={currentUserId && property.id ? appliedPropertyIds.includes(property.id) : false}
                              ownerPhone={ownerProfile?.phone}
                              isVerifiedOwner={ownerProfile?.is_verified || ownerProfile?.verification_status === 'verified'}
                              ownerLogo={ownerProfile?.logo_url}
                              isNew={(property.published_at || property.created_at) ? (new Date().getTime() - new Date(property.published_at || property.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false}
                            />
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-12 border-t">
                          <Button variant="outline" disabled={currentPage <= 1} onClick={() => navigate(`/search/page_${currentPage - 1}${location.search}`)} className="rounded-xl px-6">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {t('search.pagination.prev')}
                          </Button>
                          <div className="flex items-center px-4 py-2 bg-muted/30 rounded-xl font-bold text-sm">
                            {t('search.pagination.page', { current: currentPage, total: totalPages })}
                          </div>
                          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => navigate(`/search/page_${currentPage + 1}${location.search}`)} className="rounded-xl px-6">
                            {t('search.pagination.next')} <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in zoom-in-95 fade-in duration-500">
                  <div className="bg-card p-3 rounded-2xl shadow-xl border border-border/50 overflow-hidden isolate h-[650px] w-full">
                    <MapComponent properties={filteredProperties} />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Utilisez les filtres pour affiner les biens affichés sur la carte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating View Toggle Button */}
      {!isSearchActive && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] px-6 py-4 flex items-center gap-3 animate-in slide-in-from-bottom-8 duration-700 bg-primary hover:bg-primary/95 text-primary-foreground border-2 border-background min-w-[180px] group transition-all"
          >
            {viewMode === 'list' ? (
              <>
                <MapIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold tracking-tight">VOIR SUR LA CARTE</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold tracking-tight">VOIR LA LISTE</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Recherche;
