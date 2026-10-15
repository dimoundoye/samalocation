import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { getMyPaymentMethods, updateMyPaymentMethods } from "@/api/paymentMethods";
import { METHOD_TYPE_LABELS, PaymentMethod, PaymentMethodType } from "@/lib/paymentMethods";

const MAX_METHODS = 6;

/**
 * Coordonnées où les locataires paient directement le loyer (Wave, Orange Money, virement).
 * Samalocation ne touche jamais l'argent.
 */
export const OwnerPaymentMethodsCard = () => {
    const { toast } = useToast();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newType, setNewType] = useState<PaymentMethodType>("wave");

    useEffect(() => {
        getMyPaymentMethods()
            .then(data => setMethods(data?.methods || []))
            .catch(() => toast({ title: "Erreur", description: "Impossible de charger vos coordonnées de paiement.", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, []);

    const update = (index: number, patch: Partial<PaymentMethod>) => {
        setMethods(prev => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await updateMyPaymentMethods(methods);
            setMethods(saved?.methods || methods);
            toast({ title: "Coordonnées enregistrées", description: "Vos locataires les voient dans leur espace, avec le montant de leur loyer." });
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Moyens de paiement du loyer
                </CardTitle>
                <CardDescription>
                    Vos locataires voient ces coordonnées dans leur espace et vous paient directement.
                    Vous générez ensuite le reçu comme d'habitude. Samalocation ne touche jamais l'argent.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                    <>
                        {methods.length === 0 && (
                            <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                                Aucun moyen de paiement. Ajoutez votre numéro Wave, Orange Money ou votre RIB.
                            </p>
                        )}

                        {methods.map((method, index) => (
                            <div key={index} className="rounded-xl border p-4 space-y-3 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{METHOD_TYPE_LABELS[method.type]}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => setMethods(prev => prev.filter((_, i) => i !== index))}
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {method.type === "wave_link" && (
                                    <div className="space-y-1.5">
                                        <Label>Lien Wave</Label>
                                        <Input
                                            placeholder="https://pay.wave.com/m/..."
                                            value={method.url || ""}
                                            onChange={e => update(index, { url: e.target.value })}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Dans l'application Wave Business : « Recevoir un paiement » puis copier le lien.
                                        </p>
                                    </div>
                                )}

                                {(method.type === "wave" || method.type === "orange_money") && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Numéro</Label>
                                            <Input
                                                inputMode="tel"
                                                placeholder="77 123 45 67"
                                                value={method.phone || ""}
                                                onChange={e => update(index, { phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Nom affiché sur le compte</Label>
                                            <Input
                                                placeholder="Ex : Moussa Diop"
                                                value={method.holder || ""}
                                                onChange={e => update(index, { holder: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {method.type === "bank" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Titulaire du compte *</Label>
                                            <Input value={method.holder || ""} onChange={e => update(index, { holder: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Banque</Label>
                                            <Input placeholder="Ex : CBAO" value={method.bank_name || ""} onChange={e => update(index, { bank_name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label>RIB / IBAN *</Label>
                                            <Input className="font-mono" value={method.iban || ""} onChange={e => update(index, { iban: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label>Consigne pour le locataire (facultatif)</Label>
                                    <Input
                                        placeholder="Ex : indiquer le numéro de l'appartement en référence"
                                        value={method.instructions || ""}
                                        onChange={e => update(index, { instructions: e.target.value })}
                                    />
                                </div>
                            </div>
                        ))}

                        {methods.length < MAX_METHODS && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select value={newType} onValueChange={(v: PaymentMethodType) => setNewType(v)}>
                                    <SelectTrigger className="sm:w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(METHOD_TYPE_LABELS) as PaymentMethodType[]).map(type => (
                                            <SelectItem key={type} value={type}>{METHOD_TYPE_LABELS[type]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" className="gap-2" onClick={() => setMethods(prev => [...prev, { type: newType }])}>
                                    <Plus className="h-4 w-4" /> Ajouter
                                </Button>
                            </div>
                        )}

                        <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground leading-relaxed">
                            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p>
                                Ces coordonnées ne sont visibles que par vos locataires ayant un bail actif, jamais sur votre profil public.
                                Ils sont prévenus à chaque modification, pour déjouer les tentatives de détournement.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Enregistrer
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
