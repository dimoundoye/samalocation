import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, CreditCard, ExternalLink, Info, Landmark, Loader2, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getLeasePaymentMethods } from "@/api/paymentMethods";
import { PaymentMethod } from "@/lib/paymentMethods";

interface RentPaymentPanelProps {
    lease: any;
    currency: string;
}

/** Lien Wave avec le montant pré-rempli quand le lien n'en contient pas déjà un. */
const waveLinkWithAmount = (url: string, amount: number) => {
    try {
        const parsed = new URL(url);
        if (!parsed.searchParams.has("amount") && amount > 0) parsed.searchParams.set("amount", String(Math.round(amount)));
        return parsed.toString();
    } catch {
        return url;
    }
};

/**
 * Paiement direct du loyer : coordonnées du bailleur (Wave, Orange Money, virement).
 * Le bailleur génère ensuite le reçu à réception.
 */
export const RentPaymentPanel = ({ lease, currency }: RentPaymentPanelProps) => {
    const { toast } = useToast();
    const rentAmount = parseFloat(lease.monthly_rent) || 0;
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lease?.id || lease.status !== "active") return;
        setLoading(true);
        getLeasePaymentMethods(lease.id)
            .then(data => setMethods(data?.methods || []))
            .catch(() => setMethods([])) // Bloc facultatif : le reste de la fiche du bail reste utilisable
            .finally(() => setLoading(false));
    }, [lease?.id, lease?.status]);

    const copy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast({ title: "Copié", description: value });
        } catch {
            toast({ title: "Copie impossible", description: value, variant: "destructive" });
        }
    };

    if (lease.status !== "active") return null;

    return (
        <div className="border rounded-xl p-4 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payer mon loyer
                </h4>
                <span className="text-sm font-black text-primary">{formatCurrency(rentAmount, currency)}</span>
            </div>

            {loading ? (
                <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            ) : methods.length === 0 ? (
                <div className="text-xs text-muted-foreground bg-white dark:bg-background rounded-lg p-3 border flex gap-2">
                    <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    <p>
                        Votre bailleur n'a pas encore indiqué ses coordonnées de paiement.
                        Contactez-le pour convenir du mode de règlement.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                        Payez directement votre bailleur, sans frais Samalocation :
                    </p>
                    {methods.map((m, i) => (
                        <div key={i} className="bg-white dark:bg-background rounded-lg border p-3 space-y-2">
                            {m.type === "wave_link" && m.url && (
                                <Button asChild className="w-full h-9 text-xs font-semibold bg-[#1dc3ff] hover:bg-[#12b0ea] text-white">
                                    <a href={waveLinkWithAmount(m.url, rentAmount)} target="_blank" rel="noopener noreferrer">
                                        Payer avec Wave <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                                    </a>
                                </Button>
                            )}
                            {(m.type === "wave" || m.type === "orange_money") && m.phone && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                            <Smartphone className="w-3 h-3" /> {m.type === "wave" ? "Wave" : "Orange Money"}
                                        </p>
                                        <p className="text-sm font-bold font-mono">{m.phone}</p>
                                        {m.holder && <p className="text-[11px] text-muted-foreground truncate">{m.holder}</p>}
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => copy(m.phone!)}>
                                        <Copy className="w-3.5 h-3.5" /> Copier
                                    </Button>
                                </div>
                            )}
                            {m.type === "bank" && m.iban && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                            <Landmark className="w-3 h-3" /> Virement{m.bank_name ? ` · ${m.bank_name}` : ""}
                                        </p>
                                        <p className="text-xs font-bold font-mono break-all">{m.iban}</p>
                                        {m.holder && <p className="text-[11px] text-muted-foreground truncate">{m.holder}</p>}
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => copy(m.iban!)}>
                                        <Copy className="w-3.5 h-3.5" /> Copier
                                    </Button>
                                </div>
                            )}
                            {m.instructions && <p className="text-[11px] text-muted-foreground italic">{m.instructions}</p>}
                        </div>
                    ))}
                    <p className="text-[11px] text-muted-foreground flex gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                        Votre reçu apparaîtra ici dès que votre bailleur l'aura généré.
                    </p>
                </div>
            )}
        </div>
    );
};
