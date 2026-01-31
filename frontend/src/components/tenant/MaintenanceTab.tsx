import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Clock, CheckCircle2, AlertCircle, Camera, Loader2, Info } from "lucide-react";
import { getTenantMaintenanceRequests, createMaintenanceRequest, uploadPhotos, getTenantMe } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const MaintenanceTab = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [leases, setLeases] = useState<any[]>([]);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadRequests(), loadLeases()]);
        setLoading(false);
    };

    const loadLeases = async () => {
        try {
            const data = await getTenantMe();
            if (data && data.leases) {
                setLeases(data.leases);
                if (data.leases.length > 0 && !selectedLeaseId) {
                    setSelectedLeaseId(data.leases[0].id);
                }
            }
        } catch (error) {
            console.error("Error loading leases:", error);
        }
    };

    const loadRequests = async () => {
        try {
            const data = await getTenantMaintenanceRequests();
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error("Maintenance requests data is not an array [UI-V3]:", data);
                setRequests([]);
            }
        } catch (error) {
            console.error("Error loading maintenance requests:", error);
            setRequests([]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) {
            toast({
                title: "Champs manquants",
                description: "Veuillez remplir le titre et la description.",
                variant: "destructive"
            });
            return;
        }

        try {
            setSubmitting(true);

            let photoUrls: string[] = [];
            if (selectedFiles.length > 0) {
                photoUrls = await uploadPhotos(selectedFiles);
            }

            await createMaintenanceRequest({
                title,
                description,
                priority,
                photos: photoUrls,
                tenant_id: selectedLeaseId
            });

            toast({
                title: "Signalement envoyé [UI-V3]",
                description: "Votre demande a été transmise au propriétaire.",
            });

            setIsDialogOpen(false);
            resetForm();
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'envoyer le signalement.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setSelectedFiles([]);
        setPreviewUrls([]);
        if (leases.length > 0) {
            setSelectedLeaseId(leases[0].id);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200">En attente</Badge>;
            case 'in_progress':
                return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200">En cours</Badge>;
            case 'resolved':
                return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200">Résolu</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="text-gray-500">Annulé</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityIcon = (p: string) => {
        switch (p) {
            case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Maintenance</h2>
                    <p className="text-muted-foreground">Signalez et suivez vos problèmes techniques</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Nouveau signalement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Signaler un incident</DialogTitle>
                            <DialogDescription>
                                Décrivez le problème avec précision pour une résolution rapide.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre de l'incident</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Fuite sous l'évier de la cuisine"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {leases.length > 1 && (
                                <div className="space-y-2">
                                    <Label htmlFor="lease">Logement concerné</Label>
                                    <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez le logement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leases.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.property_name} ({l.owner_name || "Propriétaire"}) - {l.unit_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priorité</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez la priorité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Faible</SelectItem>
                                        <SelectItem value="medium">Moyenne</SelectItem>
                                        <SelectItem value="high">Haute</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description détaillée</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Expliquez ce qui se passe..."
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Photos (optionnel)</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative w-20 h-20 group">
                                            <img src={url} alt="Aperçu" className="w-full h-full object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Plus className="h-3 w-3 rotate-45" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-20 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-[10px] mt-1 text-muted-foreground text-center">Ajouter</span>
                                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
                                        </>
                                    ) : "Envoyer le signalement"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (!Array.isArray(requests) || requests.length === 0) ? (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold text-lg">Aucun signalement</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Tout semble fonctionner correctement ! Cliquez sur "Nouveau signalement" si vous rencontrez un problème.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(requests) && requests.map((request) => (
                        <Card key={request.id} className="overflow-hidden shadow-soft hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    {getStatusBadge(request.status)}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {getPriorityIcon(request.priority)}
                                        <span className="capitalize">
                                            {request.priority === 'urgent' ? 'Urgent' :
                                                request.priority === 'high' ? 'Haute' :
                                                    request.priority === 'medium' ? 'Moyenne' : 'Faible'}
                                        </span>
                                    </div>
                                </div>
                                <CardTitle className="mt-3 text-lg line-clamp-1">{request.title}</CardTitle>
                                <CardDescription className="text-xs">
                                    {request.created_at ? format(new Date(request.created_at), "PPP", { locale: fr }) : "Date inconnue"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {request.description}
                                </p>

                                <div className="flex items-center gap-2 text-xs font-medium bg-muted/50 p-2 rounded">
                                    <Info className="h-3 w-3" />
                                    <span>{request.property_name} - {request.unit_number || "Unité locale"}</span>
                                </div>

                                {Array.isArray(request.photos) && request.photos.length > 0 && (
                                    <div className="flex gap-1 overflow-x-auto pb-1 mt-2">
                                        {request.photos.map((url: string, idx: number) => (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt="Incident"
                                                className="w-12 h-12 object-cover rounded border"
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
