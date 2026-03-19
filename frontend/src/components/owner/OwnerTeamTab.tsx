import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Users2,
    UserPlus,
    Mail,
    Phone,
    ShieldCheck,
    Trash2,
    Search,
    Loader2,
    Crown,
    AlertCircle,
    TrendingUp,
    Eye,
    EyeOff
} from "lucide-react";
import { getCollaborators, addCollaborator, updateCollaboratorPermissions, removeCollaborator } from "@/api/owner";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

export const OwnerTeamTab = () => {
    const { toast } = useToast();
    const { hasFeature, loading: subLoading } = useSubscription();
    const hasMultiUser = hasFeature('multi_user');
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        can_view_revenue: false
    });

    const fetchCollaborators = async () => {
        try {
            setLoading(true);
            const data = await getCollaborators();
            setCollaborators(data || []);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible de charger l'équipe.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await addCollaborator({
                ...formData,
                permissions: {
                    can_view_revenue: formData.can_view_revenue
                }
            });
            toast({
                title: "Succès",
                description: "Le collaborateur a été ajouté avec succès."
            });
            setIsAddDialogOpen(false);
            setFormData({ name: "", email: "", password: "", phone: "", can_view_revenue: false });
            fetchCollaborators();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'ajouter le collaborateur.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleRevenueAccess = async (memberId: string, currentStatus: boolean) => {
        try {
            await updateCollaboratorPermissions(memberId, { can_view_revenue: !currentStatus });
            toast({
                title: "Succès",
                description: "Les permissions ont été mises à jour."
            });
            fetchCollaborators();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de modifier les permissions.",
                variant: "destructive"
            });
        }
    };

    const handleRemoveCollaborator = async (memberId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir retirer ce collaborateur de votre équipe ?")) return;

        try {
            await removeCollaborator(memberId);
            toast({
                title: "Succès",
                description: "Le collaborateur a été retiré de l'équipe."
            });
            fetchCollaborators();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de retirer le collaborateur.",
                variant: "destructive"
            });
        }
    };

    const filteredTeam = collaborators.filter(member =>
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Chargement de votre équipe...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Gestion de l'Équipe</h2>
                    <p className="text-muted-foreground">Collaborez avec vos agents pour gérer vos biens immobiliers.</p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            className="gradient-primary text-white shadow-soft hover:scale-105 transition-all"
                            disabled={!hasMultiUser}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Ajouter un collaborateur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleAddCollaborator}>
                            <DialogHeader>
                                <DialogTitle>Nouveau Collaborateur</DialogTitle>
                                <DialogDescription>
                                    Créez un accès pour votre agent. Il pourra gérer vos biens et locataires.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Moussa Diop"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="moussa@exemple.com"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="77 123 45 67"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Mot de passe provisoire</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 8 caractères"
                                        required
                                        min={8}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-primary/10">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="revenue-permission" className="text-sm font-bold flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Accès aux revenus
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Autoriser à voir le chiffre d'affaires et les statistiques financières.
                                        </p>
                                    </div>
                                    <Switch
                                        id="revenue-permission"
                                        checked={formData.can_view_revenue}
                                        onCheckedChange={(checked) => setFormData({ ...formData, can_view_revenue: checked })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Créer le compte
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {!hasMultiUser && !subLoading && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fonctionnalité restreinte</AlertTitle>
                    <AlertDescription>
                        Votre abonnement actuel ne permet pas la gestion multi-utilisateurs. 
                        {collaborators.length > 0 ? " Vos collaborateurs listés ci-dessous n'ont plus accès à votre compte." : " Passez au plan Professionnel pour ajouter des agents."}
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-soft bg-primary/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Users2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Membres</p>
                            <p className="text-2xl font-bold">{collaborators.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-soft bg-green-500/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Statut Équipier</p>
                            <p className="text-2xl font-bold">Actif</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-soft bg-yellow-500/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                            <Crown className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Abonnement</p>
                            <p className="text-2xl font-bold">Professionnel</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search */}
            <Card className="border-none shadow-medium overflow-hidden">
                <CardHeader className="pb-0 pt-6 px-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un membre par nom ou email..."
                            className="pl-10 h-11 bg-secondary/30 border-none shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredTeam.length > 0 ? (
                                filteredTeam.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="group hover:border-primary/20 transition-all border border-transparent shadow-none bg-secondary/20 overflow-hidden">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <Avatar className="h-14 w-14 rounded-2xl shadow-soft">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                                        {member.full_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold truncate">{member.full_name}</h4>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5">
                                                            Agent
                                                        </Badge>
                                                        {!hasMultiUser && (
                                                            <Badge variant="destructive" className="text-[10px] uppercase tracking-wider h-5">
                                                                Accès suspendu
                                                            </Badge>
                                                        )}
                                                        <div
                                                            className="cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => handleToggleRevenueAccess(member.id, member.permissions?.can_view_revenue)}
                                                            title="Cliquer pour changer l'accès aux revenus"
                                                        >
                                                            {member.permissions?.can_view_revenue ? (
                                                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-5 bg-green-50 text-green-600 border-green-200">
                                                                    <Eye className="h-3 w-3 mr-1" /> Revenus
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 opacity-60">
                                                                    <EyeOff className="h-3 w-3 mr-1" /> Revenus
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{member.email}</span>
                                                        </div>
                                                        {member.phone && (
                                                            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{member.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        onClick={() => handleRemoveCollaborator(member.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                        <Users2 className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="font-bold text-lg">Aucun collaborateur</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {searchTerm
                                                ? "Aucun résultat ne correspond à votre recherche."
                                                : "Vous n'avez pas encore ajouté de membres à votre équipe."}
                                        </p>
                                    </div>
                                    {!searchTerm && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddDialogOpen(true)}
                                            className="mt-4"
                                        >
                                            Ajouter mon premier agent
                                        </Button>
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex gap-4">
                <AlertCircle className="h-6 w-6 text-blue-500 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold text-blue-700">À propos du multi-utilisateur</h4>
                    <p className="text-sm text-blue-600/80 leading-relaxed">
                        Chaque collaborateur ajouté aura son propre accès mais travaillera sur votre compte. Ils pourront voir vos biens, vos locataires et générer des documents. Les actions critiques sont limitées pour assurer la sécurité de vos données.
                    </p>
                </div>
            </div>
        </div>
    );
};
