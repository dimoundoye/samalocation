import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getFavorites } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Favorites = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
            return;
        }

        const fetchFavorites = async () => {
            try {
                const data = await getFavorites();
                setFavorites(data);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchFavorites();
        }
    }, [user, authLoading, navigate]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Heart className="h-8 w-8 text-red-500 fill-current" />
                            {t('nav.favorites') || "Mes Favoris"}
                        </h1>
                        <p className="text-muted-foreground">
                            {favorites.length} {favorites.length > 1 ? "biens enregistrés" : "bien enregistré"}
                        </p>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-secondary">
                        <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <h2 className="text-2xl font-semibold mb-2">Aucun favori pour le moment</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Explorez nos logements et cliquez sur le cœur pour les retrouver ici facilement.
                        </p>
                        <Button onClick={() => navigate("/search")} className="gradient-accent text-white">
                            Explorer les logements
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((property) => (
                            <PropertyCard
                                key={property.id}
                                id={property.id}
                                title={property.name}
                                location={property.address}
                                price={property.property_units?.[0]?.monthly_rent || 0}
                                image={property.photos?.[0] || property.photo_url || "/placeholder.jpg"}
                                type={property.property_type}
                                status={property.property_units?.some((u: any) => u.is_available) ? "available" : "occupied"}
                                bedrooms={property.property_units?.[0]?.bedrooms}
                                bathrooms={property.property_units?.[0]?.bathrooms}
                                area={property.property_units?.[0]?.area_sqm}
                                initialIsFavorite={true}
                                showStatus={true}
                            />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Favorites;
