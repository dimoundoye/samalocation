import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useNavigate } from "react-router-dom";
import { Search, Home, Key, Wallet, MessageSquare, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";
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
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setLoadingProperties(true);
      // Utiliser notre nouveau backend local
      const data = await getProperties({ limit: 6 });

      const formatted = data.map((property: any) => transformProperty(property));
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
      rentPeriod: "mois" as const,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Simplifiez la{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  gestion locative
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Gérez vos biens, trouvez le logement idéal en ligne en toute simplicité au Sénégal.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup&type=owner")}
                  className="gradient-primary text-white shadow-medium hover:shadow-strong hover:scale-105 transition-all duration-300 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 w-full sm:w-auto group"
                >
                  <Home className="h-4 w-4 md:h-5 md:w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Mettre en location
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/search")}
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white hover:scale-105 transition-all duration-300 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 w-full sm:w-auto group"
                >
                  <Search className="h-4 w-4 md:h-5 md:w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Trouver un logement
                </Button>
              </div>

              {/* Search Bar */}
              <div className="pt-4">
                <div className="flex gap-2 p-2 bg-white shadow-medium rounded-xl hover:shadow-strong transition-all duration-300">
                  <Input
                    placeholder="Rechercher par ville, quartier..."
                    className="border-0 focus-visible:ring-0"
                    onKeyPress={(e) => e.key === 'Enter' && navigate("/search")}
                  />
                  <Button
                    className="gradient-accent text-white hover:scale-110 transition-transform duration-300"
                    onClick={() => navigate("/search")}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in perspective-1000 overflow-hidden xl:overflow-visible rounded-2xl lg:max-w-[520px] lg:mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl animate-pulse"></div>

              <div className="relative z-10 transform-gpu">
                <img
                  src={heroImage}
                  alt="Gestion locative"
                  className="w-full rounded-2xl shadow-strong animate-float hover:animate-none"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(240, 68, 56, 0.3))',
                    animation: 'float 6s ease-in-out infinite, tilt 8s ease-in-out infinite'
                  }}
                />

                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
              </div>

              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -top-4 -left-4 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

              <div className="absolute top-10 right-10 w-20 h-20 border-2 border-primary/30 rounded-full animate-spin-slow"></div>
              <div className="absolute bottom-20 left-10 w-16 h-16 border-2 border-accent/30 rounded-full animate-spin-slow" style={{ animationDelay: '2s', animationDirection: 'reverse' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pourquoi choisir Samalocation ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Key,
                title: "Gestion simplifiée",
                description: "Gérez tous vos biens depuis une seule plateforme intuitive",
              },
              {
                icon: MessageSquare,
                title: "Communication facile",
                description: "Messagerie intégrée entre propriétaires et locataires",
              },
              {
                icon: TrendingUp,
                title: "Suivi en temps réel",
                description: "Tableaux de bord avec statistiques et analytics",
              },
              {
                icon: Shield,
                title: "Sécurisé et fiable",
                description: "Vos données sont protégées et confidentielles",
              },
              {
                icon: Home,
                title: "Large choix",
                description: "Maisons, appartements, studios, garages, chambres et locales",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium hover:scale-105 hover:-translate-y-2 transition-all duration-300 animate-scale-in group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Biens disponibles</h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-primary hover:text-primary"
            >
              Voir tout →
            </Button>
          </div>

          {loadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  rentPeriod={property.rentPeriod}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => {
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
                    rentPeriod={property.primary_rent_period}
                    isApplied={property.id ? appliedPropertyIds.includes(property.id) : false}
                    ownerPhone={ownerPhone}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Rejoignez la communauté Samalocation
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Commencez dès aujourd'hui
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8"
          >
            Créer un compte gratuitement
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-secondary/20">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 Samalocation. Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Politique de confidentialité
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Conditions d'utilisation
            </a>
            <a href="/contact" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
