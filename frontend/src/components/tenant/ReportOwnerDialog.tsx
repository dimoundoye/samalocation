import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { createReport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReportOwnerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    ownerName: string;
}

export const ReportOwnerDialog = ({ open, onOpenChange, ownerId, ownerName }: ReportOwnerDialogProps) => {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
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
            await createReport(ownerId, reason.trim());

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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Signaler un propriétaire
                    </DialogTitle>
                    <DialogDescription>
                        Vous êtes sur le point de signaler <strong>{ownerName}</strong> à l'administrateur.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motif du signalement *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Décrivez précisément la raison de votre signalement (minimum 10 caractères)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            {reason.length}/10 caractères minimum
                        </p>
                    </div>

                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-3 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            ⚠️ <strong>Attention:</strong> Les signalements abusifs peuvent entraîner des sanctions sur votre compte.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || reason.trim().length < 10}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {submitting ? "Envoi..." : "Envoyer le signalement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
