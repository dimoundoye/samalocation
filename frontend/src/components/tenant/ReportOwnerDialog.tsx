import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createReport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReportOwnerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId?: string;
    ownerName?: string;
    leases?: any[];
}

export const ReportOwnerDialog = ({ open, onOpenChange, ownerId, ownerName, leases = [] }: ReportOwnerDialogProps) => {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>(ownerId || "");

    // If there's only one lease/owner or a pre-selected ownerId, use it
    const defaultOwnerId = ownerId || (leases.length === 1 ? leases[0].owner_id : "");
    const currentSelectedId = selectedOwnerId || defaultOwnerId;

    const selectedLease = leases.find(l => l.owner_id === currentSelectedId);
    const displayName = selectedLease
        ? (selectedLease.owner_name || "le propriétaire")
        : (ownerName || "le propriétaire");

    const handleSubmit = async () => {
        if (!currentSelectedId) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner un propriétaire à signaler",
                variant: "destructive",
            });
            return;
        }

        if (reason.trim().length < 10) {
            toast({
                title: "Erreur",
                description: "Le motif doit contenir au moins 10 caractères",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            await createReport(currentSelectedId, reason.trim());

            toast({
                title: "Signalement envoyé",
                description: "Votre signalement a été transmis à l'administrateur",
            });

            setReason("");
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'envoyer le signalement",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-strong p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20" />
                <DialogHeader className="space-y-3">
                    <div className="mx-auto bg-red-50 p-4 rounded-2xl w-fit mb-2">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-primary tracking-tight">
                        Signaler un propriétaire
                    </DialogTitle>
                    <DialogDescription className="text-center text-balance">
                        {leases.length > 1 ? (
                            "Choisissez le propriétaire concerné par votre signalement parmi vos baux actifs."
                        ) : (
                            <>Vous êtes sur le point de signaler <strong>{displayName}</strong> à l'administrateur.</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {leases.length > 1 && (
                        <div className="space-y-2">
                            <Label htmlFor="owner-select" className="text-xs uppercase font-bold tracking-wider text-muted-foreground ml-1">Propriétaire à signaler *</Label>
                            <Select
                                value={currentSelectedId}
                                onValueChange={setSelectedOwnerId}
                            >
                                <SelectTrigger id="owner-select" className="h-14 rounded-2xl border-primary/10 bg-primary/5 focus:ring-red-500/20 focus:border-red-500/50 transition-all font-semibold">
                                    <SelectValue placeholder="Sélectionnez un propriétaire" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] rounded-2xl border-primary/10 shadow-strong">
                                    {Array.from(new Set(leases.map(l => l.owner_id))).map((uniqueOwnerId) => {
                                        const firstLease = leases.find(l => l.owner_id === uniqueOwnerId);
                                        return (
                                            <SelectItem key={uniqueOwnerId} value={uniqueOwnerId || ""} className="rounded-xl focus:bg-red-50 focus:text-red-900 transition-colors py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{firstLease?.owner_name || "Propriétaire"}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {leases.filter(l => l.owner_id === uniqueOwnerId).length} logement(s) concerné(s)
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs uppercase font-bold tracking-wider text-muted-foreground ml-1">Motif du signalement {leases.length > 1 && `pour ${displayName}`} *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Décrivez précisément la raison de votre signalement (comportement, impayé, problème technique persistant)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            className="resize-none rounded-2xl border-primary/10 bg-primary/5 focus:ring-red-500/20 focus:border-red-500/50 transition-all p-4"
                        />
                        <div className="flex justify-between items-center px-1">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${reason.length < 10 ? 'text-muted-foreground' : 'text-green-600'}`}>
                                {reason.length}/10 caractères min.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100 shadow-inner">
                        <p className="text-xs text-orange-800 leading-relaxed text-center italic">
                            ⚠️ <strong>Attention:</strong> Les signalements abusifs peuvent entraîner la suspension de votre accès à la plateforme.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="rounded-xl flex-1 h-12 font-bold hover:bg-slate-100 transition-colors"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || reason.trim().length < 10}
                        className="rounded-xl flex-1 h-12 font-bold bg-red-600 hover:bg-red-700 shadow-strong shadow-red-500/20 text-white border-none transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {submitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : "Envoyer le signalement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
