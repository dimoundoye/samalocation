import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Home, CheckCircle2, Phone, ArrowRight, Square, Bath } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const periodLabels: Record<string, string> = {
    jour: "jour",
    semaine: "semaine",
    mois: "mois",
  };

  const resolvedPeriod = periodLabels[rentPeriod] ?? "mois";

  const handleViewDetails = () => {
    if (id) {
      navigate(`/property/${id}`);
    } else {
      toast({
        title: "Détails du bien",
        description: "La page de détails sera bientôt disponible.",
      });
    }
  };

  return (
    <Card
      className="overflow-hidden shadow-medium hover:shadow-strong transition-all duration-300 group cursor-pointer flex flex-row sm:flex-col min-h-[165px] sm:h-auto w-full"
      onClick={handleViewDetails}
    >
      <div className="relative w-[38%] sm:w-full h-auto sm:h-48 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover bg-secondary/30 transition-transform duration-500 group-hover:scale-110"
        />
        <Badge
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${status === "available"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-muted hover:bg-muted"
            }`}
        >
          {status === "available" ? "Dispo" : "Occupé"}
        </Badge>
        {isApplied && (
          <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 bg-white/90 text-green-600 border border-green-200 text-[10px] px-1">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            Candidaté
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <CardContent className="p-2 sm:p-4 space-y-1 sm:space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-lg leading-tight text-primary mb-1">
              {title}
            </h3>

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
                  <span>{bedrooms} ch.</span>
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
                  <span>{bathrooms} sdb</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between mt-1 sm:mt-2">
            <div>
              <span className="text-base sm:text-xl font-bold text-primary">
                {price > 0 ? `${price.toLocaleString()} F` : "Sur demande"}
              </span>
              {price > 0 && (
                <span className="text-muted-foreground text-[10px] sm:text-sm ml-0.5">/{resolvedPeriod}</span>
              )}
            </div>

            <div className="sm:hidden flex items-center gap-0.5 text-accent text-[10px] font-bold pb-0.5 px-2 py-1 bg-accent/5 rounded-full">
              <span>Voir</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 sm:pt-4 hidden sm:flex">
          <Button
            className="w-full gradient-accent text-white hover:scale-105 transition-transform duration-300 h-9 sm:h-10"
            onClick={handleViewDetails}
          >
            Voir les détails
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default PropertyCard;
