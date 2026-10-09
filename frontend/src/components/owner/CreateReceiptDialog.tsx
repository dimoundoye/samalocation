import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReceipt, getOwnerTenants, getOwnerContracts } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { isDepositReceipt, isPaidRentReceipt } from "@/lib/deposits";
import { formatCurrency } from "@/lib/utils";
import { ReceiptType } from "@/types";

interface CreateReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    propertyId: string;
    propertyName: string;
    tenantId?: string; // Optional pre-selected tenant ID
    tenantName?: string; // Optional pre-selected tenant name
    monthlyRent?: number; // Optional pre-selected monthly rent
    unitId?: string; // Optional pre-selected unit ID
    receipts?: any[]; // All receipts to help determine the next month
}

export const CreateReceiptDialog = ({ open, onOpenChange, onSuccess, propertyId, propertyName, tenantId, tenantName, monthlyRent, unitId, receipts = [] }: CreateReceiptDialogProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
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
        notes: "",
        period_type: 'mois' as 'mois' | 'semaine' | 'jour',
        start_date: "",
        end_date: "",
        receipt_type: 'rent' as ReceiptType
    });
    const isDeposit = formData.receipt_type === 'deposit';

    // Caution déjà détenue pour ce locataire sur ce logement (le serveur refuse d'en émettre une seconde)
    const selectedTenantForDeposit = tenants.find(t => t.id === formData.tenant_id);
    const depositTenantIds = [formData.tenant_id, selectedTenantForDeposit?.user_id, tenantId].filter(Boolean);
    const depositUnitId = unitId || selectedTenantForDeposit?.unit_id;
    const heldDeposit = receipts.find(r =>
        isDepositReceipt(r) &&
        r.status !== 'cancelled' &&
        !r.settlement_id &&
        r.property_id === propertyId &&
        (!depositUnitId || !r.unit_id || r.unit_id === depositUnitId) &&
        depositTenantIds.includes(r.tenant_id)
    );

    const { subscription } = useSubscription();
    const [upgradeModal, setUpgradeModal] = useState({
        open: false,
        title: "",
        description: ""
    });

    useEffect(() => {
        if (open) {
            console.log('🔍 Dialog opened - tenantId:', tenantId, 'propertyId:', propertyId);
            loadTenants();

            // Set initial state
            setFormData(prev => ({
                ...prev,
                property_id: propertyId,
                tenant_id: tenantId || "",
                amount: monthlyRent ? String(monthlyRent) : prev.amount
            }));
        }
    }, [open, propertyId, tenantId, monthlyRent]);

    // Effect to auto-fill month, year and amount when tenant changes
    useEffect(() => {
        if (!formData.tenant_id) return;

        const selectedTenant = tenants.find(t => t.id === formData.tenant_id);

        // Update amount and period type if tenant has a defined rent
        if (selectedTenant) {
            setFormData(prev => ({
                ...prev,
                amount: selectedTenant.monthly_rent ? String(selectedTenant.monthly_rent) : prev.amount,
                period_type: selectedTenant.rent_period || 'mois'
            }));
        }

        // Suggest next month based on history (quittances de loyer valides uniquement : ni cautions ni reçus annulés)
        if (receipts && receipts.length > 0) {
            const tenantReceipts = receipts.filter(r =>
                isPaidRentReceipt(r) && (r.tenant_id === formData.tenant_id || r.tenant_id === selectedTenant?.user_id)
            );
            if (tenantReceipts.length > 0) {
                // Find most recent receipt
                const latest = tenantReceipts.reduce((prev, curr) => {
                    if (curr.year > prev.year) return curr;
                    if (curr.year === prev.year && curr.month > prev.month) return curr;
                    return prev;
                }, tenantReceipts[0]);

                // Calculate next month
                let nextMonth = latest.month + 1;
                let nextYear = latest.year;
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }

                setFormData(prev => ({
                    ...prev,
                    month: nextMonth,
                    year: nextYear
                }));
            } else {
                // If no receipt yet, suggest current month
                setFormData(prev => ({
                    ...prev,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                }));
            }
        }
    }, [formData.tenant_id, tenants, receipts]);

    const loadTenants = async () => {
        try {
            const data = await getOwnerTenants();

            // Dédoublonner par user_id pour éviter les répétitions
            const uniqueTenants: any[] = [];
            const seenUserIds = new Set();
            
            [...data].forEach(t => {
                if (!seenUserIds.has(t.user_id)) {
                    seenUserIds.add(t.user_id);
                    uniqueTenants.push(t);
                }
            });

            if (tenantId && tenantName && !uniqueTenants.find((t: any) => t.user_id === tenantId)) {
                uniqueTenants.push({ user_id: tenantId, full_name: tenantName, id: 'temp' });
            }

            setTenants(uniqueTenants);
        } catch (error) {
            console.error("Error loading tenants:", error);
            // Fallback si on a les infos du locataire
            if (tenantId && tenantName) {
                setTenants([{ user_id: tenantId, full_name: tenantName, id: 'temp' }]);
            }
        }
    };

    const handleReceiptTypeChange = async (value: ReceiptType) => {
        if (value === 'rent') {
            setFormData(prev => ({ ...prev, receipt_type: 'rent', amount: monthlyRent ? String(monthlyRent) : prev.amount }));
            return;
        }

        setFormData(prev => ({ ...prev, receipt_type: 'deposit', amount: "" }));
        // Pré-remplir avec la caution prévue au contrat du locataire, s'il y en a un
        try {
            const contracts = await getOwnerContracts();
            const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
            const tenantIds = [formData.tenant_id, selectedTenant?.user_id, tenantId].filter(Boolean);
            const contract = contracts
                .filter(c => tenantIds.includes(c.tenant_id) && c.status !== 'terminated' && Number(c.deposit_amount) > 0)
                .filter(c => !unitId || !c.unit_id || c.unit_id === unitId)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            if (contract) {
                setFormData(prev => (prev.receipt_type === 'deposit' && !prev.amount ? { ...prev, amount: String(contract.deposit_amount) } : prev));
            }
        } catch {
            // Pré-remplissage facultatif : le propriétaire saisit le montant
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

        // Les reçus de caution ne comptent pas dans le quota de quittances
        if (!isDeposit && subscription && subscription.receipts_this_month >= subscription.receipts_limit && subscription.receipts_limit !== -1 && subscription.receipts_limit !== Infinity) {
            setUpgradeModal({
                open: true,
                title: "Limite de reçus atteinte",
                description: `Votre plan actuel est limité à ${subscription.receipts_limit} reçus par mois. Passez au plan supérieur pour en générer de façon illimitée.`
            });
            return;
        }

        try {
            setLoading(true);

            // Trouver le unit_id pour ce locataire (si non fourni en prop)
            const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
            const final_unit_id = unitId || selectedTenant?.unit_id;

            await createReceipt({
                ...formData,
                unit_id: final_unit_id,
                amount: Number(formData.amount),
                month: Number(formData.month),
                year: Number(formData.year),
                start_date: !isDeposit && formData.period_type !== 'mois' ? formData.start_date : undefined,
                end_date: !isDeposit && formData.period_type !== 'mois' ? formData.end_date : undefined,
            });

            toast({
                title: isDeposit ? "Reçu de caution créé" : "Reçu créé",
                description: isDeposit
                    ? "Le reçu de caution a été créé. Vous pourrez enregistrer sa restitution depuis l'historique du locataire."
                    : "Le reçu de paiement a été créé avec succès"
            });

            onSuccess();
            handleClose();
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



    const handleClose = () => {
        setFormData({
            tenant_id: "",
            property_id: propertyId,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: "",
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: "virement",
            notes: "",
            period_type: 'mois',
            start_date: "",
            end_date: "",
            receipt_type: 'rent'
        });
        onOpenChange(false);
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
    const years = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i); // [2027, 2026, 2025, 2024, 2023]

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>{isDeposit ? "Créer un reçu de caution" : "Créer un reçu de paiement"}</DialogTitle>
                    <DialogDescription>
                        Générer un reçu PDF pour le locataire de {propertyName}
                    </DialogDescription>
                </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tenant">Locataire *</Label>
                                {tenantId ? (
                                    <Input
                                        id="tenant-display"
                                        value={tenantName || ""}
                                        readOnly
                                        className="bg-muted font-medium cursor-default focus-visible:ring-0"
                                    />
                                ) : (
                                    <Select
                                        value={formData.tenant_id}
                                        onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                                    >
                                        <SelectTrigger id="tenant">
                                            <SelectValue placeholder="Sélectionner un locataire" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={tenant.id}>
                                                    {tenant.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="receipt_type">Type de reçu</Label>
                                <Select
                                    value={formData.receipt_type}
                                    onValueChange={(value: ReceiptType) => handleReceiptTypeChange(value)}
                                >
                                    <SelectTrigger id="receipt_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rent">Loyer</SelectItem>
                                        <SelectItem value="deposit">Caution (dépôt de garantie)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isDeposit && heldDeposit ? (
                                <div className="flex gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-200 text-xs leading-relaxed">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>
                                        Une caution de <strong>{formatCurrency(Number(heldDeposit.amount), user?.currency)}</strong> est déjà enregistrée
                                        pour ce locataire sur ce logement (reçu N° {heldDeposit.receipt_number}). Annulez-la ou restituez-la depuis
                                        l'historique du locataire avant d'en émettre une nouvelle.
                                    </p>
                                </div>
                            ) : isDeposit ? (
                                <div className="flex gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-200 text-xs leading-relaxed">
                                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>
                                        La caution n'est pas un loyer : elle n'apparaît pas dans vos revenus, ne marque aucun mois comme payé
                                        et ne compte pas dans votre quota de quittances. Vous enregistrerez sa restitution en fin de bail
                                        depuis l'historique du locataire.
                                    </p>
                                </div>
                            ) : (
                            <div className="space-y-2">
                                <Label htmlFor="period_type">Type de période</Label>
                                <Select
                                    value={formData.period_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, period_type: value })}
                                >
                                    <SelectTrigger id="period_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mois">Mensuel</SelectItem>
                                        <SelectItem value="semaine">Hebdomadaire</SelectItem>
                                        <SelectItem value="jour">Journalier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            )}

                            {isDeposit ? null : formData.period_type === 'mois' ? (
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
                            ) : (
                                <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Date de début</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => {
                                                const start = e.target.value;
                                                const date = new Date(start);
                                                setFormData({ 
                                                    ...formData, 
                                                    start_date: start,
                                                    month: date.getMonth() + 1,
                                                    year: date.getFullYear()
                                                });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">Date de fin</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="amount">{isDeposit ? "Montant de la caution" : "Montant"} ({user?.currency || 'XOF'}) *</Label>
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
                                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={loading || (isDeposit && !!heldDeposit)}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isDeposit ? "Créer le reçu de caution" : "Créer le reçu"}
                                </Button>
                            </DialogFooter>
                        </form>
            </DialogContent>

            <UpgradeModal
                open={upgradeModal.open}
                onOpenChange={(open) => setUpgradeModal(prev => ({ ...prev, open }))}
                title={upgradeModal.title}
                description={upgradeModal.description}
            />
        </Dialog>
    );
};
