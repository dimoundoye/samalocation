import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import Footer from "@/components/Footer";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Home,
  Key,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Zap,
  Building2,
  MapPin,
  Clock
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heroLuxuryImage from "@/assets/hero-luxury-villa.png";
import hero3dImage from "@/assets/samalocation-hero-3d.jpg";
import samalocationBg from "@/assets/hero20-clean-nobox.jpg";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import { transformProperty, FormattedProperty } from "@/lib/property";
import { getProperties, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { isRecent } from "@/lib/dateUtils";
import { Sparkles, FileText, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [featuredProperties, setFeaturedProperties] = useState<FormattedProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  // ... (lines 41-118 remain unchanged in logic)
  useEffect(() => {
    loadFeaturedProperties();
    loadAppliedProperties();
  }, [user]);

  const loadFeaturedProperties = async () => {
    try {
      setLoadingProperties(true);
      const data = await getProperties({ limit: 6 });

      const propertiesList = Array.isArray(data) ? data : (data.properties || []);
      const formatted = propertiesList.map((property: any) => transformProperty(property));
      setFeaturedProperties(formatted);
    } catch (error) {
      console.error("Error loading featured properties:", error);
      setFeaturedProperties([]);
    } finally {
      setLoadingProperties(false);
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

  const fallbackProperties = [
    {
      image: property1,
      title: "Appartement moderne",
      location: "Centre Ville",
      price: 350000,
      type: "Appartement",
      status: "available" as const,
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      rentPeriod: "mois" as const,
    },
    {
      image: property2,
      title: "Villa spacieuse",
      location: "Quartier Résidentiel",
      price: 500000,
      type: "Maison",
      status: "available" as const,
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      rentPeriod: "mois" as const,
    },
    {
      image: property1,
      title: "Studio meublé",
      location: "Quartier Calme",
      price: 150000,
      type: "Studio",
      status: "occupied" as const,
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      rentPeriod: "mois" as const,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <SEO 
        title="Samalocation - Simplifiez votre gestion locative en ligne"
        description="Trouvez votre prochain logement ou gérez vos biens immobiliers en toute simplicité. Appartements, villas, studios et plus."
      />
      <Navbar />

      {/* Hero Section - Exact OriginKit Hero 20 */}
      <section className="relative overflow-hidden min-h-[90vh] pt-36 pb-32 md:pt-44 md:pb-40 bg-[#FAF8F5] dark:bg-[#0d0d0e] flex flex-col items-center justify-start text-center">
        {/* Left & Right Technical Grid Ruler Borders */}
        <div className="absolute top-0 bottom-0 left-3 md:left-10 w-px border-r border-dashed border-neutral-300/80 dark:border-neutral-800 pointer-events-none z-20" />
        <div className="absolute top-0 bottom-0 right-3 md:right-10 w-px border-r border-dashed border-neutral-300/80 dark:border-neutral-800 pointer-events-none z-20" />

        {/* 100% Responsive Samalocation Hero Artwork */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-end justify-center">
          <img
            src={samalocationBg}
            alt="Samalocation Hero Artwork"
            className="w-full h-[65%] sm:h-[75%] lg:h-[85%] xl:h-full object-contain xl:object-cover object-bottom xl:object-center opacity-85 sm:opacity-95 mix-blend-multiply dark:mix-blend-screen transition-all duration-300"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-7 animate-slide-up">
            {/* Headline matching exact Archiflow model size */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-tight leading-[1.15] text-[#0B1B3D] dark:text-white max-w-3xl">
              Gérez & Trouvez un logement <br className="hidden sm:inline" />
              en toute confiance.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg font-normal leading-relaxed opacity-85">
              {t('hero.description')}
            </p>

            {/* Buttons in Samalocation Brand Style */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
              <Button
                onClick={() => navigate("/search")}
                className="h-12 px-7 rounded-xl gradient-primary hover:opacity-95 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Explorer les biens</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup&type=owner")}
                variant="outline"
                className="h-12 px-7 rounded-xl border-primary/30 hover:bg-primary/5 text-primary dark:text-white font-bold text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Home className="h-4 w-4 text-primary" />
                <span>Mettre en location</span>
              </Button>
            </div>

            {/* Floating Search Bar Integration */}
            <div className="w-full max-w-xl pt-6">
              <div className="p-2.5 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 min-w-0 px-2 py-1">
                  <SearchAutocomplete 
                    placeholder={t('hero.search_placeholder') || "Quartier, ville (Dakar, Saly...)"}
                    initialValue={searchQuery}
                    onValueChange={setSearchQuery}
                    className="w-full text-left"
                  />
                </div>
                <div className="hidden sm:block h-7 w-px bg-neutral-200 dark:bg-neutral-800" />
                
                <div className="w-full sm:w-auto min-w-[120px] shrink-0">
                  <Select 
                    value={selectedType} 
                    onValueChange={(val) => {
                      setSelectedType(val);
                      const params = new URLSearchParams();
                      if (searchQuery.trim()) {
                        params.set("q", searchQuery.trim());
                      }
                      if (val && val !== "all") {
                        params.set("type", val);
                      }
                      navigate(`/search?${params.toString()}`);
                    }}
                  >
                    <SelectTrigger className="border-0 focus:ring-0 shadow-none bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 h-9 px-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      <SelectValue placeholder={t('search.property_type') || "Type de bien"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-200 bg-white dark:bg-neutral-900">
                      <SelectItem value="all" className="rounded-lg cursor-pointer">Tous les types</SelectItem>
                      <SelectItem value="appartement" className="rounded-lg cursor-pointer">{t('search.types.apartment') || "Appartement"}</SelectItem>
                      <SelectItem value="maison" className="rounded-lg cursor-pointer">{t('search.types.house') || "Maison"}</SelectItem>
                      <SelectItem value="villa" className="rounded-lg cursor-pointer">{t('search.types.villa') || "Villa"}</SelectItem>
                      <SelectItem value="studio" className="rounded-lg cursor-pointer">{t('search.types.studio') || "Studio"}</SelectItem>
                      <SelectItem value="chambre" className="rounded-lg cursor-pointer">{t('search.types.room') || "Chambre"}</SelectItem>
                      <SelectItem value="garage" className="rounded-lg cursor-pointer">{t('search.types.garage') || "Garage"}</SelectItem>
                      <SelectItem value="locale" className="rounded-lg cursor-pointer">{t('search.types.office') || "Local"}</SelectItem>
                      <SelectItem value="terrain" className="rounded-lg cursor-pointer">{t('search.types.land') || "Terrain"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (searchQuery.trim()) {
                      params.set("q", searchQuery.trim());
                    }
                    if (selectedType && selectedType !== "all") {
                      params.set("type", selectedType);
                    }
                    navigate(`/search?${params.toString()}`);
                  }}
                  className="h-10 w-full sm:w-10 rounded-xl gradient-primary hover:opacity-95 text-white font-bold transition-all shadow-medium flex items-center justify-center shrink-0"
                >
                  <span className="sm:hidden font-bold mr-2 text-sm">Rechercher</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties (Bien à la une) - Moved up for more visibility */}
      <section className="py-24 bg-secondary/30 dark:bg-background border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-primary">{t('featured.title')}</h2>
              <p className="text-foreground/90 text-lg">{t('featured.desc')}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-primary hover:text-primary group text-lg font-semibold"
            >
              {t('featured.view_all')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>

          {loadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[400px] bg-card border border-border/50 rounded-[2rem] animate-pulse"
                />
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {fallbackProperties.map((property, index) => (
                <PropertyCard
                  key={index}
                  image={property.image}
                  title={property.title}
                  location={property.location}
                  price={property.price}
                  type={property.type}
                  status={property.status}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  rentPeriod={property.rentPeriod}
                />
              ))}
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {featuredProperties.map((property) => {
                  const ownerProfile = (property as any).owner_profiles
                    ? Array.isArray((property as any).owner_profiles)
                      ? (property as any).owner_profiles[0]
                      : (property as any).owner_profiles
                    : null;
                  const ownerPhone = ownerProfile?.contact_phone || ownerProfile?.phone;

                  return (
                    <CarouselItem key={property.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/4">
                      <PropertyCard
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
                        isApplied={property.id ? appliedPropertyIds.includes(property.id) : false}
                        ownerPhone={ownerPhone}
                        isVerifiedOwner={ownerProfile?.is_verified || ownerProfile?.verification_status === 'verified'}
                        ownerLogo={ownerProfile?.logo_url}
                        isNew={isRecent(property.published_at)}
                        listingType={property.listing_type as any}
                        salePrice={property.sale_price}
                        currency={property.currency}
                      />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-1 sm:left-2 md:-left-12 h-9 w-9 sm:h-10 sm:w-10 bg-white/95 dark:bg-card/95 shadow-strong border border-primary/15 text-primary hover:bg-primary hover:text-white transition-all z-30 opacity-100 flex items-center justify-center p-0" />
              <CarouselNext className="right-1 sm:right-2 md:-right-12 h-9 w-9 sm:h-10 sm:w-10 bg-white/95 dark:bg-card/95 shadow-strong border border-primary/15 text-primary hover:bg-primary hover:text-white transition-all z-30 opacity-100 flex items-center justify-center p-0" />
            </Carousel>
          )}
        </div>
      </section>

      {/* For Owners vs For Tenants */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Owners */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-primary p-10 lg:p-16 text-white shadow-strong">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Building2 size={200} />
              </div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-3xl lg:text-4xl font-bold">{t('roles.owners.title')}</h3>
                <p className="text-white/80 text-lg leading-relaxed max-w-md">
                  {t('roles.owners.desc')}
                </p>
                <ul className="space-y-4">
                  {[t('roles.owners.item1'), t('roles.owners.item2'), t('roles.owners.item3'), t('roles.owners.item4')].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup&type=owner")}
                  className="bg-white text-primary hover:bg-white/90 h-14 px-8 rounded-xl font-bold shadow-strong"
                >
                  {t('roles.owners.cta')}
                </Button>
              </div>
            </div>

            {/* Tenants */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-card p-10 lg:p-16 text-primary dark:text-foreground shadow-strong border border-border/50">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Users size={200} />
              </div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-3xl lg:text-4xl font-bold">{t('roles.tenants.title')}</h3>
                <p className="text-foreground/90 text-lg leading-relaxed max-w-md">
                  {t('roles.tenants.desc')}
                </p>
                <ul className="space-y-4 text-primary/80">
                  {[t('roles.tenants.item1'), t('roles.tenants.item2'), t('roles.tenants.item3'), t('roles.tenants.item4')].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/search")}
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white h-14 px-8 rounded-xl font-bold"
                >
                  {t('roles.tenants.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Process / How it Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">{t('process.title')}</h2>
            <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
          </div>

          <div className="relative">
            {/* Line connecting steps (desktop) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -translate-y-1/2 hidden lg:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { step: "01", title: t('process.step1.title'), desc: t('process.step1.desc') },
                { step: "02", title: t('process.step2.title'), desc: t('process.step2.desc') },
                { step: "03", title: t('process.step3.title'), desc: t('process.step3.desc') }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="h-20 w-20 rounded-3xl bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-8 border-[6px] border-background shadow-strong group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">{item.title}</h3>
                  <p className="text-foreground/90 text-lg px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-strong">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t('cta.desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="bg-white text-primary hover:bg-white/90 h-16 px-12 text-xl font-bold rounded-2xl shadow-strong transition-all hover:scale-105"
                >
                  {t('cta.signup')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="bg-white text-primary hover:bg-white/90 h-16 px-12 text-xl font-bold rounded-2xl shadow-strong transition-all hover:scale-105"
                >
                  {t('cta.contact')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
