import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReceipt, getOwnerTenants } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    propertyId: string;
    propertyName: string;
    tenantId?: string; // Optional pre-selected tenant ID
}

export const CreateReceiptDialog = ({ open, onOpenChange, onSuccess, propertyId, propertyName, tenantId }: CreateReceiptDialogProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        tenant_id: "",
        property_id: propertyId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "virement",
        notes: ""
    });

    useEffect(() => {
        if (open) {
            console.log('🔍 Dialog opened - tenantId:', tenantId, 'propertyId:', propertyId);
            loadTenants();
            // Reset form with property ID and optional tenant ID
            setFormData(prev => ({
                ...prev,
                property_id: propertyId,
                tenant_id: tenantId || ""
            }));
        }
    }, [open, propertyId, tenantId]);

    const loadTenants = async () => {
        try {
            const data = await getOwnerTenants();
            setTenants(data);
        } catch (error) {
            console.error("Error loading tenants:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.tenant_id || !formData.amount) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir tous les champs obligatoires",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);
            await createReceipt({
                ...formData,
                amount: Number(formData.amount),
                month: Number(formData.month),
                year: Number(formData.year)
            });

            toast({
                title: "Reçu créé",
                description: "Le reçu de paiement a été créé avec succès"
            });

            onOpenChange(false);
            onSuccess();

            // Reset form
            setFormData({
                tenant_id: "",
                property_id: propertyId,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                amount: "",
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: "virement",
                notes: ""
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de créer le reçu",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const months = [
        { value: 1, label: "Janvier" },
        { value: 2, label: "Février" },
        { value: 3, label: "Mars" },
        { value: 4, label: "Avril" },
        { value: 5, label: "Mai" },
        { value: 6, label: "Juin" },
        { value: 7, label: "Juillet" },
        { value: 8, label: "Août" },
        { value: 9, label: "Septembre" },
        { value: 10, label: "Octobre" },
        { value: 11, label: "Novembre" },
        { value: 12, label: "Décembre" }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Créer un reçu de paiement</DialogTitle>
                    <DialogDescription>
                        Générer un reçu PDF pour le locataire de {propertyName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tenant">Locataire *</Label>
                        <Select
                            value={formData.tenant_id}
                            onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                        >
                            <SelectTrigger id="tenant">
                                <SelectValue placeholder="Sélectionner un locataire" />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map((tenant) => (
                                    <SelectItem key={tenant.id} value={tenant.user_id}>
                                        {tenant.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="month">Mois</Label>
                            <Select
                                value={formData.month.toString()}
                                onValueChange={(value) => setFormData({ ...formData, month: Number(value) })}
                            >
                                <SelectTrigger id="month">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem key={month.value} value={month.value.toString()}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="year">Année</Label>
                            <Select
                                value={formData.year.toString()}
                                onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
                            >
                                <SelectTrigger id="year">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Montant (FCFA) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="500000"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Date de paiement *</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Mode de paiement</Label>
                        <Select
                            value={formData.payment_method}
                            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                        >
                            <SelectTrigger id="payment_method">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="virement">Virement bancaire</SelectItem>
                                <SelectItem value="especes">Espèces</SelectItem>
                                <SelectItem value="cheque">Chèque</SelectItem>
                                <SelectItem value="mobile">Paiement mobile</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optionnel)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Informations complémentaires..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer le reçu
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
