import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, BedDouble, Home, Bath, Square, Calendar, Shield, AlertCircle, Phone, Mail, CheckCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { transformProperty, FormattedProperty } from "@/lib/property";
import propertyFallback from "@/assets/property-1.jpg";
import PropertyCard from "@/components/PropertyCard";
import { getPropertyById, getProperties, sendMessage, createNotification, getMessages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [suggestedProperties, setSuggestedProperties] = useState<FormattedProperty[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadPropertyData();
  }, [id, user]);

  const loadPropertyData = async () => {
    setSuggestedProperties([]);
    try {
      setLoading(true);

      // Utiliser notre nouveau backend local
      const propertyData = await getPropertyById(id!);

      if (!propertyData) {
        setProperty(null);
        return;
      }

      if (user && propertyData?.id) {
        try {
          const messages = await getMessages();
          const existingApplication = messages.find((m: any) => m.property_id === propertyData.id && m.sender_id === user.id);
          setHasApplied(!!existingApplication);
        } catch (applicationCheckError) {
          console.error("Unexpected error checking existing application:", applicationCheckError);
          setHasApplied(false);
        }
      } else {
        setHasApplied(false);
      }

      setProperty(transformProperty(propertyData));
    } catch (error) {
      console.error("Error loading property:", error);
      toast({
        title: "Erreur lors du chargement",
        description:
          "Impossible de charger les détails du bien. Vérifiez votre connexion et réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (hasApplied) {
      return;
    }

    if (!user) {
      setShowAuthDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const sendApplication = async () => {
    try {
      if (!user || !property) {
        console.error("Missing user or property data:", { user, property });
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer la candidature. Données manquantes.",
          variant: "destructive",
        });
        return;
      }

      if (!property.owner_id) {
        console.error("Property has no owner_id:", property);
        toast({
          title: "Erreur",
          description: "Ce bien n'a pas de propriétaire associé.",
          variant: "destructive",
        });
        return;
      }

      console.log("Sending application:", {
        sender_id: user.id,
        receiver_id: property.owner_id,
        property_id: property.id,
      });

      const messageText = `Bonjour,\n\nJe suis candidat(e) pour le bien "${property.name}" situé à ${property.address}.\n\nMerci de me répondre.\n\nCordialement.`;

      await sendMessage({
        receiver_id: property.owner_id,
        message: messageText,
        property_id: property.id,
      });

      setHasApplied(true);

      toast({
        title: "Candidature envoyée",
        description: "Votre candidature a été envoyée au propriétaire. Vous recevrez une réponse par message.",
      });

      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        title: "Erreur lors de la candidature",
        description: error.message || "Une erreur est survenue lors de l'envoi de votre candidature.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!property?.id) {
      setSuggestedProperties([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);

        const data = await getProperties({ limit: 5 });
        const filtered = data.filter((item: any) => item.id !== property.id).slice(0, 4);

        const formatted = filtered.map((item: any) => transformProperty(item));
        setSuggestedProperties(formatted);
      } catch (error) {
        console.error("Error loading suggested properties:", error);
        setSuggestedProperties([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [property?.id, property?.property_type]);

  const equipmentList = useMemo(() => {
    if (!property) return [];
    const raw = (property as any).equipments;

    if (Array.isArray(raw)) {
      return raw
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0);
    }

    if (typeof raw === "string" && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item: unknown) => String(item ?? "").trim())
            .filter((item) => item.length > 0);
        }
      } catch {
        // Not JSON, fallback to splitting
      }

      return raw
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  }, [property]);

  // Préparer les photos pour la galerie (même si property n'est pas encore chargé)
  const coverPhoto = property?.cover_photo || property?.photo_url || propertyFallback;
  const galleryPhotos: string[] = property?.photos?.filter((url: string) => url && url !== coverPhoto) ?? [];

  // Toutes les photos pour la galerie modale (photo de couverture + galerie)
  const allPhotos = useMemo(() => {
    if (!coverPhoto) return [];
    const photos = [coverPhoto];
    if (galleryPhotos.length > 0) {
      photos.push(...galleryPhotos);
    }
    return photos;
  }, [coverPhoto, galleryPhotos]);

  // Navigation au clavier pour la galerie
  useEffect(() => {
    if (!galleryOpen || allPhotos.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev + 1) % allPhotos.length);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
      } else if (e.key === "Escape") {
        setGalleryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, allPhotos.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Bien introuvable</h1>
          <Button onClick={() => navigate("/search")}>
            Retour à la recherche
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} F CFA`;
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    if (allPhotos.length === 0) return;
    setSelectedImageIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const previousImage = () => {
    if (allPhotos.length === 0) return;
    setSelectedImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const totalUnits = property?.total_units ?? property?.property_units?.length ?? 0;
  const availableUnits =
    property.available_units ??
    (Array.isArray(property.property_units)
      ? property.property_units.filter((unit: any) => unit?.is_available !== false).length
      : 0);
  const hasUnitsDetails = Array.isArray(property.property_units) && property.property_units.length > 0;
  const aggregatedBedrooms = property.aggregated_bedrooms ?? 0;

  const ownerProfile = property.owner_profiles
    ? Array.isArray(property.owner_profiles)
      ? property.owner_profiles[0]
      : property.owner_profiles
    : null;

  const ownerCompanyName = ownerProfile?.company_name || "Non renseigné";
  const ownerContactPhone = ownerProfile?.contact_phone || ownerProfile?.phone || null;
  const ownerContactEmail = ownerProfile?.contact_email || null;
  const rentPeriodLabels: Record<string, string> = {
    jour: "jour",
    semaine: "semaine",
    mois: "mois",
  };
  const propertyRentPeriod =
    rentPeriodLabels[(property as any).primary_rent_period ?? "mois"] ?? "mois";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la recherche
            </Button>

            {user && (
              <Button
                variant="default"
                onClick={() => navigate("/tenant-dashboard")}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Mon espace
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div
                  className="relative h-[320px] md:h-[400px] rounded-xl overflow-hidden shadow-medium cursor-pointer group"
                  onClick={() => openGallery(0)}
                >
                  <img
                    src={coverPhoto}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge
                    className={`absolute top-4 right-4 ${property.display_status === "available"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-muted hover:bg-muted"
                      }`}
                  >
                    {property.display_status === "available" ? "Disponible" : "Non disponible"}
                  </Badge>
                  {allPhotos.length > 1 && (
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
                      Voir toutes les photos ({allPhotos.length})
                    </div>
                  )}
                </div>

                {galleryPhotos.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {galleryPhotos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => openGallery(index + 1)}
                        className="min-w-[140px] md:min-w-[180px] h-24 rounded-lg overflow-hidden border hover:border-primary transition-colors cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl mb-2">{property.name}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <span>{property.address}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold text-primary">
                      {property.rent_amount && property.rent_amount > 0
                        ? formatCurrency(property.rent_amount)
                        : "Prix sur demande"}
                    </span>
                    {property.rent_amount && property.rent_amount > 0 && (
                      <span className="text-muted-foreground text-lg">/{propertyRentPeriod}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-semibold capitalize">{property.property_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Square className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Unités totales</p>
                        <p className="font-semibold">
                          {totalUnits} unité{totalUnits > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Disponibles</p>
                        <p className="font-semibold">
                          {availableUnits > 0 ? `${availableUnits} unité${availableUnits > 1 ? "s" : ""}` : "À confirmer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Publication</p>
                        <p className="font-semibold">
                          {property.published_at
                            ? new Date(property.published_at).toLocaleDateString("fr-FR")
                            : "Non publié"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {aggregatedBedrooms > 0 && (
                    <div className="flex items-center gap-2 bg-secondary/30 border rounded-lg p-3">
                      <BedDouble className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Capacité</p>
                        <p className="font-semibold">{aggregatedBedrooms} chambre{aggregatedBedrooms > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  )}

                  {property.description && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {hasUnitsDetails ? (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Unités disponibles</h3>
                      <div className="space-y-3">
                        {property.property_units.map((unit: any) => (
                          <div
                            key={unit.id}
                            className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          >
                            <div>
                              <p className="font-semibold capitalize">
                                {unit.unit_type} — {unit.unit_number}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {unit.description || "Aucune description fournie."}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                                {unit.area_sqm && (
                                  <span>{unit.area_sqm} m²</span>
                                )}
                                {typeof unit.bedrooms === "number" && unit.bedrooms > 0 && (
                                  <span>{unit.bedrooms} chambre{unit.bedrooms > 1 ? "s" : ""}</span>
                                )}
                                {typeof unit.bathrooms === "number" && unit.bathrooms > 0 && (
                                  <span>{unit.bathrooms} salle{unit.bathrooms > 1 ? "s" : ""} de bain</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(unit.monthly_rent || 0)}{" "}
                                <span className="text-sm text-muted-foreground">
                                  /{rentPeriodLabels[unit.rent_period as string] ?? unit.rent_period ?? "mois"}
                                </span>
                              </p>
                              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                                Paiement {rentPeriodLabels[unit.rent_period as string] ?? unit.rent_period ?? "mois"}
                              </Badge>
                              <Badge
                                variant={unit.is_available ? "default" : "secondary"}
                                className={`mt-2 ${unit.is_available ? "bg-green-500" : ""}`}
                              >
                                {unit.is_available ? "Disponible" : "Occupée"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/40">
                      <p className="font-medium">Informations complémentaires</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Les détails des unités seront fournis par le propriétaire lors de la prise de contact.
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Équipements</h3>
                    {equipmentList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {equipmentList.map((equipment) => (
                          <Badge key={equipment} variant="secondary" className="px-3 py-1 text-sm">
                            {equipment}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Le propriétaire n'a pas encore renseigné les équipements pour ce bien.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="shadow-soft sticky top-24">
                <CardHeader>
                  <CardTitle>Intéressé par ce bien ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.display_status === "available" ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Envoyez votre candidature au propriétaire. Il vous répondra par message.
                      </p>
                      <Button
                        onClick={handleApply}
                        className={`w-full ${hasApplied ? "bg-muted text-muted-foreground cursor-not-allowed" : "gradient-accent text-white"}`}
                        size="lg"
                        disabled={hasApplied}
                      >
                        {hasApplied ? "Candidature envoyée" : "Candidater"}
                      </Button>
                      {hasApplied && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Vous avez déjà candidaté à ce bien.</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Non disponible</p>
                        <p className="text-sm text-muted-foreground">
                          Ce bien n'est actuellement pas disponible à la location.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Propriétaire</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Nom: </span>
                        <span className="font-medium">{ownerCompanyName}</span>
                      </p>
                      {ownerContactPhone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <a
                            href={`tel:${ownerContactPhone}`}
                            className="hover:text-primary transition-colors"
                          >
                            {ownerContactPhone}
                          </a>
                        </p>
                      )}
                      {ownerContactEmail && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <a
                            href={`mailto:${ownerContactEmail}`}
                            className="hover:text-primary transition-colors"
                          >
                            {ownerContactEmail}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Biens similaires</h2>
              <Button variant="ghost" onClick={() => navigate("/search")} className="text-primary hover:text-primary">
                Voir tous les biens
              </Button>
            </div>

            {suggestionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-72 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : suggestedProperties.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun autre bien similaire n'est disponible pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedProperties.map((suggestion) => {
                  const ownerProfile = (suggestion as any).owner_profiles
                    ? Array.isArray((suggestion as any).owner_profiles)
                      ? (suggestion as any).owner_profiles[0]
                      : (suggestion as any).owner_profiles
                    : null;
                  const ownerPhone = ownerProfile?.contact_phone || ownerProfile?.phone;

                  return (
                    <PropertyCard
                      key={suggestion.id}
                      id={suggestion.id}
                      image={suggestion.cover_photo || suggestion.photo_url || propertyFallback}
                      title={suggestion.name}
                      location={suggestion.address}
                      price={suggestion.rent_amount || 0}
                      type={suggestion.property_type}
                      status={suggestion.display_status}
                      bedrooms={suggestion.aggregated_bedrooms || undefined}
                      rentPeriod={suggestion.primary_rent_period}
                      ownerPhone={ownerPhone}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Auth Required Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connexion requise</DialogTitle>
            <DialogDescription>
              Vous devez créer un compte locataire pour pouvoir candidater à ce bien.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAuthDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="gradient-accent text-white"
            >
              Créer un compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer votre candidature</DialogTitle>
            <DialogDescription>
              Le message suivant sera envoyé au propriétaire :
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-line">
              Bonjour,{"\n\n"}
              Je suis candidat(e) pour le bien "{property.name}" situé à {property.address}.{"\n\n"}
              Merci de me répondre.{"\n\n"}
              Cordialement.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={sendApplication}
              className="gradient-accent text-white"
            >
              Envoyer ma candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Galerie d'images modale */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0 bg-black/95">
          {allPhotos.length > 0 && selectedImageIndex < allPhotos.length && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Bouton fermer */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setGalleryOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation gauche */}
              {allPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={previousImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Image principale */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={allPhotos[selectedImageIndex]}
                  alt={`Photo ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Navigation droite */}
              {allPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Compteur d'images */}
              {allPhotos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {selectedImageIndex + 1} / {allPhotos.length}
                </div>
              )}

              {/* Miniatures en bas (optionnel) */}
              {allPhotos.length > 1 && allPhotos.length <= 10 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 px-4">
                  {allPhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${index === selectedImageIndex
                        ? "border-white scale-110"
                        : "border-white/30 hover:border-white/60"
                        }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;

