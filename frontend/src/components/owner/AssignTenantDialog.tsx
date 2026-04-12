import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, CheckCircle, ArrowLeft, Users, ChevronRight } from "lucide-react";
import { searchUsers, assignTenant, createNotification, createTenantAccount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Copy, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssignTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: any[];
  units: any[];
  onSuccess: () => void;
}

export const AssignTenantDialog = ({
  open,
  onOpenChange,
  properties = [],
  units = [],
  onSuccess,
}: AssignTenantDialogProps) => {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [searchMode, setSearchMode] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createAccount, setCreateAccount] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ customId: string, tempPassword: string } | null>(null);
  const [step, setStep] = useState<"choice" | "form" | "credentials">("choice");

  useEffect(() => {
    if (!open) {
      setStep("choice");
    }
  }, [open]);

  // Log pour debug
  useEffect(() => {
    if (open) {
      console.log("AssignTenantDialog opened with:", {
        properties: properties?.length || 0,
        units: units?.length || 0,
        propertiesData: properties,
        unitsData: units
      });

      // Vérifier les données
      if (!Array.isArray(properties)) {
        console.error("properties is not an array:", properties);
        setRenderError(new Error("properties doit être un tableau"));
        return;
      }
      if (!Array.isArray(units)) {
        console.error("units is not an array:", units);
        setRenderError(new Error("units doit être un tableau"));
        return;
      }
      setRenderError(null);
    }
  }, [open, properties, units]);

  const availableUnits = useMemo(() => {
    console.log('Computing availableUnits', {
      selectedPropertyId,
      totalUnits: units?.length || 0,
      units: units
    });

    if (!selectedPropertyId || !units || units.length === 0) {
      console.log('No units available - missing property or units array');
      return [];
    }

    const filtered = units.filter((unit) => {
      if (!unit) return false;

      // Check property_id match
      const propertyMatch = unit.property_id === selectedPropertyId;

      // Check availability (default to true if not specified)
      const isAvailable = unit.is_available !== false;

      return propertyMatch;
    });

    return filtered;
  }, [selectedPropertyId, units]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedPropertyId("");
      setSelectedUnitId("");
      setFullName("");
      setEmail("");
      setPhone("");
      setMonthlyRent("");
      setMoveInDate("");
      setStatus("active");
      setSubmitting(false);
      setSearchMode("new");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setCreateAccount(false);
      setTempCredentials(null);
      setStep("choice");
    }
    onOpenChange(nextOpen);
  };

  // Auto-select unit if only one exists
  useEffect(() => {
    if (availableUnits.length === 1 && selectedPropertyId && !selectedUnitId) {
      const unit = availableUnits[0];
      setSelectedUnitId(unit.id);
      if (unit.monthly_rent) {
        setMonthlyRent(String(unit.monthly_rent));
      }
    }
  }, [availableUnits, selectedPropertyId, selectedUnitId]);

  const searchUsersLocal = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search all users (we'll filter out owners/admins)
      const profiles = await searchUsers(searchQuery);
      console.log('Search results:', profiles);

      // Filter out owners and admins on frontend
      const filteredProfiles = profiles?.filter((user: any) =>
        user.role !== 'owner' && user.role !== 'admin'
      ) || [];

      setSearchResults(filteredProfiles);


      if (filteredProfiles.length === 0) {
        toast({
          title: "Aucun utilisateur trouvé",
          description: "Aucun utilisateur correspondant à votre recherche.",
        });
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast({
        title: "Erreur de recherche",
        description: error.message || "Impossible de rechercher les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone || ""); // Auto-fill phone if available
    setSearchQuery(user.full_name);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedPropertyId || !selectedUnitId) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez choisir un bien et une unité à attribuer.",
        variant: "destructive",
      });
      return;
    }

    const selectedUnit = availableUnits.find(u => u.id === selectedUnitId);
    const isActuallyOccupied = selectedUnit && (
      selectedUnit.is_available === false ||
      selectedUnit.is_available === 0 ||
      selectedUnit.is_available === "0" ||
      selectedUnit.is_available === "false"
    );

    if (isActuallyOccupied) {
      if (!confirm("⚠️ Cette unité contient déjà un locataire.\n\nEn enregistrant, vous remplacerez le locataire actuel.\nVoulez-vous vraiment continuer ?")) {
        return;
      }
    }

    if (!fullName.trim() && !createAccount) {
      toast({
        title: "Nom requis",
        description: "Veuillez renseigner le nom du locataire.",
        variant: "destructive",
      });
      return;
    }

    if (!moveInDate) {
      toast({
        title: "Date d'entrée requise",
        description: "Veuillez indiquer la date d'entrée du locataire.",
        variant: "destructive",
      });
      return;
    }

    // Pour les nouveaux locataires (sans user_id)
    // On ne demande plus l'email et le téléphone obligatoirement si on crée un compte
    // car le locataire remplira ces infos lui-même lors de sa première connexion.
    if (!selectedUser && searchMode === "existing") {
      if (!email.trim()) {
        toast({
          title: "Email requis",
          description: "Veuillez renseigner l'adresse email du locataire.",
          variant: "destructive",
        });
        return;
      }
    }

    const rentValue = parseInt(monthlyRent, 10);

    if (Number.isNaN(rentValue) || rentValue <= 0) {
      toast({
        title: "Loyer invalide",
        description: "Le loyer mensuel doit être un nombre positif.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      let userId = selectedUser?.id || null;
      let accountResult = null;

      // Create account if requested
      if (searchMode === "new" && createAccount && !userId) {
        try {
          accountResult = await createTenantAccount({
            name: fullName.trim() || "Nouveau Locataire",
            email: email.trim(),
            phone: phone.trim()
          });
          userId = accountResult.id;
        } catch (error: any) {
          toast({
            title: "Erreur de création de compte",
            description: error.message || "Impossible de créer le compte locataire.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      const tenantData: any = {
        full_name: fullName.trim() || (accountResult?.name) || "Nouveau Locataire",
        email: email.trim() || null,
        phone: phone.trim() || null,
        unit_id: selectedUnitId,
        monthly_rent: rentValue,
        move_in_date: moveInDate,
        status,
        user_id: userId,
      };

      const insertedTenant = await assignTenant(tenantData);

      if (!insertedTenant) {
        throw new Error("Erreur lors de l'affectation du locataire");
      }

      // Si on a créé des identifiants, les afficher MAINTENANT
      if (accountResult) {
        setTempCredentials({
          customId: accountResult.customId,
          tempPassword: accountResult.tempPassword
        });
        setStep("credentials");
      }

      toast({
        title: "Locataire ajouté",
        description: `${insertedTenant.full_name ?? "Le locataire"} a été associé au bien sélectionné.`,
      });

      onSuccess();
      if (!accountResult) {
        handleClose(false);
      }

      // Si le locataire a un compte utilisateur, lui envoyer une notification (non-bloquant)
      if (userId) {
        createNotification({
          user_id: userId,
          type: "tenant",
          title: "Nouveau bail",
          message: `Vous avez été affecté(e) au bien ${insertedTenant.property_name || 'un nouveau bien'}`,
          link: "/tenant-dashboard"
        }).catch(notifError => {
          console.error("Error creating tenant notification (silently caught):", notifError);
        });
      }
    } catch (error: any) {
      console.error("Error assigning tenant:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'affecter ce locataire. Vérifiez que toutes les informations sont correctes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Si erreur de rendu, afficher un message
  if (renderError) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription>
              Une erreur s'est produite lors de l'affichage du formulaire.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 text-red-900 rounded">
            <p>Erreur: {renderError.message}</p>
            <p className="text-sm mt-2">Vérifiez la console du navigateur pour plus de détails.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setRenderError(null);
              handleClose(false);
            }}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full border-none shadow-2xl p-0 overflow-hidden bg-background">
        <AnimatePresence mode="wait">
          {step === "choice" ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-8"
            >
              <div className="text-center space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight">Ajouter un locataire</DialogTitle>
                <DialogDescription className="text-base">
                  Comment souhaitez-vous procéder pour ce nouveau locataire ?
                </DialogDescription>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {
                    setSearchMode("existing");
                    setStep("form");
                  }}
                  className="group flex items-center gap-4 p-6 rounded-3xl bg-secondary/30 border-2 border-transparent hover:border-primary/20 hover:bg-secondary/50 transition-all text-left"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Locataire avec compte Samalocation</h3>
                    <p className="text-sm text-muted-foreground">Recherchez un utilisateur qui possède déjà un compte sur la plateforme.</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setSearchMode("new");
                    setCreateAccount(true);
                    setStep("form");
                  }}
                  className="group flex items-center gap-4 p-6 rounded-3xl bg-primary/5 border-2 border-transparent hover:border-primary/20 hover:bg-primary/10 transition-all text-left"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                    <UserPlus className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Créer un compte pour un locataire</h3>
                    <p className="text-sm text-muted-foreground">Inscrivez un nouveau locataire et générez ses accès de connexion.</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <Button variant="ghost" onClick={() => handleClose(false)} className="rounded-full px-8">
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 pb-2 border-b bg-muted/10">
                <button
                  onClick={() => setStep("choice")}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour au choix
                </button>
                <div className="space-y-1">
                  <DialogTitle>
                    {searchMode === "existing" ? "Rechercher un locataire" : "Nouveau compte locataire"}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour affecter le locataire à une unité.
                  </DialogDescription>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {searchMode === "existing" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rechercher par nom ou email</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: Moussa Diop..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setSelectedUser(null);
                            }}
                            className="rounded-xl h-12"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                searchUsersLocal();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => searchUsersLocal()}
                            disabled={searching || !searchQuery.trim()}
                            className="h-12 w-12 rounded-xl"
                          >
                            <Search className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {selectedUser && (
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {selectedUser.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{selectedUser.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{selectedUser.email}</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                        </div>
                      )}

                      {searchResults.length > 0 && !selectedUser && (
                        <ScrollArea className="h-40 border rounded-2xl p-2 bg-muted/5">
                          <div className="space-y-1">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full text-left p-3 hover:bg-secondary rounded-xl transition-colors flex items-center gap-3"
                              >
                                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                                  {user.full_name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-sm">{user.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">Nouveau Locataire</p>
                          <p className="text-xs text-muted-foreground">Un compte sera automatiquement généré.</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2 border-t border-primary/5">
                        <input
                          type="checkbox"
                          id="create-account"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="create-account" className="text-xs cursor-pointer text-muted-foreground">
                          Générer un identifiant et mot de passe provisoire
                        </Label>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bien Immobilier</Label>
                          <Select
                            value={selectedPropertyId}
                            onValueChange={(value) => {
                              setSelectedPropertyId(value);
                              setSelectedUnitId("");
                              setMonthlyRent("");
                            }}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Choisir un bien" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className={`space-y-2 ${availableUnits.length <= 1 ? 'hidden' : ''}`}>
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unité / Porte</Label>
                          <Select
                            value={selectedUnitId}
                            onValueChange={(value) => {
                              setSelectedUnitId(value);
                              const unit = availableUnits.find((item) => item.id === value);
                              if (unit?.monthly_rent) setMonthlyRent(String(unit.monthly_rent));
                            }}
                            disabled={!selectedPropertyId}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Choisir l'unité" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {availableUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.unit_number} - {unit.monthly_rent?.toLocaleString()} F
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom complet *</Label>
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Prénom et Nom"
                            className="rounded-xl"
                            disabled={!!selectedUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loyer Mensuel *</Label>
                          <Input
                            type="number"
                            value={monthlyRent}
                            onChange={(e) => setMonthlyRent(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="locataire@exemple.com"
                            className="rounded-xl"
                            disabled={!!selectedUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date d'entrée *</Label>
                          <Input
                            type="date"
                            value={moveInDate}
                            onChange={(e) => setMoveInDate(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("choice")}
                        className="flex-1 rounded-xl h-12"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 rounded-xl h-12 bg-primary shadow-lg shadow-primary/20"
                      >
                        {submitting ? "Traitement..." : "Confirmer l'ajout"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 space-y-6 text-center"
            >
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Compte créé !</h3>
                <p className="text-muted-foreground">
                  Transmettez ces codes au locataire. Pour sa sécurité, ils ne seront affichés qu'une seule fois.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between border-2 border-dashed border-muted">
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Identifiant (ID)</p>
                    <p className="text-xl font-mono font-black text-primary">{tempCredentials?.customId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(tempCredentials?.customId || "");
                      toast({ title: "Copié !" });
                    }}
                    className="h-10 w-10 rounded-xl"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between border-2 border-dashed border-muted">
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Mot de passe temporaire</p>
                    <p className="text-xl font-mono font-black text-primary">{tempCredentials?.tempPassword}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(tempCredentials?.tempPassword || "");
                      toast({ title: "Copié !" });
                    }}
                    className="h-10 w-10 rounded-xl"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="pt-6">
                <Button className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20" onClick={() => handleClose(false)}>
                  J'ai bien noté les accès
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
