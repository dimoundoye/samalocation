import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getPublicOwnerProfile, sendMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  Link as LinkIcon,
  Send
} from "lucide-react";
import { formatImageUrl } from "@/lib/property";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const OwnerPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile(id);
    }
  }, [id]);

  const loadProfile = async (ownerId: string) => {
    try {
      setLoading(true);
      const result = await getPublicOwnerProfile(ownerId);
      if (result) {
        setData(result);
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Impossible de charger le profil de l'agence",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    setShowMessageDialog(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !id) return;
    
    try {
      setIsSending(true);
      await sendMessage({
        receiver_id: id,
        message: message.trim(),
      });
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été transmis à l'agence.",
      });
      
      setMessage("");
      setShowMessageDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = (platform?: 'whatsapp' | 'facebook' | 'copy') => {
    const shareUrl = window.location.href;
    const agencyName = profile.company_name || profile.full_name;
    const shareTitle = `Agence ${agencyName} | SamaLocation`;
    const shareText = `Découvrez le catalogue immobilier de ${agencyName} sur SamaLocation.`;

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
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
      default:
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Lien copié",
          description: "Le lien vers le profil de l'agence a été copié.",
        });
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Profil non trouvé</h1>
          <Button asChild>
            <Link to="/search">Retour à la recherche</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { profile, properties } = data;
  const horaires = typeof profile.horaires === 'string' ? JSON.parse(profile.horaires) : profile.horaires;
  const prestations = typeof profile.prestations === 'string' ? JSON.parse(profile.prestations) : profile.prestations;
  const socialLinks = typeof profile.social_links === 'string' ? JSON.parse(profile.social_links) : profile.social_links;

  const days = [
    { key: 'mon', label: 'Lundi' },
    { key: 'tue', label: 'Mardi' },
    { key: 'wed', label: 'Mercredi' },
    { key: 'thu', label: 'Jeudi' },
    { key: 'fri', label: 'Vendredi' },
    { key: 'sat', label: 'Samedi' },
    { key: 'sun', label: 'Dimanche' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <SEO 
        title={`Agence ${profile.company_name || profile.full_name}`}
        description={`Découvrez le catalogue immobilier de ${profile.company_name || profile.full_name} sur Samalocation. ${profile.bio?.substring(0, 150) || "Agence immobilière partenaire au Sénégal."}`}
        image={profile.logo_url}
        type="profile"
      />
      <Navbar />
      
      {/* Back Button */}
      <div className="absolute top-24 left-4 md:left-12 z-20 pointer-events-none sticky">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="pointer-events-auto bg-white/20 backdrop-blur-md text-white hover:bg-white/40 border border-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 p-0 shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Retour"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>

      {/* Hero Banner Section */}
      <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
        {profile.banner_url ? (
          <img 
            src={formatImageUrl(profile.banner_url) || ""} 
            alt="Agency Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary opacity-90">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Building2 className="w-64 h-64 text-white" />
             </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 text-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-white p-2 shadow-2xl border-4 border-white/20 backdrop-blur-sm overflow-hidden flex items-center justify-center translate-y-4 md:translate-y-8">
                {profile.logo_url ? (
                  <img src={formatImageUrl(profile.logo_url) || ""} alt={profile.company_name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <Building2 className="w-16 h-16 text-primary" />
                )}
              </div>
              {profile.verification_status === 'verified' && (
                <div className="absolute top-2 -right-2 md:-top-2 md:-right-2 bg-green-500 rounded-full p-1 border-2 border-white translate-y-4 md:translate-y-8 z-10">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
                  {profile.company_name || profile.full_name}
                </h1>
                {profile.verification_status === 'verified' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 backdrop-blur-md hidden md:flex">
                    Agence Vérifiée
                  </Badge>
                )}
              </div>
              <p className="text-white/90 flex items-center justify-center md:justify-start gap-2 text-lg font-medium">
                <MapPin className="w-5 h-5 text-primary-light shrink-0" />
                {profile.address || "Sénégal"}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
              <Button 
                onClick={handleContact}
                className="gradient-primary text-white border-0 shadow-xl hover:shadow-primary/25 px-8 h-12 text-lg font-bold"
              >
                <MessageSquare className="w-5 h-5 mr-2" /> Contacter
              </Button>
              {profile.website && (
                <Button variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 h-12" asChild>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-5 h-5 mr-2" /> Site Web
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 h-12"
                onClick={() => handleShare()}
              >
                <Share2 className="w-5 h-5 mr-2" /> Partager
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <Card className="border-none shadow-sm overflow-hidden">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-primary" /> À propos de l'agence
                  </h2>
                  <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed">
                    {profile.bio || "Cette agence n'a pas encore ajouté de description."}
                  </div>
                  
                  {prestations && prestations.length > 0 && (
                    <div className="mt-10">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" /> Nos prestations & services
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {prestations.map((item: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="px-4 py-2 text-sm bg-primary/5 text-primary border-primary/10">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </Card>

            {/* Properties Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-primary" /> Nos annonces ({properties.length})
                </h2>
                <Link to="/search" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                  Voir tout <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              {properties.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-transparent">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune annonce publiée pour le moment.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((prop: any) => (
                    <Link key={prop.id} to={`/property/${prop.id}`}>
                      <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-none">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img 
                            src={prop.photo_url || (Array.isArray(prop.photos) && prop.photos[0]) || ""} 
                            alt={prop.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-white/90 text-black border-none backdrop-blur-md font-bold">
                              {prop.property_type === 'house' ? 'Maison' : prop.property_type === 'apartment' ? 'Appartement' : 'Commerce'}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{prop.name}</h3>
                          <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" /> {prop.address}
                          </p>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                             <p className="text-primary font-bold text-xl">
                                {prop.property_units?.[0]?.monthly_rent.toLocaleString()} FCFA <span className="text-xs font-normal text-muted-foreground">/ mois</span>
                             </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            
            {/* Contact Card */}
            <Card className="border-none shadow-sm overflow-hidden sticky top-24">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Contact & Informations</h3>
                
                <div className="space-y-6">
                  {profile.phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Téléphone</p>
                        <p className="text-base font-semibold">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {(profile.external_email || profile.email) && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">E-mail</p>
                        <a 
                          href={`mailto:${profile.external_email || profile.email}`}
                          className="text-base font-semibold truncate max-w-[200px] text-primary hover:underline"
                        >
                          {profile.external_email || profile.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Social Media Links */}
                  <div className="pt-6 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-4 text-center">Réseaux Sociaux</p>
                    <div className="flex justify-center gap-4">
                      {socialLinks?.facebook && (
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-[#1877F2] hover:text-white transition-all">
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {socialLinks?.instagram && (
                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-[#E4405F] hover:text-white transition-all">
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {socialLinks?.linkedin && (
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-[#0A66C2] hover:text-white transition-all">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Opening Hours */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-primary" />
                      <h4 className="font-bold">Horaires d'ouverture</h4>
                    </div>
                    
                    <div className="space-y-2">
                       {days.map((day) => {
                         const schedule = horaires?.[day.key] || { closed: true };
                         return (
                           <div key={day.key} className="flex items-center justify-between text-sm py-1">
                             <span className="text-muted-foreground font-medium">{day.label}</span>
                             <span className={schedule.closed ? 'text-red-500 font-medium' : 'font-semibold'}>
                               {schedule.closed ? 'Fermé' : `${schedule.open} - ${schedule.close}`}
                             </span>
                           </div>
                         )
                       })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Connexion requise</DialogTitle>
            <DialogDescription className="text-lg pt-2 leading-relaxed">
              Vous devez être connecté pour contacter cette agence. Créer un compte ne prend que quelques secondes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} className="h-12 flex-1 rounded-xl">
              Annuler
            </Button>
            <Button onClick={() => navigate("/auth?mode=signup")} className="gradient-primary text-white h-12 flex-1 rounded-xl font-bold">
              Créer un compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog (Chatbot-style) */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="gradient-primary p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                {profile.logo_url ? (
                  <img src={formatImageUrl(profile.logo_url) || ""} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-none mb-1">Contacter {profile.company_name || profile.full_name}</h3>
                <p className="text-white/70 text-xs">L'agence vous répondra sous peu.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Écrivez votre message
              </p>
              <Textarea 
                placeholder="Ex: Bonjour, je souhaiterais avoir plus d'informations sur vos annonces..."
                className="min-h-[150px] resize-none border-neutral-100 bg-neutral-50/50 focus-visible:ring-primary focus-visible:bg-white transition-all rounded-xl"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <DialogFooter className="pt-2">
               <Button variant="ghost" onClick={() => setShowMessageDialog(false)} className="rounded-xl flex-1 h-12">
                Annuler
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isSending}
                className="gradient-primary text-white rounded-xl flex-[2] h-12 font-bold shadow-lg shadow-primary/20"
              >
                {isSending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OwnerPublicProfile;
