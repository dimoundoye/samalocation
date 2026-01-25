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
import { Search, UserPlus, CheckCircle } from "lucide-react";
import { searchUsers, assignTenant, createNotification, createTenantAccount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, AlertCircle } from "lucide-react";

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

      console.log('Unit filter check:', {
        unitId: unit.id,
        unitNumber: unit.unit_number,
        property_id: unit.property_id,
        selectedPropertyId,
        propertyMatch,
        is_available: unit.is_available,
        isAvailable,
        willInclude: propertyMatch && isAvailable
      });

      return propertyMatch && isAvailable;
    });

    console.log('Filtered units:', filtered);
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
    }
    onOpenChange(nextOpen);
  };

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
      }

      // Si le locataire a un compte utilisateur, lui envoyer une notification
      if (insertedTenant.user_id) {
        try {
          await createNotification({
            user_id: insertedTenant.user_id,
            type: "tenant",
            title: "Nouveau bail",
            message: `Vous avez été affecté(e) au bien ${insertedTenant.property_name || 'un nouveau bien'}`,
            link: "/tenant-dashboard"
          });
        } catch (notifError) {
          console.error("Error creating tenant notification:", notifError);
        }
      }

      toast({
        title: "Locataire ajouté",
        description: `${insertedTenant.full_name ?? "Le locataire"} a été associé au bien sélectionné.`,
      });

      onSuccess();
      if (!accountResult) {
        handleClose(false);
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Associer un locataire</DialogTitle>
          <DialogDescription>
            Recherchez un locataire existant ou créez un nouveau locataire et rattachez-le à l'une de vos unités.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "new" | "existing")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">
              <Search className="h-4 w-4 mr-2" />
              Locataire existant
            </TabsTrigger>
            <TabsTrigger value="new">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau locataire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-2">
              <Label>Rechercher un locataire</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchUsersLocal();
                    }
                  }}
                />
                <Button type="button" onClick={() => searchUsersLocal()} disabled={searching || !searchQuery.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedUser.full_name}</p>
                    <p className="text-sm text-green-700">{selectedUser.email}</p>
                    <Badge variant="outline" className="mt-1">
                      Compte existant
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {searchResults.length > 0 && !selectedUser && (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left p-3 hover:bg-secondary rounded-md transition-colors"
                    >
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {searchQuery && searchResults.length === 0 && !searching && (
              <p className="text-center text-muted-foreground py-4">
                Aucun utilisateur trouvé
              </p>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créez un nouveau locataire qui n'a pas encore de compte.
            </p>
            <div className="flex items-center space-x-2 p-2 border rounded-md bg-secondary/20">
              <input
                type="checkbox"
                id="create-account"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="create-account" className="cursor-pointer">
                Générer un compte de connexion (ID + Mot de passe)
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        {tempCredentials ? (
          <div className="space-y-4 py-4 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-bold">Compte créé avec succès !</h3>
              <p className="text-sm text-muted-foreground">
                Veuillez copier ces informations et les transmettre au locataire. Elles ne seront plus affichées.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 border rounded-md flex items-center justify-between bg-white shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Identifiant (ID)</p>
                  <p className="text-lg font-mono font-bold text-primary">{tempCredentials.customId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(tempCredentials.customId);
                    toast({ title: "Copié !", description: "L'identifiant a été copié." });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3 border rounded-md flex items-center justify-between bg-white shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Mot de passe temporaire</p>
                  <p className="text-lg font-mono font-bold text-primary">{tempCredentials.tempPassword}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(tempCredentials.tempPassword);
                    toast({ title: "Copié !", description: "Le mot de passe a été copié." });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-800">
                Le locataire sera invité à configurer son profil et changer son mot de passe lors de sa première connexion.
              </p>
            </div>

            <Button className="w-full" onClick={() => handleClose(false)}>
              J'ai copié les informations
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bien</Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={(value) => {
                    setSelectedPropertyId(value);
                    setSelectedUnitId("");
                    setMonthlyRent("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un bien" />
                  </SelectTrigger>
                  <SelectContent>
                    {!properties || properties.length === 0 ? (
                      <SelectItem value="no-properties" disabled>
                        Aucun bien disponible
                      </SelectItem>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name || "Sans nom"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unité</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={(value) => {
                    setSelectedUnitId(value);
                    const unit = availableUnits.find((item) => item.id === value);
                    if (unit && unit.monthly_rent != null) {
                      setMonthlyRent(String(unit.monthly_rent));
                    } else {
                      setMonthlyRent("");
                    }
                  }}
                  disabled={!selectedPropertyId || availableUnits.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPropertyId ? "Sélectionnez une unité" : "Choisissez d'abord un bien"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!availableUnits || availableUnits.length === 0 ? (
                      <SelectItem value="no-units" disabled>
                        {selectedPropertyId ? "Aucune unité disponible" : "Choisissez d'abord un bien"}
                      </SelectItem>
                    ) : (
                      availableUnits.map((unit) => {
                        const period =
                          typeof unit?.rent_period === "string" ? unit.rent_period : "mois";
                        return (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unit_number || "Sans numéro"} • {unit.monthly_rent?.toLocaleString() || "0"} F/{period}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom complet *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (searchMode === "existing") setSelectedUser(null);
                  }}
                  placeholder="Nom et prénom"
                  disabled={!!selectedUser}
                />
              </div>
              <div>
                <Label>Email (Optionnel)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (searchMode === "existing") setSelectedUser(null);
                  }}
                  placeholder="email@exemple.com"
                  disabled={!!selectedUser}
                />
              </div>
              <div>
                <Label>Téléphone (Optionnel)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : +221 77 000 00 00"
                />
              </div>
              <div>
                <Label>Loyer mensuel (F CFA) *</Label>
                <Input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="Ex : 150000"
                />
              </div>
              <div>
                <Label>Date d'entrée *</Label>
                <Input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="terminated">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
