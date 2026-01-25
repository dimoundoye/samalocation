import { useState, useEffect } from "react";
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
import { updateTenant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EditTenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: any;
    onSuccess: () => void;
}

export const EditTenantDialog = ({
    open,
    onOpenChange,
    tenant,
    onSuccess,
}: EditTenantDialogProps) => {
    const { toast } = useToast();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [monthlyRent, setMonthlyRent] = useState("");
    const [moveInDate, setMoveInDate] = useState("");
    const [status, setStatus] = useState("active");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && tenant) {
            setFullName(tenant.full_name || "");
            setEmail(tenant.email || "");
            setPhone(tenant.phone || "");
            setMonthlyRent(String(tenant.monthly_rent || ""));

            // Format date for input[type="date"]
            if (tenant.move_in_date) {
                const date = new Date(tenant.move_in_date);
                setMoveInDate(date.toISOString().split("T")[0]);
            } else {
                setMoveInDate("");
            }

            setStatus(tenant.status || "active");
        }
    }, [open, tenant]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!fullName.trim()) {
            toast({
                title: "Nom requis",
                description: "Veuillez renseigner le nom du locataire.",
                variant: "destructive",
            });
            return;
        }

        const rentValue = parseInt(monthlyRent, 10);
        if (Number.isNaN(rentValue) || rentValue < 0) {
            toast({
                title: "Loyer invalide",
                description: "Le loyer mensuel doit être un nombre valide.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);

            const updateData = {
                full_name: fullName.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                monthly_rent: rentValue,
                move_in_date: moveInDate,
                status,
            };

            await updateTenant(tenant.id, updateData);

            toast({
                title: "Locataire mis à jour",
                description: "Les informations du locataire ont été modifiées avec succès.",
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating tenant:", error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible de mettre à jour le locataire.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>Modifier le locataire</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations de {tenant?.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Nom complet *</Label>
                        <Input
                            id="edit-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nom et prénom"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemple.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Téléphone</Label>
                            <Input
                                id="edit-phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+221 ..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-rent">Loyer mensuel (F CFA) *</Label>
                            <Input
                                id="edit-rent"
                                type="number"
                                value={monthlyRent}
                                onChange={(e) => setMonthlyRent(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Date d'entrée *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={moveInDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-status">Statut</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="edit-status">
                                <SelectValue placeholder="Sélectionnez un statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="inactive">Inactif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
