import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2, DollarSign, Calendar, FileText, Tag, Folder, Home, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createExpense, updateExpense, ExpenseItem } from "@/api/expenses";
import { uploadPhotos } from "@/lib/api";
import { getPropertyGroups } from "@/api/propertyGroups";

interface AddExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    expenseToEdit?: ExpenseItem | null;
    properties: { id: string; name: string }[];
    customGroups: { id: string; name: string; propertyIds: string[]; parentId?: string }[];
}

export const CATEGORIES = [
    { value: "maintenance", label: "🛠️ Maintenance & Réparations" },
    { value: "cleaning", label: "🧹 Ménage & Entretien" },
    { value: "utilities", label: "⚡ Eau, Électricité, Internet" },
    { value: "agency_fees", label: "🤝 Frais d'Agence & Gestion" },
    { value: "copro_charges", label: "🏢 Charges de Copropriété / Syndic" },
    { value: "taxes", label: "🏛️ Taxes & Impôts Fonciers" },
    { value: "insurance", label: "🛡️ Assurance (PNO, GLI)" },
    { value: "other", label: "📦 Autre dépense" },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    expenseToEdit,
    properties,
    customGroups
}) => {
    const { toast } = useToast();
    const [targetType, setTargetType] = useState<"property" | "group" | "global">("property");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [category, setCategory] = useState<string>("maintenance");
    const [amount, setAmount] = useState<string>("");
    const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [recurrencePeriod, setRecurrencePeriod] = useState<string>("mensuel");
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (expenseToEdit) {
            setCategory(expenseToEdit.category || "maintenance");
            setAmount(expenseToEdit.amount?.toString() || "");
            setExpenseDate(expenseToEdit.expense_date ? new Date(expenseToEdit.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setDescription(expenseToEdit.description || "");
            setExistingReceiptUrl(expenseToEdit.receipt_url || null);
            setIsRecurring(!!expenseToEdit.is_recurring);
            setRecurrencePeriod(expenseToEdit.recurrence_period || "mensuel");

            if (expenseToEdit.property_id) {
                setTargetType("property");
                setSelectedPropertyId(expenseToEdit.property_id);
            } else if (expenseToEdit.group_id) {
                setTargetType("group");
                setSelectedGroupId(expenseToEdit.group_id);
            } else {
                setTargetType("global");
            }
        } else {
            resetForm();
        }
    }, [expenseToEdit, open, properties]);

    useEffect(() => {
        if (open && !expenseToEdit && properties.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(properties[0].id);
        }
    }, [open, properties, expenseToEdit, selectedPropertyId]);

    const resetForm = () => {
        setTargetType("property");
        setSelectedPropertyId(properties[0]?.id || "");
        setSelectedGroupId("");
        setCategory("maintenance");
        setAmount("");
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setDescription("");
        setReceiptFile(null);
        setReceiptPreview(null);
        setExistingReceiptUrl(null);
        setIsRecurring(false);
        setRecurrencePeriod("mensuel");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setReceiptFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setReceiptPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({
                title: "Montant invalide",
                description: "Veuillez saisir un montant valide et supérieur à zéro.",
                variant: "destructive"
            });
            return;
        }

        try {
            setSubmitting(true);
            let receiptUrl = existingReceiptUrl;

            if (receiptFile) {
                const uploadedUrls = await uploadPhotos([receiptFile]);
                if (uploadedUrls && uploadedUrls.length > 0) {
                    receiptUrl = uploadedUrls[0];
                }
            }

            const payload: Partial<ExpenseItem> = {
                category,
                amount: numAmount,
                expense_date: expenseDate,
                description: description.trim() || null,
                receipt_url: receiptUrl,
                is_recurring: isRecurring,
                recurrence_period: isRecurring ? recurrencePeriod : 'mensuel',
                property_id: targetType === 'property' && selectedPropertyId ? selectedPropertyId : null,
                group_id: targetType === 'group' && selectedGroupId ? selectedGroupId : null
            };

            if (expenseToEdit) {
                await updateExpense(expenseToEdit.id, payload);
                toast({
                    title: "Dépense mise à jour",
                    description: "Les modifications ont été enregistrées avec succès."
                });
            } else {
                await createExpense(payload);
                toast({
                    title: "Dépense enregistrée",
                    description: "La nouvelle dépense a été ajoutée à votre trésorerie."
                });
            }

            onSuccess();
            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            console.error("Erreur d'enregistrement de la dépense:", err);
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer la dépense.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span>{expenseToEdit ? "Modifier la dépense" : "Ajouter une dépense"}</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Niveau d'affectation */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Affecter cette dépense à :</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetType("property")}
                                className={`p-2 rounded-lg border text-center transition-all text-xs font-medium ${
                                    targetType === "property"
                                        ? "border-primary bg-primary/10 text-primary font-bold"
                                        : "hover:bg-muted/50 bg-background"
                                }`}
                            >
                                <Home className="h-4 w-4 mx-auto mb-1" />
                                Un bien
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType("group")}
                                className={`p-2 rounded-lg border text-center transition-all text-xs font-medium ${
                                    targetType === "group"
                                        ? "border-primary bg-primary/10 text-primary font-bold"
                                        : "hover:bg-muted/50 bg-background"
                                }`}
                            >
                                <Folder className="h-4 w-4 mx-auto mb-1" />
                                Un dossier
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType("global")}
                                className={`p-2 rounded-lg border text-center transition-all text-xs font-medium ${
                                    targetType === "global"
                                        ? "border-primary bg-primary/10 text-primary font-bold"
                                        : "hover:bg-muted/50 bg-background"
                                }`}
                            >
                                <Layers className="h-4 w-4 mx-auto mb-1" />
                                Global
                            </button>
                        </div>
                    </div>

                    {/* Sélection du bien ou du dossier */}
                    {targetType === "property" && (
                        <div className="space-y-1">
                            <Label htmlFor="expense-property" className="text-xs">Sélectionner le bien *</Label>
                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                <SelectTrigger id="expense-property">
                                    <SelectValue placeholder="Choisir un bien..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === "group" && (
                        <div className="space-y-1">
                            <Label htmlFor="expense-group" className="text-xs">Sélectionner le dossier / immeuble *</Label>
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger id="expense-group">
                                    <SelectValue placeholder="Choisir un dossier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customGroups.map(g => (
                                        <SelectItem key={g.id} value={g.id}>📁 {g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Catégorie */}
                    <div className="space-y-1">
                        <Label htmlFor="expense-category" className="text-xs">Catégorie de dépense *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="expense-category">
                                <SelectValue placeholder="Choisir une catégorie..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Montant & Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="expense-amount" className="text-xs">Montant (FCFA) *</Label>
                            <Input
                                id="expense-amount"
                                type="number"
                                placeholder="ex: 25000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="expense-date" className="text-xs">Date de paiement *</Label>
                            <Input
                                id="expense-date"
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <Label htmlFor="expense-desc" className="text-xs">Description / Remarques (Optionnel)</Label>
                        <Textarea
                            id="expense-desc"
                            placeholder="ex: Remplacement du robinet de la cuisine par le plombier..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Reçu / Justificatif */}
                    <div className="space-y-1">
                        <Label className="text-xs">Reçu / Justificatif (Photo ou PDF)</Label>
                        <div className="mt-1">
                            {receiptPreview || existingReceiptUrl ? (
                                <div className="relative border rounded-lg p-2 flex items-center justify-between bg-muted/30">
                                    <span className="text-xs truncate max-w-[200px] font-medium text-primary">
                                        📄 Justificatif joint
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setReceiptFile(null);
                                            setReceiptPreview(null);
                                            setExistingReceiptUrl(null);
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <Input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                    className="text-xs cursor-pointer"
                                />
                            )}
                        </div>
                    </div>

                    {/* Récurrence */}
                    <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="expense-recurring"
                                checked={isRecurring}
                                onCheckedChange={(chk) => setIsRecurring(!!chk)}
                            />
                            <label htmlFor="expense-recurring" className="text-xs font-medium cursor-pointer">
                                Dépense récurrente (automatique chaque période)
                            </label>
                        </div>

                        {isRecurring && (
                            <div className="pl-6 pt-1 animate-in fade-in duration-200">
                                <Label htmlFor="expense-period" className="text-xs">Périodicité</Label>
                                <Select value={recurrencePeriod} onValueChange={setRecurrencePeriod}>
                                    <SelectTrigger id="expense-period" className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mensuel">Mensuelle (tous les mois)</SelectItem>
                                        <SelectItem value="trimestriel">Trimestrielle (tous les 3 mois)</SelectItem>
                                        <SelectItem value="annuel">Annuelle (tous les ans)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {expenseToEdit ? "Enregistrer" : "Ajouter la dépense"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
