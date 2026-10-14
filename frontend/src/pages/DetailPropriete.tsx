import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, BedDouble, Home, Bath, Square, Calendar, Shield, AlertCircle, Phone, Mail, CheckCircle, ChevronLeft, ChevronRight, X, Building2, Layers, Share2, Facebook, Link as LinkIcon, Send, Loader2, ZoomIn, ZoomOut, RotateCcw, Eye, Flag } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { transformProperty, FormattedProperty, formatImageUrl } from "@/lib/property";
import propertyFallback from "@/assets/property-1.jpg";
import PropertyCard from "@/components/PropertyCard";
import { getPropertyById, getProperties, sendMessage, createNotification, getMessages, getSimilarProperties } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { isRecent } from "@/lib/dateUtils";
import PropertyDetailSkeleton from "@/components/PropertyDetailSkeleton";
import { getMyDossier, shareDossier } from "@/api/dossier";
import { formatCurrency } from "@/lib/utils";
import Footer from "@/components/Footer";
import { ReportPropertyDialog } from "@/components/ReportPropertyDialog";

const renderDescription = (text: string) => {
  if (!text) return null;
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(markdownLinkRegex);
  while ((match = regex.exec(text)) !== null) {
    const index = match.index;
    const linkText = match[1];
    const linkUrl = match[2];
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    parts.push(
      <a 
        key={index} 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary hover:underline font-medium break-all"
      >
        {linkText}
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return <>{parts}</>;
};

const DetailPropriete = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [suggestedProperties, setSuggestedProperties] = useState<FormattedProperty[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [hasDossier, setHasDossier] = useState(false);
  const [sharingDossier, setSharingDossier] = useState(false);

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

      if (user) {
        const dossier = await getMyDossier();
        setHasDossier(!!dossier);
      }

      setProperty(transformProperty(propertyData));
    } catch (error) {
      console.error("Error loading property:", error);
      toast({
        title: t('detail.load_error_title'),
        description: t('detail.load_error_desc'),
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

  // Message envoyé au propriétaire (et affiché dans la confirmation), selon location ou vente
  const buildApplicationMessage = (p: { name: string; address: string; listing_type?: string }) =>
    t(p.listing_type === 'vente' ? 'detail.message_sale' : 'detail.message_rent', { name: p.name, address: p.address });

  const sendApplication = async () => {
    try {
      if (!user || !property) {
        console.error("Missing user or property data:", { user, property });
        toast({
          title: t('common.error'),
          description: t('detail.missing_data'),
          variant: "destructive",
        });
        return;
      }

      if (!property.owner_id) {
        console.error("Property has no owner_id:", property);
        toast({
          title: t('common.error'),
          description: t('detail.no_owner'),
          variant: "destructive",
        });
        return;
      }

      console.log("Sending application:", {
        sender_id: user.id,
        receiver_id: property.owner_id,
        property_id: property.id,
      });

      // Même texte que celui affiché dans la confirmation, selon location ou vente
      const messageText = buildApplicationMessage(property);

      await sendMessage({
        receiver_id: property.owner_id,
        message: messageText,
        property_id: property.id,
      });

      setHasApplied(true);

      toast({
        title: t('detail.sent_title'),
        description: t('detail.sent_desc'),
      });

      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        title: t('detail.send_error_title'),
        description: error.message || t('detail.send_error_desc'),
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

        const data = await getSimilarProperties(property.id);
        const formatted = data.map((item: any) => transformProperty(item));
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

  // Préparer toutes les photos pour la galerie sans doublons
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (property?.cover_photo) list.push(property.cover_photo);
    if (property?.photo_url) {
      const formatted = formatImageUrl(property.photo_url);
      if (formatted) list.push(formatted);
    }
    if (Array.isArray(property?.photos)) {
      property.photos.forEach((p: string) => {
        if (!p) return;
        const formatted = formatImageUrl(p);
        if (formatted) list.push(formatted);
      });
    }

    const unique = Array.from(new Set(list.filter(Boolean)));
    if (unique.length === 0) {
      return propertyFallback ? [propertyFallback] : [];
    }
    return unique;
  }, [property?.cover_photo, property?.photo_url, property?.photos]);

  // Navigation au clavier et raccourcis pour la galerie
  useEffect(() => {
    if (!galleryOpen || allPhotos.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedImageIndex((prev) => (prev + 1) % allPhotos.length);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
        setZoomLevel(1);
      } else if (e.key === "Escape") {
        setGalleryOpen(false);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(Math.round((prev + 0.25) * 100) / 100, 3));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(Math.round((prev - 0.25) * 100) / 100, 0.75));
      } else if (e.key === "0" || e.key === "r") {
        e.preventDefault();
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, allPhotos.length]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('detail.not_found')}</h1>
          <Button onClick={() => navigate("/search")}>
            {t('detail.back_to_search')}
          </Button>
        </div>
      </div>
    );
  }

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setZoomLevel(1);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    if (allPhotos.length === 0) return;
    setSelectedImageIndex((prev) => (prev + 1) % allPhotos.length);
    setZoomLevel(1);
  };

  const previousImage = () => {
    if (allPhotos.length === 0) return;
    setSelectedImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    setZoomLevel(1);
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(Math.round((prev + 0.25) * 100) / 100, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(Math.round((prev - 0.25) * 100) / 100, 0.75));
  const resetZoom = () => setZoomLevel(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || allPhotos.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        previousImage();
      }
    }
    setTouchStartX(null);
  };

  const handleShare = (platform?: 'whatsapp' | 'facebook' | 'copy') => {
    const shareUrl = window.location.href;
    const shareTitle = `${property.name} | SamaLocation`;
    
    const displayPrice = property.listing_type === 'vente' 
      ? (property.sale_price ? formatCurrency(property.sale_price) : t('property.on_request'))
      : (property.rent_amount ? `${formatCurrency(property.rent_amount)}/${propertyRentPeriod}` : t('property.on_request'));

    const shareText = `Découvrez ce bien sur SamaLocation : ${property.name} à ${property.address}. ${displayPrice}`;

    if (!platform && navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).catch((error) => console.log('Error sharing', error));
      return;
    }

    switch (platform) {
      case 'whatsapp':
        if (navigator.share) {
          navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          }).catch(() => {
            // Fallback to WhatsApp if share fails
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
          });
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        }
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
      default:
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('detail.link_copied_title'),
          description: t('detail.link_copied_desc'),
        });
        break;
    }
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

  const ownerCompanyName = ownerProfile?.company_name || t('detail.not_provided');
  const ownerContactPhone = ownerProfile?.contact_phone || ownerProfile?.phone || null;
  const ownerContactEmail = ownerProfile?.external_email || ownerProfile?.email || null;
  const isBotOwner = ownerProfile?.registration_email === 'import@samalocation.com' || ownerProfile?.email === 'import@samalocation.com';
  const rentPeriodLabels: Record<string, string> = {
    jour: t('period.jour'),
    semaine: t('period.semaine'),
    mois: t('period.mois'),
  };
  const propertyRentPeriod =
    rentPeriodLabels[(property as any).primary_rent_period ?? "mois"] ?? t('period.mois');

  // Caractéristiques affichées (une valeur vide ou nulle n'est pas montrée)
  const PROPERTY_TYPE_KEYS: Record<string, string> = {
    maison: 'house', villa: 'villa', immeuble: 'building', appartement: 'apartment', studio: 'studio',
    chambre: 'room', garage: 'garage', locale: 'office', terrain: 'land',
  };
  const typeKey = PROPERTY_TYPE_KEYS[String(property.property_type || '').toLowerCase()];
  const propertyTypeLabel = typeKey
    ? t(`search.types.${typeKey}`)
    : (property.property_type ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1) : null);
  const firstUnit = property.property_units?.[0];
  const positive = (value: unknown) => (Number(value) > 0 ? Number(value) : null);
  const areaValue = positive(property.aggregated_area) ?? positive(firstUnit?.area_sqm);
  const roomsValue = positive(property.aggregated_rooms_count) ?? positive(firstUnit?.rooms_count);
  const bedroomsValue = positive(aggregatedBedrooms) ?? positive(firstUnit?.bedrooms);
  const bathroomsValue = positive(property.aggregated_bathrooms) ?? positive(firstUnit?.bathrooms);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('detail.seo_title', { name: property.name, address: property.address })}
        description={t(property.listing_type === 'vente' ? 'detail.seo_desc_sale' : 'detail.seo_desc_rent', {
          type: property.property_type,
          address: property.address,
          area: property.aggregated_area || property.property_units?.[0]?.area_sqm || "",
          bedrooms: property.aggregated_bedrooms || property.property_units?.[0]?.bedrooms || "",
          excerpt: property.description?.substring(0, 100) || "",
        })}
        image={property.cover_photo || property.photo_url}
        type="article"
      />
      <Navbar />

      <div className="pt-24 pb-28 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back_to_search')}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden shadow-medium bg-secondary/20 group">
                  <Carousel className="w-full" opts={{ loop: true }}>
                    <CarouselContent>
                      {allPhotos.map((photo, index) => (
                        <CarouselItem key={index} className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => openGallery(index)}>
                          <img
                            src={photo}
                            alt={t('detail.photo_alt', { name: property.name, index: index + 1 })}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {allPhotos.length > 1 && (
                      <>
                        <CarouselPrevious
                          className="left-3 md:left-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/30 backdrop-blur-md shadow-xl transition-all hover:scale-110 z-20 flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5 md:[&_svg]:h-6 md:[&_svg]:w-6 cursor-pointer"
                        />
                        <CarouselNext
                          className="right-3 md:right-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/30 backdrop-blur-md shadow-xl transition-all hover:scale-110 z-20 flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5 md:[&_svg]:h-6 md:[&_svg]:w-6 cursor-pointer"
                        />
                      </>
                    )}

                    {/* Bouton pour ouvrir la galerie plein écran */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGallery(0);
                      }}
                      className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 hover:bg-black/85 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md hover:scale-105 z-10 border border-white/20"
                      title={t('detail.enlarge_title')}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{allPhotos.length > 1 ? t('detail.see_all_photos', { count: allPhotos.length }) : t('detail.enlarge')}</span>
                    </button>
                  </Carousel>
                </div>

                {allPhotos.length > 1 && (
                  <div className="hidden md:flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {allPhotos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => openGallery(index)}
                        className="w-24 h-16 md:w-32 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer opacity-70 hover:opacity-100"
                      >
                        <img
                          src={photo}
                          alt={t('detail.thumbnail_alt', { index: index + 1 })}
                          className="w-full h-full object-cover"
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
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <CardTitle className="text-xl md:text-3xl mb-0">{property.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {property.listing_type === 'vente' ? (
                            <Badge className="bg-primary text-white border-none text-[10px] sm:text-xs px-2.5 py-0.5 shadow-sm font-black uppercase tracking-wider">
                              {t('property.for_sale')}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white border-none text-[10px] sm:text-xs px-2.5 py-0.5 shadow-sm font-black uppercase tracking-wider">
                              {t('property.for_rent')}
                            </Badge>
                          )}
                          {isRecent(property.published_at) && (
                            <Badge className="bg-orange-500 text-white border-none text-[10px] sm:text-xs px-2.5 py-0.5 shadow-sm animate-pulse uppercase font-black tracking-wider">
                              {t('property.new')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <span>{property.address}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div>
                      <span className="text-2xl md:text-4xl font-bold text-primary">
                        {property.listing_type === 'vente'
                          ? (property.sale_price ? formatCurrency(property.sale_price, property.currency) : t('property.on_request'))
                          : (property.rent_amount && property.rent_amount > 0
                            ? formatCurrency(property.rent_amount, property.currency)
                            : t('property.on_request'))}
                      </span>
                      {property.listing_type === 'location' && property.rent_amount && property.rent_amount > 0 && (
                        <span className="text-muted-foreground text-lg">/{propertyRentPeriod}</span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 font-semibold ${availableUnits > 0 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border bg-secondary text-muted-foreground"}`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {availableUnits > 0 ? t('property.available') : t('property.occupied')}
                    </Badge>
                  </div>

                  {/* Caractéristiques : étiquettes sur une ou deux lignes ; celles sans valeur sont masquées */}
                  <ul className="flex flex-wrap gap-2" aria-label={t('property.specs.title')}>
                    {[
                      { icon: Home, label: t('common.type'), text: propertyTypeLabel },
                      { icon: Square, label: t('common.area'), text: areaValue ? t('property.specs.area', { value: areaValue }) : null },
                      { icon: Layers, label: t('property.rooms'), text: roomsValue ? t('property.specs.rooms', { count: roomsValue }) : null },
                      { icon: BedDouble, label: t('common.bedrooms'), text: bedroomsValue ? t('property.specs.bedrooms', { count: bedroomsValue }) : null },
                      { icon: Bath, label: t('common.bathrooms'), text: bathroomsValue ? t('property.specs.bathrooms', { count: bathroomsValue }) : null },
                    ].filter(item => item.text).map(item => (
                      <li
                        key={item.label}
                        title={item.label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-sm font-medium"
                      >
                        <item.icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                        {item.text}
                      </li>
                    ))}
                  </ul>


                  {property.description && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-3">{t('detail.description')}</h3>
                      <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {renderDescription(property.description)}
                      </div>
                    </div>
                  )}


                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3">{t('detail.equipments')}</h3>
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
                        {t('detail.no_equipments')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="shadow-soft sticky top-24">
                {!isBotOwner && (
                  <CardHeader>
                    <CardTitle>{t('detail.interested')}</CardTitle>
                  </CardHeader>
                )}
                <CardContent className="space-y-4 pt-6">
                  {!isBotOwner && (
                    <>
                      {property.display_status === "available" ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {property.listing_type === 'vente'
                              ? t('detail.sale_intro')
                              : t('detail.rent_intro')}
                          </p>
                          <Button
                            onClick={handleApply}
                            className={`w-full ${hasApplied ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent hover:bg-accent/90 text-white"}`}
                            size="lg"
                            disabled={hasApplied}
                          >
                            {hasApplied 
                              ? (property.listing_type === 'vente' ? t('detail.request_sent') : t('detail.application_sent')) 
                              : (property.listing_type === 'vente' ? t('detail.contact_seller') : t('detail.request_rent'))}
                          </Button>
                          {hasApplied && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{t('detail.already_sent')}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">{t('detail.unavailable')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('detail.unavailable_desc')}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isBotOwner && (
                    <div className="text-sm text-muted-foreground bg-primary/5 p-4 rounded-xl border border-primary/10">
                      {t('detail.imported_contact')}
                    </div>
                  )}

                  <div className={!isBotOwner ? "pt-4 border-t" : ""}>
                    <h4 className="font-semibold mb-3">{t('detail.owner')}</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                          {ownerProfile?.logo_url ? (
                            <img
                              src={formatImageUrl(ownerProfile.logo_url) || ""}
                              alt={ownerCompanyName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <Link
                            to={`/proprio/${ownerProfile?.id || property.owner_id}`}
                            className="font-bold text-base hover:text-primary transition-colors flex items-center gap-1 group"
                          >
                            {ownerCompanyName}
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                          </Link>
                          {(ownerProfile?.is_verified || ownerProfile?.verification_status === 'verified') && (
                            <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase">
                              <Shield className="h-3 w-3" />
                              {t('detail.verified_agency')}
                            </div>
                          )}
                        </div>
                      </div>
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

                  <div className="pt-6 border-t mt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      {t('detail.share_title')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-auto py-3 gap-1 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all"
                        onClick={() => handleShare('whatsapp')}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-[10px]">{t('common.share')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-auto py-3 gap-1 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        onClick={() => handleShare('facebook')}
                      >
                        <Facebook className="h-4 w-4" />
                        <span className="text-[10px]">Facebook</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-auto py-3 gap-1 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
                        onClick={() => handleShare('copy')}
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span className="text-[10px]">{t('detail.link')}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Signaler l'annonce (sauf pour son propriétaire) */}
                  {(!user || String(user.id) !== String(property.owner_id)) && (
                    <div className="pt-4 mt-4 border-t flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        onClick={() => setReportOpen(true)}
                      >
                        <Flag className="h-4 w-4" />
                        {t('report_property.button')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">{t('detail.similar')}</h2>
              <Button variant="ghost" onClick={() => navigate("/search")} className="text-primary hover:text-primary">
                {t('detail.see_all')}
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
                {t('detail.no_similar')}
              </p>
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
                  {suggestedProperties.map((suggestion) => {
                    const ownerProfile = (suggestion as any).owner_profiles
                      ? Array.isArray((suggestion as any).owner_profiles)
                        ? (suggestion as any).owner_profiles[0]
                        : (suggestion as any).owner_profiles
                      : null;
                    const ownerPhone = ownerProfile?.contact_phone || ownerProfile?.phone;

                    return (
                      <CarouselItem key={suggestion.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                        <PropertyCard
                          id={suggestion.id}
                          image={suggestion.cover_photo || suggestion.photo_url || propertyFallback}
                          title={suggestion.name}
                          location={suggestion.address}
                          price={suggestion.rent_amount || 0}
                          type={suggestion.property_type}
                          status={suggestion.display_status}
                          bedrooms={suggestion.aggregated_bedrooms || undefined}
                          area={suggestion.aggregated_area || undefined}
                          bathrooms={suggestion.aggregated_bathrooms || undefined}
                          rentPeriod={suggestion.primary_rent_period}
                          ownerPhone={ownerPhone}
                          isVerifiedOwner={ownerProfile?.is_verified || ownerProfile?.verification_status === 'verified'}
                          ownerLogo={ownerProfile?.logo_url}
                          isNew={isRecent(suggestion.published_at || suggestion.created_at)}
                          listingType={suggestion.listing_type as any}
                          salePrice={suggestion.sale_price}
                        />
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-1 sm:left-2 md:-left-12 h-9 w-9 sm:h-10 sm:w-10 bg-white/95 dark:bg-card/95 shadow-strong border border-primary/15 text-primary hover:bg-primary hover:text-white transition-all z-30 opacity-100 flex items-center justify-center p-0" />
                <CarouselNext className="right-1 sm:right-2 md:-right-12 h-9 w-9 sm:h-10 sm:w-10 bg-white/95 dark:bg-card/95 shadow-strong border border-primary/15 text-primary hover:bg-primary hover:text-white transition-all z-30 opacity-100 flex items-center justify-center p-0" />
              </Carousel>
            )}
          </section>
        </div>
      </div>
      <Footer />

      <ReportPropertyDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        propertyId={String(property.id)}
        propertyName={property.name}
      />

      {/* Auth Required Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.login_required')}</DialogTitle>
            <DialogDescription>
              {property.listing_type === 'vente' 
                ? t('detail.login_required_sale')
                : t('detail.login_required_rent')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAuthDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {t('detail.create_account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {property.listing_type === 'vente' ? t('detail.confirm_request') : t('detail.confirm_application')}
            </DialogTitle>
            <DialogDescription>
              {property.listing_type === 'vente' ? t('detail.message_to_seller') : t('detail.message_to_owner')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-line">
              {buildApplicationMessage(property)}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={sendApplication}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {property.listing_type === 'vente' ? t('detail.send_request') : t('detail.send_application')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Galerie d'images modale */}
      <Dialog open={galleryOpen} onOpenChange={(open) => {
        setGalleryOpen(open);
        if (!open) setZoomLevel(1);
      }}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] p-0 gap-0 bg-neutral-950/98 border border-white/10 shadow-2xl rounded-2xl overflow-hidden !flex !flex-col text-white select-none [&>button:last-child]:hidden">
          {allPhotos.length > 0 && selectedImageIndex < allPhotos.length && (
            <div className="flex flex-col h-full w-full overflow-hidden">
              {/* Barre supérieure d'actions */}
              <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate max-w-[180px] sm:max-w-md">
                    {property.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90 shrink-0">
                    {allPhotos.length > 1 ? `${selectedImageIndex + 1} / ${allPhotos.length}` : t('detail.one_photo')}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Zoom out */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={zoomLevel <= 0.75}
                    onClick={zoomOut}
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30"
                    title={t('detail.zoom_out')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>

                  {/* Zoom reset */}
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="px-2 py-1 text-xs font-mono rounded bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
                    title={t('detail.zoom_reset')}
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  {/* Zoom in */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={zoomLevel >= 3}
                    onClick={zoomIn}
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30"
                    title={t('detail.zoom_in')}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>

                  <div className="h-4 w-px bg-white/20 mx-1" />

                  {/* Bouton fermer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setGalleryOpen(false)}
                    className="h-9 w-9 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
                    title={t('detail.close_esc')}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Scène principale de visualisation */}
              <div
                className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 min-w-0 bg-black/60 p-2 sm:p-6"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Navigation gauche */}
                {allPhotos.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      previousImage();
                    }}
                    className="absolute left-3 sm:left-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    aria-label={t('detail.previous_photo')}
                    title={t('detail.previous_photo_key')}
                  >
                    <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                  </button>
                )}

                {/* Conteneur image */}
                <div className="w-full h-full flex items-center justify-center overflow-auto min-h-0 min-w-0 p-2">
                  <img
                    src={allPhotos[selectedImageIndex]}
                    alt={t('detail.photo_alt', { name: property.name, index: selectedImageIndex + 1 })}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center center",
                    }}
                    className={`max-w-[85vw] max-h-[66vh] sm:max-h-[70vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 select-none ${
                      zoomLevel > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
                    }`}
                    onClick={() => setZoomLevel((prev) => (prev > 1 ? 1 : 1.75))}
                    title={zoomLevel > 1 ? t('detail.click_zoom_out') : t('detail.click_zoom_in')}
                  />
                </div>

                {/* Navigation droite */}
                {allPhotos.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 sm:right-6 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition-all hover:scale-110 shadow-2xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    aria-label={t('detail.next_photo')}
                    title={t('detail.next_photo_key')}
                  >
                    <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                  </button>
                )}
              </div>

              {/* Miniatures en bas */}
              {allPhotos.length > 1 && (
                <div className="h-20 sm:h-24 px-4 flex items-center justify-center border-t border-white/10 bg-black/50 backdrop-blur-md shrink-0 z-30">
                  <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-2 max-w-full no-scrollbar">
                    {allPhotos.map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setZoomLevel(1);
                        }}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          index === selectedImageIndex
                            ? "border-primary ring-2 ring-primary scale-105 opacity-100"
                            : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                        }`}
                        aria-label={t('detail.go_to_photo', { index: index + 1 })}
                      >
                        <img
                          src={photo}
                          alt={t('detail.thumbnail_alt', { index: index + 1 })}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailPropriete;

