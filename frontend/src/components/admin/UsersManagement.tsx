import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Ban, Search, UserCheck, CreditCard, Users } from "lucide-react";
import { getAllUsers, blockUser, unblockUser, updateUserSubscription } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { User } from "@/types";

interface UsersManagementProps {
  initialSearchTerm?: string;
}

const UsersManagement = ({ initialSearchTerm = "" }: UsersManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subConfig, setSubConfig] = useState({
    planName: "PREMIUM",
    durationDays: 30,
    price: 5000,
    status: "active"
  });
  const [updatingSub, setUpdatingSub] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();

      // Trier par date d'inscription (plus récent en premier)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Décroissant (plus récent en premier)
      });

      setUsers(sortedData);
      setFilteredUsers(sortedData);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((user) => {
        const email = user.email?.toLowerCase() || "";
        const fullName = user.full_name?.toLowerCase() || "";
        const customId = user.customId?.toLowerCase() || "";
        return email.includes(search) || fullName.includes(search) || customId.includes(search);
      });
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setBlockReason("");
    setBlockDialogOpen(true);
  };

  const handleUnblockUser = async (user: User) => {
    try {
      await unblockUser(user.id);
      toast({
        title: "Utilisateur débloqué",
        description: `${user.full_name} peut maintenant se connecter`,
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de débloquer l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const confirmBlockUser = async () => {
    if (!selectedUser || !blockReason.trim() || blockReason.trim().length < 5) {
      toast({
        title: "Erreur",
        description: "La raison doit contenir au moins 5 caractères",
        variant: "destructive",
      });
      return;
    }

    try {
      setBlocking(true);
      await blockUser(selectedUser.id, blockReason.trim());

      toast({
        title: "Utilisateur bloqué",
        description: "L'utilisateur a été bloqué et ses biens dépubliés",
      });

      setBlockDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du blocage de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setBlocking(false);
    }
  };

  const calculateSubscriptionPrice = (plan: string, duration: number) => {
    const isPro = plan === 'PROFESSIONNEL' || plan === 'PROFESSIONAL';
    if (isPro) {
      if (duration >= 365) return 162000;
      if (duration === 90) return 45000;
      return 15000;
    } else {
      if (duration >= 365) return 54000;
      if (duration === 90) return 15000;
      return 5000;
    }
  };

  const handleOpenSubscription = (user: User) => {
    setSelectedUser(user);
    setSubConfig({
      planName: "PREMIUM",
      durationDays: 30,
      price: 5000,
      status: "active"
    });
    setSubDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingSub(true);
      await updateUserSubscription(selectedUser.id, subConfig);

      toast({
        title: "Abonnement mis à jour",
        description: `L'abonnement de ${selectedUser.full_name} a été actualisé.`,
      });

      setSubDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de l'abonnement",
        variant: "destructive",
      });
    } finally {
      setUpdatingSub(false);
    }
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  const getUserTypeBadge = (role: string) => {
    if (role === "owner") {
      return <Badge variant="default" className="bg-[#2D3FE2] text-white">Propriétaire</Badge>;
    }
    if (role === "tenant") {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">Locataire</Badge>;
    }
    return <Badge variant="outline">Admin</Badge>;
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-soft border-border/80">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Gestion des utilisateurs</CardTitle>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
              {filteredUsers.length} {filteredUsers.length > 1 ? "utilisateurs" : "utilisateur"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Responsive Search & Filters Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input with embedded icon */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher par nom, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl bg-background border-input text-sm"
              />
            </div>

            {/* Role Filter Pills (horizontally scrollable without truncation on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 w-full sm:w-auto -mx-1 px-1">
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs h-8 shrink-0 px-3 font-medium"
                onClick={() => setRoleFilter("all")}
              >
                Tous
              </Button>
              <Button
                variant={roleFilter === "owner" ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs h-8 shrink-0 px-3 font-medium"
                onClick={() => setRoleFilter("owner")}
              >
                Propriétaires
              </Button>
              <Button
                variant={roleFilter === "tenant" ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs h-8 shrink-0 px-3 font-medium"
                onClick={() => setRoleFilter("tenant")}
              >
                Locataires
              </Button>
              <Button
                variant={roleFilter === "admin" ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs h-8 shrink-0 px-3 font-medium"
                onClick={() => setRoleFilter("admin")}
              >
                Admins
              </Button>
            </div>
          </div>

          {/* Mobile Card View (shown below md) */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-sm">
                Aucun utilisateur trouvé
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isOwner = user.role === "owner";
                const self = isSelf(user.id);
                // Ni soi-même ni un autre administrateur (refusé aussi par le serveur)
                const hasBlockAction = !self && user.role !== "admin";
                const hasSubAction = isOwner;
                const totalActions = (hasBlockAction ? 1 : 0) + (hasSubAction ? 1 : 0);

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border border-border/80 bg-card shadow-xs transition-all space-y-3"
                  >
                    {/* Top Row: User identity & role badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base text-foreground truncate leading-snug">
                          {user.full_name}
                        </p>
                        <p className="text-xs font-mono font-semibold text-primary mt-0.5">
                          {user.customId || "ID: N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {getUserTypeBadge(user.role)}
                      </div>
                    </div>

                    {/* Middle Row: Inscription Date & Status */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Inscription
                        </p>
                        <p className="font-medium text-foreground mt-0.5">
                          {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Statut
                        </p>
                        <div className="mt-0.5">
                          {user.is_blocked ? (
                            <Badge variant="destructive" className="h-5 text-[10px] px-2 font-semibold">
                              Bloqué
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white h-5 text-[10px] px-2 font-semibold">
                              Actif
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Action buttons (properly aligned grid) */}
                    {totalActions > 0 && (
                      <div className={`pt-2 border-t border-border/60 gap-2 ${totalActions === 2 ? 'grid grid-cols-2' : 'flex'}`}>
                        {hasBlockAction && (
                          user.is_blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-9 rounded-lg text-xs font-semibold px-2"
                              onClick={() => handleUnblockUser(user)}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1.5 shrink-0 text-emerald-600" />
                              <span className="truncate">Débloquer</span>
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full h-9 rounded-lg text-xs font-semibold px-2"
                              onClick={() => handleBlockUser(user)}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                              <span className="truncate">Bloquer</span>
                            </Button>
                          )
                        )}

                        {hasSubAction && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 rounded-lg text-xs font-semibold px-2 border-primary/40 text-primary hover:bg-primary hover:text-white"
                            onClick={() => handleOpenSubscription(user)}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Gérer Abonnement</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (hidden on mobile, shown on md+) */}
          <div className="hidden md:block rounded-xl border border-border/80 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-primary font-bold text-xs">
                          {user.customId || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {user.full_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {user.email}
                        </TableCell>
                        <TableCell>{getUserTypeBadge(user.role)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive" className="h-5 text-[10px]">Bloqué</Badge>
                          ) : (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white h-5 text-[10px]">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSelf(user.id) && user.role !== "admin" && (user.is_blocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleUnblockUser(user)}
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                Débloquer
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleBlockUser(user)}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Bloquer
                              </Button>
                            ))}
                            {user.role === 'owner' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={() => handleOpenSubscription(user)}
                                title="Gérer l'abonnement"
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                <span>Abonnement</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Blocage */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Bloquer l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Cette action bloquera l'utilisateur et dépubliera tous ses biens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedUser && (
              <div className="p-3 bg-muted rounded-xl text-xs space-y-1">
                <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="blockReason" className="text-xs font-semibold">Raison du blocage *</Label>
              <Textarea
                id="blockReason"
                placeholder="Expliquez pourquoi vous bloquez cet utilisateur (minimum 5 caractères)..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blocking}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBlockUser}
              disabled={blocking || blockReason.trim().length < 5}
              className="rounded-xl"
            >
              {blocking ? "Blocage en cours..." : "Confirmer le blocage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Abonnement */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Gérer l'abonnement
            </DialogTitle>
            <DialogDescription>
              Modifiez manuellement l'abonnement de l'utilisateur.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-secondary/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
                {getUserTypeBadge(selectedUser.role)}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Statut de l'abonnement</Label>
                  <Select
                    value={subConfig.status}
                    onValueChange={(val) => setSubConfig(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-xs">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active">Activé (En cours)</SelectItem>
                      <SelectItem value="expired">Désactivé (Expiré)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {subConfig.status === 'active' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Choisir un Plan</Label>
                      <Select
                        value={subConfig.planName}
                        onValueChange={(val) => {
                          const newPrice = calculateSubscriptionPrice(val, subConfig.durationDays);
                          setSubConfig(prev => ({ ...prev, planName: val, price: newPrice }));
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-xs">
                          <SelectValue placeholder="Choisir un plan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="PREMIUM">
                            Premium ({calculateSubscriptionPrice('PREMIUM', subConfig.durationDays).toLocaleString('fr-FR')} F)
                          </SelectItem>
                          <SelectItem value="PROFESSIONNEL">
                            Professionnel ({calculateSubscriptionPrice('PROFESSIONNEL', subConfig.durationDays).toLocaleString('fr-FR')} F)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Durée de l'abonnement</Label>
                      <Select
                        value={subConfig.durationDays.toString()}
                        onValueChange={(val) => {
                          const duration = parseInt(val);
                          const newPrice = calculateSubscriptionPrice(subConfig.planName, duration);
                          setSubConfig(prev => ({ ...prev, durationDays: duration, price: newPrice }));
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-xs">
                          <SelectValue placeholder="Choisir une durée" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="30">30 jours (1 mois - Tarif mensuel)</SelectItem>
                          <SelectItem value="90">90 jours (3 mois)</SelectItem>
                          <SelectItem value="365">365 jours (1 an - Tarif annuel -10%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold">Montant appliqué (FCFA)</Label>
                        {subConfig.durationDays >= 365 && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                            Tarif annuel (-10%)
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={subConfig.price}
                        onChange={(e) => setSubConfig(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="h-10 rounded-xl text-xs font-bold"
                        placeholder="Montant en FCFA"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Ce montant sera enregistré dans la comptabilité et l'historique des paiements.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSubDialogOpen(false)}
              disabled={updatingSub}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              onClick={handleUpdateSubscription}
              disabled={updatingSub}
            >
              {updatingSub ? "Mise à jour..." : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
