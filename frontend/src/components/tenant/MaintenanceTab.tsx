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
import { Wrench, Plus, Clock, CheckCircle2, AlertCircle, Camera, Loader2, Info, Edit3, Trash2 } from "lucide-react";
import { getTenantMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, uploadPhotos, getTenantMe } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const MaintenanceTab = () => {
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [leases, setLeases] = useState<any[]>([]);

    // Confirm Delete Dialog state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<{ id: string; title: string } | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
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
                console.error("Maintenance requests data is not an array:", data);
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

    const removeNewPhoto = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const openEditModal = (reqItem: any) => {
        setEditingRequestId(reqItem.id);
        setTitle(reqItem.title || "");
        setDescription(reqItem.description || "");
        setPriority(reqItem.priority || "medium");
        setExistingPhotos(Array.isArray(reqItem.photos) ? reqItem.photos : []);
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSelectedLeaseId(reqItem.tenant_id || (leases.length > 0 ? leases[0].id : ""));
        setIsDialogOpen(true);
    };

    const promptDelete = (reqId: string, reqTitle: string) => {
        setRequestToDelete({ id: reqId, title: reqTitle });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!requestToDelete) return;

        try {
            await deleteMaintenanceRequest(requestToDelete.id);
            toast({
                title: "Signalement supprimé",
                description: "Le signalement a été annulé et retiré du tableau de bord.",
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de supprimer le signalement.",
                variant: "destructive"
            });
        } finally {
            setRequestToDelete(null);
        }
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

            let newPhotoUrls: string[] = [];
            if (selectedFiles.length > 0) {
                newPhotoUrls = await uploadPhotos(selectedFiles);
            }

            const allPhotos = [...existingPhotos, ...newPhotoUrls];

            if (editingRequestId) {
                await updateMaintenanceRequest(editingRequestId, {
                    title,
                    description,
                    priority,
                    photos: allPhotos
                });
                toast({
                    title: "Signalement modifié",
                    description: "Les modifications ont été transmises au propriétaire.",
                });
            } else {
                await createMaintenanceRequest({
                    title,
                    description,
                    priority,
                    photos: allPhotos,
                    tenant_id: selectedLeaseId
                });

                toast({
                    title: "Signalement envoyé",
                    description: "Votre demande a été transmise au propriétaire.",
                });
            }

            setIsDialogOpen(false);
            resetForm();
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'enregistrer le signalement.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingRequestId(null);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setExistingPhotos([]);
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Maintenance</h2>
                    <p className="text-muted-foreground text-sm">Signalez et suivez vos problèmes techniques</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto gap-2" onClick={() => resetForm()}>
                            <Plus className="h-4 w-4" /> Nouveau signalement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRequestId ? "Modifier le signalement" : "Signaler un incident"}</DialogTitle>
                            <DialogDescription>
                                {editingRequestId ? "Mettez à jour les informations du signalement." : "Décrivez le problème avec précision pour une résolution rapide."}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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

                            {leases.length > 1 && !editingRequestId && (
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
                                    {/* Existing Cloudinary photos */}
                                    {existingPhotos.map((url, index) => (
                                        <div key={`existing-${index}`} className="relative w-16 h-16 sm:w-20 sm:h-20 group">
                                            <img src={url} alt="Photo existante" className="w-full h-full object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingPhoto(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                title="Supprimer la photo"
                                            >
                                                <Plus className="h-3 w-3 rotate-45" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Newly uploaded photos */}
                                    {previewUrls.map((url, index) => (
                                        <div key={`new-${index}`} className="relative w-16 h-16 sm:w-20 sm:h-20 group">
                                            <img src={url} alt="Aperçu" className="w-full h-full object-cover rounded-md border" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewPhoto(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                            >
                                                <Plus className="h-3 w-3 rotate-45" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                                        <span className="text-[9px] sm:text-[10px] mt-1 text-muted-foreground text-center">Ajouter</span>
                                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
                                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="w-full sm:w-auto">Annuler</Button>
                                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
                                        </>
                                    ) : (editingRequestId ? "Enregistrer les modifications" : "Envoyer le signalement")}
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
                        <Card key={request.id} className="overflow-hidden shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
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
                                <CardContent className="space-y-4 pb-3">
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
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={url}
                                                        alt="Incident"
                                                        className="w-12 h-12 object-cover rounded border hover:opacity-80 transition-opacity"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </div>

                            {/* Card Footer Actions: Edit & Delete */}
                            <div className="px-6 py-3 bg-muted/20 border-t flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => openEditModal(request)}
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Modifier</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => promptDelete(request.id, request.title)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Supprimer</span>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de confirmation de suppression style SamaLocation */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Supprimer le signalement"
                description={`Voulez-vous vraiment supprimer le signalement "${requestToDelete?.title || ""}" ? Cette action est irréversible et supprimera les photos associées.`}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
};
