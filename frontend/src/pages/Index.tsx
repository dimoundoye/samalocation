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
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import { transformProperty, FormattedProperty } from "@/lib/property";
import { getProperties, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { isRecent } from "@/lib/dateUtils";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [featuredProperties, setFeaturedProperties] = useState<FormattedProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

      {/* Hero Section */}
      <section className="relative overflow-visible pt-36 pb-20 md:pt-40 md:pb-28">
        {/* Soft Background Ambient Light Glows */}
        <div className="absolute top-1/4 left-[10%] w-[350px] h-[350px] bg-primary/10 dark:bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-[10%] w-[400px] h-[400px] bg-accent/5 dark:bg-accent/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 animate-slide-up">
              <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] sm:leading-tight text-primary dark:text-white">
                {t('hero.title_part1')}
                <br />
                {t('hero.title_part2')}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                {t('hero.description')}
              </p>

              {/* Unified Search and Action Widget */}
              <Tabs defaultValue="find" className="w-full max-w-xl relative z-20 pt-2">
                <TabsList className="grid grid-cols-2 w-full max-w-[360px] h-12 bg-secondary/80 dark:bg-secondary/30 p-1.5 rounded-2xl mb-4 border border-border/40">
                  <TabsTrigger value="find" className="rounded-xl font-bold text-sm h-9 transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Trouver un bien
                  </TabsTrigger>
                  <TabsTrigger value="list" className="rounded-xl font-bold text-sm h-9 transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Mettre en location
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="find" className="animate-scale-in">
                  <div className="p-3 bg-card dark:bg-card border border-border/60 shadow-strong rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0 py-1">
                      <SearchAutocomplete 
                        placeholder={t('hero.search_placeholder') || "Quartier, ville..."}
                        initialValue={searchQuery}
                        onValueChange={setSearchQuery}
                        className="w-full"
                      />
                    </div>
                    <div className="hidden sm:block h-8 w-px bg-border/80" />
                    
                    <div className="w-full sm:w-auto min-w-[130px] shrink-0">
                      <Select onValueChange={(val) => navigate(`/search?type=${val}`)}>
                        <SelectTrigger className="border-0 focus:ring-0 shadow-none bg-transparent hover:bg-secondary/20 dark:hover:bg-secondary/10 h-10 px-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
                          <SelectValue placeholder={t('search.property_type') || "Type de bien"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-strong bg-card dark:bg-card">
                          <SelectItem value="apartment" className="rounded-lg cursor-pointer">{t('search.types.apartment') || "Appartement"}</SelectItem>
                          <SelectItem value="house" className="rounded-lg cursor-pointer">{t('search.types.house') || "Maison"}</SelectItem>
                          <SelectItem value="villa" className="rounded-lg cursor-pointer">{t('search.types.villa') || "Villa"}</SelectItem>
                          <SelectItem value="studio" className="rounded-lg cursor-pointer">{t('search.types.studio') || "Studio"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                      className="h-12 w-full sm:w-12 rounded-xl gradient-accent shadow-medium hover:scale-105 transition-transform flex items-center justify-center shrink-0 animate-fade-in"
                    >
                      <span className="sm:hidden font-bold mr-2 text-base">{t('hero.search_button')}</span>
                      <ArrowRight className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="list" className="animate-scale-in">
                  <div className="p-5 bg-card dark:bg-card border border-border/60 shadow-strong rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="font-bold text-base text-primary dark:text-white">Vous êtes propriétaire ?</h4>
                      <p className="text-xs text-muted-foreground">Publiez vos annonces et gérez vos locataires simplement.</p>
                    </div>
                    <Button
                      onClick={() => navigate("/auth?mode=signup&type=owner")}
                      className="w-full sm:w-auto h-11 px-5 rounded-xl gradient-primary text-white font-bold shadow-medium hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 animate-fade-in"
                    >
                      <Home className="h-4 w-4" />
                      <span>{t('hero.list_property')}</span>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="relative animate-fade-in hidden md:block md:-mt-16 lg:-mt-20">
              <div className="absolute -inset-10 bg-accent/5 blur-3xl rounded-full" />
              <div className="relative rounded-[2.5rem] border-[8px] border-white/50 dark:border-white/10 backdrop-blur-sm shadow-strong overflow-hidden animate-float max-h-[550px] aspect-[4/5] md:aspect-auto">
                <img
                  src={heroLuxuryImage}
                  alt="Modern Luxury Real Estate"
                  className="w-full h-full object-cover relative z-10"
                  style={{
                    filter: 'drop-shadow(20px 40px 30px rgba(0, 0, 0, 0.4))'
                  }}
                />
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
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </div>
              <div className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-50">
                <CarouselPrevious className="h-10 w-10 bg-background/80 dark:bg-card/80 shadow-strong border border-primary/10 text-primary hover:bg-background dark:hover:bg-card transition-all scale-100 active:scale-90 flex items-center justify-center p-0" />
              </div>
              <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-50">
                <CarouselNext className="h-10 w-10 bg-background/80 dark:bg-card/80 shadow-strong border border-primary/10 text-primary hover:bg-background dark:hover:bg-card transition-all scale-100 active:scale-90 flex items-center justify-center p-0" />
              </div>
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
