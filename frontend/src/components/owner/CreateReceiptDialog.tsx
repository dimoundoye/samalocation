import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReceipt, getOwnerTenants, getOwnerContracts, getReceiptBalance } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { isDepositReceipt, isPaidRentReceipt } from "@/lib/deposits";
import { formatCurrency } from "@/lib/utils";
import { ReceiptType, RentPeriodBalance } from "@/types";
import { getRentMonthBalance } from "@/lib/rentBalance";

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
    /** Ouverture depuis le tableau de gérance : type et mois imposés (ex. avis de loyer impayé pour un mois donné) */
    initialReceiptType?: ReceiptFormType;
    initialMonth?: number;
    initialYear?: number;
}

/** Types proposés par le formulaire : loyer, caution, ou avis de loyer impayé */
type ReceiptFormType = ReceiptType | 'notice';

export const CreateReceiptDialog = ({ open, onOpenChange, onSuccess, propertyId, propertyName, tenantId, tenantName, monthlyRent, unitId, receipts = [], initialReceiptType, initialMonth, initialYear }: CreateReceiptDialogProps) => {
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
        receipt_type: 'rent' as ReceiptFormType
    });
    const isDeposit = formData.receipt_type === 'deposit';
    // Avis de loyer impayé : ni montant, ni date, ni mode de paiement ; il réclame le reste dû du mois
    const isNotice = formData.receipt_type === 'notice';
    const hasPresetPeriod = !!initialMonth && !!initialYear;

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

    // Suivi du reste à payer (loyers mensuels) : solde du mois choisi, loyer dû modifiable
    const [balance, setBalance] = useState<RentPeriodBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [rentDueInput, setRentDueInput] = useState("");
    const tracksBalance = !isDeposit && (isNotice || formData.period_type === 'mois');

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
                amount: Number(monthlyRent) > 0 ? String(Number(monthlyRent)) : prev.amount,
                ...(initialReceiptType ? { receipt_type: initialReceiptType } : {}),
                ...(initialReceiptType === 'notice' ? { period_type: 'mois' as const } : {}),
                ...(hasPresetPeriod ? { month: initialMonth!, year: initialYear! } : {})
            }));
        }
    }, [open, propertyId, tenantId, monthlyRent, initialReceiptType, initialMonth, initialYear]);

    // Effect to auto-fill month, year and amount when tenant changes
    useEffect(() => {
        if (!formData.tenant_id) return;

        const selectedTenant = tenants.find(t => t.id === formData.tenant_id);

        // Période et montant d'après la fiche du locataire. En loyer mensuel, le montant vient du solde du mois
        // (reste à payer, avec repli sur le loyer du logement) : on ne l'écrase pas ici. Le loyer de la fiche
        // arrive du serveur en texte (« 0.00 » est non vide) : il n'est utilisé que s'il est positif.
        if (selectedTenant) {
            const tenantRent = Number(selectedTenant.monthly_rent);
            const tenantPeriod = selectedTenant.rent_period || 'mois';
            setFormData(prev => prev.receipt_type === 'notice' ? prev : ({
                ...prev,
                amount: tenantPeriod !== 'mois' && tenantRent > 0 ? String(tenantRent) : prev.amount,
                period_type: tenantPeriod
            }));
        }

        // Mois imposé à l'ouverture (raccourci du tableau de gérance) : pas de suggestion
        if (hasPresetPeriod) return;

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

                // Mois suivant, sauf si le dernier mois n'est pas soldé : on propose d'en régler le reste
                const latestMonthReceipts = tenantReceipts.filter(r => r.year === latest.year && r.month === latest.month);
                const latestIsPartial = getRentMonthBalance(latestMonthReceipts).isDue;
                let nextMonth = latestIsPartial ? latest.month : latest.month + 1;
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
    }, [formData.tenant_id, tenants, receipts, hasPresetPeriod]);

    // Solde du mois : loyer dû, déjà versé ; le montant proposé est le reste à payer
    useEffect(() => {
        if (!open || !tracksBalance || !formData.tenant_id) {
            setBalance(null);
            return;
        }
        const selectedTenant = tenants.find(t => t.id === formData.tenant_id);
        const balanceTenantId = formData.tenant_id === 'temp' ? (tenantId || "") : formData.tenant_id;
        if (!balanceTenantId) return;

        let cancelled = false;
        setBalanceLoading(true);
        getReceiptBalance({
            tenant_id: balanceTenantId,
            property_id: propertyId,
            unit_id: unitId || selectedTenant?.unit_id || null,
            month: Number(formData.month),
            year: Number(formData.year)
        })
            .then(result => {
                if (cancelled) return;
                setBalance(result);
                setRentDueInput(result.rent_due !== null ? String(result.rent_due) : "");
                if (result.remaining !== null && result.remaining > 0) {
                    setFormData(prev => prev.receipt_type === 'notice' ? prev : ({ ...prev, amount: String(result.remaining) }));
                }
            })
            .catch(() => {
                // Solde indisponible : le formulaire reste utilisable comme avant
                if (!cancelled) setBalance(null);
            })
            .finally(() => {
                if (!cancelled) setBalanceLoading(false);
            });
        return () => { cancelled = true; };
    }, [open, tracksBalance, formData.tenant_id, formData.month, formData.year, tenants, propertyId, unitId, tenantId]);

    const rentDueValue = rentDueInput === "" ? null : Number(rentDueInput);
    const hasRentDue = tracksBalance && balance !== null && rentDueValue !== null && rentDueValue > 0;
    const alreadyPaid = balance?.paid ?? 0;
    const remainingBefore = hasRentDue ? Math.max(rentDueValue! - alreadyPaid, 0) : null;
    const paidNow = isNotice ? 0 : (Number(formData.amount) || 0);
    const remainingAfter = hasRentDue ? Math.max(rentDueValue! - alreadyPaid - paidNow, 0) : null;
    const monthAlreadySettled = remainingBefore !== null && remainingBefore <= 0;
    const amountTooHigh = !isNotice && remainingBefore !== null && remainingBefore > 0 && paidNow > remainingBefore;
    // Un reçu de loyer porte un versement : pour signaler un impayé, on choisit le type « Avis de loyer impayé »
    const zeroAmountBlocked = !isNotice && !isDeposit && formData.amount !== "" && Number(formData.amount) === 0;
    // Avis : il faut un loyer dû connu (pré-rempli, modifiable)
    const noticeMissingRent = isNotice && !balanceLoading && !hasRentDue;

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

    const handleReceiptTypeChange = async (value: ReceiptFormType) => {
        if (value === 'notice') {
            setFormData(prev => ({ ...prev, receipt_type: 'notice', period_type: 'mois' }));
            return;
        }
        if (value === 'rent') {
            setFormData(prev => ({ ...prev, receipt_type: 'rent', amount: Number(monthlyRent) > 0 ? String(Number(monthlyRent)) : prev.amount }));
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

        if (!formData.tenant_id || (!isNotice && !formData.amount)) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir tous les champs obligatoires",
                variant: "destructive"
            });
            return;
        }

        // Les reçus de caution ne comptent pas dans le quota de quittances
        // Un versement de plus sur un mois déjà entamé ne compte pas dans le quota
        const continuesMonth = tracksBalance && (balance?.payments_count ?? 0) > 0;
        if (!isDeposit && !isNotice && !continuesMonth && subscription && subscription.receipts_this_month >= subscription.receipts_limit && subscription.receipts_limit !== -1 && subscription.receipts_limit !== Infinity) {
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
                amount: isNotice ? 0 : Number(formData.amount),
                month: Number(formData.month),
                year: Number(formData.year),
                start_date: !isDeposit && formData.period_type !== 'mois' ? formData.start_date : undefined,
                end_date: !isDeposit && formData.period_type !== 'mois' ? formData.end_date : undefined,
                rent_due: hasRentDue ? rentDueValue! : undefined,
            });

            const isPartial = remainingAfter !== null && remainingAfter > 0;
            toast({
                title: isDeposit ? "Reçu de caution créé" : isNotice ? "Avis de loyer impayé envoyé" : isPartial ? "Reçu d'acompte créé" : "Reçu créé",
                description: isDeposit
                    ? "Le reçu de caution a été créé. Vous pourrez enregistrer sa restitution depuis l'historique du locataire."
                    : isNotice
                        ? `Le locataire est notifié du montant à régler (${formatCurrency(remainingAfter ?? 0, user?.currency)}). Le mois apparaît dans votre reste à encaisser.`
                    : isPartial
                        ? `Reste à payer pour ce mois : ${formatCurrency(remainingAfter!, user?.currency)}. Il apparaît dans votre tableau de suivi.`
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
        setBalance(null);
        setRentDueInput("");
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

    // Années proposées : de 4 ans en arrière jusqu'à 2 ans en avance, en incluant toujours l'année choisie
    // (le mois suggéré après un reçu de décembre peut tomber l'année suivante)
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(currentYear + 2, Number(formData.year) || currentYear);
    const minYear = Math.min(currentYear - 4, Number(formData.year) || currentYear);
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>{isNotice ? "Envoyer un avis de loyer impayé" : isDeposit ? "Créer un reçu de caution" : "Créer un reçu de paiement"}</DialogTitle>
                    <DialogDescription>
                        {isNotice ? `Réclamer le loyer d'un mois au locataire de ${propertyName}` : `Générer un reçu PDF pour le locataire de ${propertyName}`}
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
                                    onValueChange={(value: ReceiptFormType) => handleReceiptTypeChange(value)}
                                >
                                    <SelectTrigger id="receipt_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rent">Loyer</SelectItem>
                                        <SelectItem value="deposit">Caution (dépôt de garantie)</SelectItem>
                                        <SelectItem value="notice">Avis de loyer impayé</SelectItem>
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
                            ) : isNotice ? (
                                <div className="flex gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-200 text-xs leading-relaxed">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>
                                        L'avis réclame au locataire le loyer du mois choisi, ou ce qu'il en reste après un acompte.
                                        Il n'enregistre aucun paiement. Le PDF indique l'échéance prévue au bail et vos moyens de paiement.
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

                            {!isNotice && (
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
                            )}

                            {tracksBalance && balance && (
                                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                                    <div className="grid grid-cols-2 gap-3 items-end">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="rent_due" className="text-xs">Loyer dû pour le mois</Label>
                                            <Input
                                                id="rent_due"
                                                type="number"
                                                min={0}
                                                value={rentDueInput}
                                                onChange={(e) => setRentDueInput(e.target.value)}
                                                placeholder="Loyer du mois"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-muted-foreground">Déjà versé ce mois</p>
                                            <p className="h-10 flex items-center font-semibold">
                                                {balanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(alreadyPaid, user?.currency)}
                                            </p>
                                        </div>
                                    </div>

                                    {monthAlreadySettled ? (
                                        <div className="flex gap-2 items-start text-xs text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            <p>Ce mois est déjà entièrement réglé. Choisissez un autre mois, ou corrigez le loyer dû s'il a changé.</p>
                                        </div>
                                    ) : isNotice && remainingAfter !== null ? (
                                        <div className="flex justify-between items-center text-sm font-semibold text-red-700 dark:text-red-400">
                                            <span>Montant à régler</span>
                                            <span>{formatCurrency(remainingAfter, user?.currency)}</span>
                                        </div>
                                    ) : zeroAmountBlocked ? (
                                        <div className="flex gap-2 items-start text-xs text-red-700 dark:text-red-400">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <p>Le montant doit être supérieur à 0. Pour signaler un loyer non payé, choisissez le type « Avis de loyer impayé ».</p>
                                        </div>
                                    ) : amountTooHigh ? (
                                        <div className="flex gap-2 items-start text-xs text-red-700 dark:text-red-400">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <p>Le montant dépasse le reste à payer ({formatCurrency(remainingBefore!, user?.currency)}).</p>
                                        </div>
                                    ) : remainingAfter !== null ? (
                                        <div className={`flex justify-between items-center text-sm font-semibold ${remainingAfter > 0 ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                                            <span>Reste à payer après ce versement</span>
                                            <span>{formatCurrency(remainingAfter, user?.currency)}</span>
                                        </div>
                                    ) : null}

                                    {noticeMissingRent ? (
                                        <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed">
                                            Indiquez le loyer dû du mois pour émettre l'avis.
                                        </p>
                                    ) : !isNotice && remainingAfter !== null && remainingAfter > 0 && !amountTooHigh && !zeroAmountBlocked && (
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Un <strong>reçu d'acompte</strong> sera émis avec le reste à payer. La quittance sera émise au dernier versement du mois.
                                        </p>
                                    )}
                                </div>
                            )}

                            {!isNotice && (<>
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
                            </>)}

                            <div className="space-y-2">
                                <Label htmlFor="notes">{isNotice ? "Message au locataire (optionnel)" : "Notes (optionnel)"}</Label>
                                <Textarea
                                    id="notes"
                                    placeholder={isNotice ? "Ex. : merci de régler avant la fin du mois." : "Informations complémentaires..."}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    variant={isNotice ? "destructive" : "default"}
                                    disabled={loading || (isDeposit && !!heldDeposit) || (tracksBalance && (monthAlreadySettled || amountTooHigh)) || zeroAmountBlocked || (isNotice && (balanceLoading || noticeMissingRent))}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isNotice ? "Envoyer l'avis" : isDeposit ? "Créer le reçu de caution" : "Créer le reçu"}
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
