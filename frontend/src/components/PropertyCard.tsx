import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Home, CheckCircle2, Phone, ArrowRight, Square, Bath, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addFavorite, removeFavorite, checkFavoriteStatus } from "@/lib/api";

interface PropertyCardProps {
  id?: string;
  image: string;
  title: string;
  location: string;
  price: number;
  type: string;
  status: "available" | "occupied";
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  isApplied?: boolean;
  rentPeriod?: "jour" | "semaine" | "mois";
  ownerPhone?: string;
  isVerifiedOwner?: boolean;
  showStatus?: boolean;
  isNew?: boolean;
  initialIsFavorite?: boolean;
}

const PropertyCard = ({
  id,
  image,
  title,
  location,
  price,
  type,
  status,
  bedrooms,
  bathrooms,
  area,
  isApplied,
  rentPeriod = "mois",
  ownerPhone,
  isVerifiedOwner,
  showStatus = false,
  isNew = false,
  initialIsFavorite = false,
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(() => {
    if (user && id && !initialIsFavorite) {
      checkFavoriteStatus(id).then(res => {
        if (res.isFavorite) setIsFavorite(true);
      });
    }
  }, [user, id, initialIsFavorite]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: t('property.favorites.login_required'),
        description: t('property.favorites.login_required_desc'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!id) return;

    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(id);
        setIsFavorite(false);
        toast({
          title: t('property.favorites.removed'),
          description: t('property.favorites.removed_desc'),
        });
      } else {
        await addFavorite(id);
        setIsFavorite(true);
        toast({
          title: t('property.favorites.added'),
          description: t('property.favorites.added_desc'),
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const periodLabels: Record<string, string> = {
    jour: t('period.jour'),
    semaine: t('period.semaine'),
    mois: t('period.mois'),
  };

  const resolvedPeriod = periodLabels[rentPeriod] ?? t('period.mois');

  const handleViewDetails = () => {
    if (id) {
      navigate(`/property/${id}`);
    } else {
      toast({
        title: t('property.view_details'),
        description: t('property.details_soon'),
      });
    }
  };

  return (
    <Card
      className="overflow-hidden shadow-medium hover:shadow-strong transition-all duration-300 group cursor-pointer flex flex-row sm:flex-col min-h-[160px] max-h-[160px] sm:min-h-0 sm:max-h-none sm:h-auto w-full"
      onClick={handleViewDetails}
    >
      <div className="relative w-[38%] sm:w-full h-[160px] sm:h-48 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover bg-secondary/30 transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.jpg";
          }}
        />
        {showStatus && (
          <Badge
            className={`absolute bottom-2 right-2 z-20 text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${status === "available"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-muted hover:bg-muted"
              }`}
          >
            {status === "available" ? t('property.available') : t('property.occupied')}
          </Badge>
        )}
        {isApplied && (
          <Badge className={`absolute ${isNew ? 'top-8 sm:top-10' : 'top-2 sm:top-3'} left-2 sm:left-3 z-20 bg-white/90 text-green-600 border border-green-200 text-[10px] px-1 shadow-sm`}>
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            {t('property.applied')}
          </Badge>
        )}
        {isNew && (
          <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 bg-orange-500 text-white border-none text-[10px] sm:text-xs px-2 py-0.5 shadow-md animate-pulse">
            {t('property.new') || "Nouveau"}
          </Badge>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={isFavoriteLoading}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full z-30 transition-all duration-300 ${
            isFavorite 
              ? "bg-red-500 text-white shadow-lg scale-110" 
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 shadow-md"
          }`}
          title={isFavorite ? t('property.favorites.remove') : t('property.favorites.add')}
        >
          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <CardContent className="p-2 sm:p-4 space-y-1 sm:space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <h3 className="font-bold text-sm sm:text-lg leading-tight text-primary">
                {title}
              </h3>
              {isVerifiedOwner && (
                <div title={t('property.verified_owner')} className="flex items-center text-green-600 bg-green-50 px-1 py-0.5 rounded text-[10px] font-bold shrink-0">
                  <Shield className="h-3 w-3 mr-0.5" /> {t('property.verified')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-[11px] sm:text-sm mb-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1">
                <Home className="h-3 w-3 shrink-0 text-accent" />
                <span className="capitalize">{type}</span>
              </div>
              {bedrooms && (
                <div className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3 shrink-0 text-accent" />
                  <span>{bedrooms} {t('property.bedrooms_short')}</span>
                </div>
              )}
              {area && (
                <div className="flex items-center gap-1">
                  <Square className="h-3 w-3 shrink-0 text-accent" />
                  <span>{area} m²</span>
                </div>
              )}
              {bathrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3 shrink-0 text-accent" />
                  <span>{bathrooms} {t('property.bathrooms_short')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between mt-1 sm:mt-2">
            <div>
              <span className="text-base sm:text-xl font-bold text-primary">
                {price > 0 ? `${price.toLocaleString()} F` : t('property.on_request')}
              </span>
              {price > 0 && (
                <span className="text-muted-foreground text-[10px] sm:text-sm ml-0.5">/{resolvedPeriod}</span>
              )}
            </div>

            <div className="sm:hidden flex items-center gap-0.5 text-accent text-[10px] font-bold pb-0.5 px-2 py-1 bg-accent/5 rounded-full">
              <span>{t('common.view')}</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 sm:pt-4 hidden sm:flex">
          <Button
            className="w-full gradient-accent text-white hover:scale-105 transition-transform duration-300 h-9 sm:h-10"
            onClick={handleViewDetails}
          >
            {t('property.view_details')}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default PropertyCard;
