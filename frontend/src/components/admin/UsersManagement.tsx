import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Ban, Search, UserCheck } from "lucide-react";
import { getAllUsers, blockUser, unblockUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { User } from "@/types";

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

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
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user) => {
      const email = user.email?.toLowerCase() || "";
      const fullName = user.full_name?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      return email.includes(search) || fullName.includes(search);
    });

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

  const getUserTypeBadge = (role: string) => {
    if (role === "owner") {
      return <Badge variant="default">Propriétaire</Badge>;
    }
    if (role === "tenant") {
      return <Badge variant="secondary">Locataire</Badge>;
    }
    return <Badge variant="outline">Admin</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border p-0 overflow-hidden">
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Aucun utilisateur trouvé</div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 border-b last:border-0 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                      </div>
                      {getUserTypeBadge(user.role)}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Inscription</p>
                        <p className="text-sm">
                          {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Statut</p>
                        {user.is_blocked ? (
                          <Badge variant="destructive" className="h-5 text-[10px]">Bloqué</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 h-5 text-[10px]">Actif</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex justify-end">
                      {user.is_blocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUnblockUser(user)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Débloquer
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleBlockUser(user)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Bloquer
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getUserTypeBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive">Bloqué</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.is_blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockUser(user)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Débloquer
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBlockUser(user)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Bloquer
                            </Button>
                          )}
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

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
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
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Utilisateur sélectionné :</p>
                <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="blockReason">Raison du blocage *</Label>
              <Textarea
                id="blockReason"
                placeholder="Expliquez pourquoi vous bloquez cet utilisateur (minimum 5 caractères)..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blocking}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBlockUser}
              disabled={blocking || blockReason.trim().length < 5}
            >
              {blocking ? "Blocage en cours..." : "Confirmer le blocage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
