import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Home, CheckCircle2, Phone, ArrowRight } from "lucide-react";
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
      className="overflow-hidden shadow-medium hover:shadow-strong hover:scale-105 hover:-translate-y-2 transition-all duration-300 group cursor-pointer flex flex-row sm:flex-col h-40 sm:h-auto"
      onClick={handleViewDetails}
    >
      <div className="relative w-1/3 sm:w-full h-full sm:h-48 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover bg-secondary/30 transition-transform duration-500 group-hover:scale-110"
        />
        <Badge
          className={`absolute top-3 right-3 z-20 transition-all duration-300 group-hover:scale-110 ${status === "available"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-muted hover:bg-muted"
            }`}
        >
          {status === "available" ? "Disponible" : "Occupé"}
        </Badge>
        {isApplied && (
          <Badge className="absolute top-3 left-3 z-20 bg-white/90 text-green-600 border border-green-200">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Candidaté</span>
            </div>
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <CardContent className="p-4 space-y-2 flex-1 relative">
          <h3 className="font-semibold text-lg line-clamp-1 pr-6">{title}</h3>

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4 shrink-0" />
              <span>{type}</span>
            </div>
            {bedrooms && (
              <div className="flex items-center gap-1">
                <BedDouble className="h-4 w-4 shrink-0" />
                <span>{bedrooms} ch.</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <span className="text-xl font-bold text-primary">
              {price > 0 ? `${price.toLocaleString()} F` : "Prix sur demande"}
            </span>
            {price > 0 && (
              <span className="text-muted-foreground text-sm">/{resolvedPeriod}</span>
            )}
          </div>

          <div className="sm:hidden flex items-center gap-1 text-primary text-xs font-bold pt-1">
            <span>Voir détails</span>
            <ArrowRight className="h-3 w-3" />
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
