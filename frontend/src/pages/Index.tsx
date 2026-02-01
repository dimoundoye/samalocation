import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
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
import heroLuxuryImage from "@/assets/hero-luxury-villa.png";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import { transformProperty, FormattedProperty } from "@/lib/property";
import { getProperties, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState<FormattedProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [appliedPropertyIds, setAppliedPropertyIds] = useState<string[]>([]);

  useEffect(() => {
    loadFeaturedProperties();
    loadAppliedProperties();
  }, [user]);

  const loadFeaturedProperties = async () => {
    try {
      setLoadingProperties(true);
      const data = await getProperties({ limit: 6 });

      // Handle both direct array (old) and paginated object (new)
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
      title: "Appartement moderne à Almadies",
      location: "Almadies, Dakar",
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
      title: "Villa spacieuse à Fann",
      location: "Fann, Dakar",
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
      title: "Studio meublé à Mermoz",
      location: "Mermoz, Dakar",
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent hidden lg:block" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span>La révolution locative au Sénégal</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Gérez & Trouvez un bien
                </span>
                <br />
                <span className="text-accent">en toute confiance.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Samalocation simplifie la vie des propriétaires et des locataires.
                Une plateforme <span className="text-primary font-semibold">transparente, sécurisée et 100% digitale</span> au Sénégal.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup&type=owner")}
                  className="gradient-primary h-14 px-10 text-lg shadow-strong hover:scale-105 transition-transform"
                >
                  <Home className="h-5 w-5 mr-3" />
                  Mettre en location
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/search")}
                  className="h-14 px-10 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-medium"
                >
                  <Search className="h-5 w-5 mr-3" />
                  Chercher un bien
                </Button>
              </div>

              {/* Quick Search */}
              <div className="max-w-xl p-2 bg-card dark:bg-card rounded-2xl shadow-strong flex flex-col sm:flex-row items-center gap-2 border border-border/50 transition-all">
                <div className="flex items-center w-full gap-2 px-2">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Quartier, ville (ex: Almadies, Thiès...)"
                    className="border-0 focus-visible:ring-0 text-lg h-12 w-full bg-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && navigate("/search")}
                  />
                </div>
                <Button
                  onClick={() => navigate("/search")}
                  className="h-12 w-full sm:w-12 rounded-xl gradient-accent shadow-medium hover:scale-105 sm:hover:scale-110 transition-transform"
                >
                  <span className="sm:hidden font-bold mr-2">Rechercher</span>
                  <ArrowRight className="h-6 w-6 text-white" />
                </Button>
              </div>


            </div>

            <div className="relative animate-fade-in lg:block">
              <div className="absolute -inset-10 bg-accent/5 blur-3xl rounded-full" />
              <div className="relative rounded-[2.5rem] border-[8px] border-white/50 backdrop-blur-sm shadow-strong overflow-hidden animate-float max-h-[550px] aspect-[4/5] lg:aspect-auto">
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

      {/* Value Proposition Grid */}
      <section className="py-24 bg-background border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto mb-20 space-y-4">
            <h2 className="text-5xl md:text-5xl font-bold text-primary"> Pourquoi choisir Samalocation ? </h2>
            <p className="text-lg text-muted-foreground">
              Nous avons construit la solution idéale pour le marché sénégalais,
              en combinant technologie moderne et simplicité d'utilisation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Sécurité",
                description: "Vérification des profils et protection de vos documents et transactions.",
                color: "bg-blue-500/10 text-blue-600"
              },
              {
                icon: Clock,
                title: "Gain de Temps",
                description: "Digitalisez vos visites et la gestion de vos biens en quelques clics.",
                color: "bg-accent/10 text-accent"
              },
              {
                icon: CheckCircle2,
                title: "Transparence Totale",
                description: "Des échanges clairs, sans frais cachés, pour une confiance mutuelle.",
                color: "bg-green-500/10 text-green-600"
              }
            ].map((prop, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-card border border-transparent hover:border-primary/20 hover:bg-secondary/50 dark:hover:bg-primary/5 hover:shadow-medium transition-all group">
                <div className={`h-14 w-14 rounded-2xl ${prop.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <prop.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{prop.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
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
                <h3 className="text-3xl lg:text-4xl font-bold">Pour les Propriétaires</h3>
                <p className="text-white/80 text-lg leading-relaxed max-w-md">
                  Gérez votre patrimoine avec sérénité. Trouvez des locataires vérifiés et suivez vos paiements sans stress.
                </p>
                <ul className="space-y-4">
                  {["Publication gratuite", "Trouvez des locataires ", "Suivez vos paiements", "Gestion des quittances"].map((item, i) => (
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
                  Publier mon annonce
                </Button>
              </div>
            </div>

            {/* Tenants */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-card p-10 lg:p-16 text-primary dark:text-foreground shadow-strong border border-border/50">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Users size={200} />
              </div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-3xl lg:text-4xl font-bold">Pour les Locataires</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Le logement de vos rêves est à portée de clic. Visites facilitées et échange direct avec les propriétaires.
                </p>
                <ul className="space-y-4 text-primary/80">
                  {["Annonces vérifiées au Sénégal", "Filtrage intelligent", "Candidature en un clic", "Discuter avec le propriétaire"].map((item, i) => (
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
                  Trouver mon logement
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-secondary/30 dark:bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-primary">Biens à la une</h2>
              <p className="text-muted-foreground text-lg">Découvrez les meilleures opportunités du moment.</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-primary hover:text-primary group text-lg font-semibold"
            >
              Voir tout l'immobilier <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
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

      {/* Process / How it Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">Comment ça marche ?</h2>
            <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
          </div>

          <div className="relative">
            {/* Line connecting steps (desktop) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -translate-y-1/2 hidden lg:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { step: "01", title: "Cherchez", desc: "Explorez nos annonces vérifiées partout au Sénégal." },
                { step: "02", title: "Candidature", desc: "Discutez avec le propriétaire en toute sérénité." },
                { step: "03", title: "Installez-vous", desc: "Emménagez en toute sérénité." }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="h-20 w-20 rounded-3xl bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-8 border-[6px] border-background shadow-strong group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">{item.title}</h3>
                  <p className="text-muted-foreground text-lg px-4">{item.desc}</p>
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
                Prêt à simplifier votre expérience locative ?
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Rejoignez des centaines de Sénégalais qui ont déjà choisi Samalocation pour une gestion transparente.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="bg-white text-primary hover:bg-white/90 h-16 px-12 text-xl font-bold rounded-2xl shadow-strong transition-all hover:scale-105"
                >
                  S'inscrire gratuitement
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="bg-white text-primary hover:bg-white/90 h-16 px-12 text-xl font-bold rounded-2xl shadow-strong transition-all hover:scale-105"
                >
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-secondary/30 dark:bg-background border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Samalocation
              </span>
              <p className="text-muted-foreground leading-relaxed">
                La plateforme de référence pour la location immobilière au Sénégal. Sécurité, simplicité, transparence.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Navigation</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="/" className="hover:text-accent transition-colors">Accueil</a></li>
                <li><a href="/search" className="hover:text-accent transition-colors">Rechercher</a></li>
                <li><a href="/auth" className="hover:text-accent transition-colors">Se connecter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Légal</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="/terms" className="hover:text-accent transition-colors">Conditions Générales</a></li>
                <li><a href="/privacy" className="hover:text-accent transition-colors">Confidentialité</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Support</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="/contact" className="hover:text-accent transition-colors">Contactez-nous</a></li>
                <li><a href="mailto:contact@samalocation.com" className="hover:text-accent transition-colors">contact@samalocation.com</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm">
              © 2026 Samalocation. Tous droits réservés au Sénégal
            </p>
            <div className="flex gap-6">
              {/* Social icons placeholder  */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
