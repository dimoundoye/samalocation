import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { settleDeposit } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Receipt } from "@/types";

type Outcome = "full" | "partial" | "retained";

interface DeductionRow {
    label: string;
    amount: string;
}

interface DepositSettlementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receipt: Receipt | null;
    currency?: string;
    onSuccess?: () => void;
}

const OUTCOMES: { value: Outcome; title: string; description: string }[] = [
    { value: "full", title: "Restitution totale", description: "Toute la caution est rendue au locataire." },
    { value: "partial", title: "Restitution partielle", description: "Des retenues motivées sont déduites, le reste est rendu." },
    { value: "retained", title: "Retenue en totalité", description: "Les retenues absorbent toute la caution, rien n'est rendu." },
];

const emptyRow = (): DeductionRow => ({ label: "", amount: "" });

/**
 * Enregistre la restitution d'une caution en fin de bail et produit le décompte (PDF) côté serveur
 */
export const DepositSettlementDialog = ({ open, onOpenChange, receipt, currency, onSuccess }: DepositSettlementDialogProps) => {
    const { toast } = useToast();
    const [outcome, setOutcome] = useState<Outcome>("full");
    const [rows, setRows] = useState<DeductionRow[]>([emptyRow()]);
    const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState("virement");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setOutcome("full");
            setRows([emptyRow()]);
            setSettlementDate(new Date().toISOString().split("T")[0]);
            setPaymentMethod("virement");
            setNotes("");
        }
    }, [open]);

    const depositAmount = Number(receipt?.amount) || 0;
    const deductions = outcome === "full" ? [] : rows;
    const retained = deductions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const refunded = depositAmount - retained;

    const updateRow = (index: number, patch: Partial<DeductionRow>) =>
        setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    const validationError = (() => {
        if (outcome === "full") return null;
        const filled = rows.filter(r => r.label.trim() || Number(r.amount) > 0);
        if (filled.length === 0) return "Ajoutez au moins une retenue avec son motif et son montant.";
        if (filled.some(r => !r.label.trim())) return "Chaque retenue doit avoir un motif.";
        if (filled.some(r => !(Number(r.amount) > 0))) return "Chaque retenue doit avoir un montant positif.";
        if (retained > depositAmount) return "Les retenues dépassent le montant de la caution.";
        if (outcome === "partial" && retained >= depositAmount) return "Les retenues absorbent toute la caution : choisissez « Retenue en totalité ».";
        if (outcome === "retained" && retained !== depositAmount) return `Pour une retenue totale, les retenues doivent égaler la caution (${formatCurrency(depositAmount, currency)}).`;
        return null;
    })();

    const handleSubmit = async () => {
        if (!receipt || validationError) return;
        try {
            setSaving(true);
            await settleDeposit(receipt.id, {
                deductions: deductions
                    .filter(r => r.label.trim() && Number(r.amount) > 0)
                    .map(r => ({ label: r.label.trim(), amount: Number(r.amount) })),
                settlement_date: settlementDate,
                payment_method: refunded > 0 ? paymentMethod : undefined,
                notes: notes.trim() || undefined,
            });
            toast({
                title: "Restitution enregistrée",
                description: "Le décompte de restitution est disponible dans l'historique du locataire.",
            });
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Restitution impossible",
                description: error instanceof Error ? error.message : "Impossible d'enregistrer la restitution.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Undo2 className="h-5 w-5 text-primary" />
                        Restituer la caution
                    </DialogTitle>
                    <DialogDescription>
                        Caution N° {receipt?.receipt_number} — {formatCurrency(depositAmount, currency)} versés
                        {receipt?.payment_date ? ` le ${new Date(receipt.payment_date).toLocaleDateString("fr-FR")}` : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-1">
                    <div className="grid gap-2">
                        {OUTCOMES.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setOutcome(option.value);
                                    if (option.value === "retained" && rows.length === 1 && !rows[0].amount) {
                                        updateRow(0, { amount: String(depositAmount) });
                                    }
                                }}
                                className={`text-left rounded-xl border-2 p-3 transition-colors ${
                                    outcome === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                }`}
                            >
                                <p className="font-semibold text-sm">{option.title}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                            </button>
                        ))}
                    </div>

                    {outcome !== "full" && (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Retenues (motif et montant) *</Label>
                            {rows.map((row, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        placeholder="ex : Peinture du salon, loyer impayé…"
                                        value={row.label}
                                        maxLength={200}
                                        onChange={e => updateRow(index, { label: e.target.value })}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Montant"
                                        value={row.amount}
                                        onChange={e => updateRow(index, { amount: e.target.value })}
                                        className="w-28 sm:w-36"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => setRows(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptyRow()]))}
                                        title="Retirer cette retenue"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setRows(prev => [...prev, emptyRow()])}>
                                <Plus className="h-3.5 w-3.5" />
                                Ajouter une retenue
                            </Button>
                        </div>
                    )}

                    <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Caution versée</span>
                            <span className="font-medium">{formatCurrency(depositAmount, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total des retenues</span>
                            <span className="font-medium text-rose-600">- {formatCurrency(retained, currency)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5">
                            <span className="font-semibold">Montant rendu au locataire</span>
                            <span className={`font-bold ${refunded < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {formatCurrency(Math.max(refunded, 0), currency)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="settlement_date" className="text-xs font-semibold">Date de restitution *</Label>
                            <Input id="settlement_date" type="date" value={settlementDate} onChange={e => setSettlementDate(e.target.value)} />
                        </div>
                        {refunded > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Mode de remboursement</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
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
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="settlement_notes" className="text-xs font-semibold">Remarques (optionnel)</Label>
                        <Textarea
                            id="settlement_notes"
                            placeholder="ex : État des lieux de sortie du 07/10, clés rendues…"
                            value={notes}
                            maxLength={1000}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {validationError && <p className="text-xs text-rose-600">{validationError}</p>}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || !!validationError || !settlementDate}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer la restitution
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
