import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { createContract, getOwnerTenants } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, User, MapPin, ClipboardList, Info, AlertTriangle, PlusCircle, X, FileText, CheckCircle2, Crown, Zap, Lock } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

interface CreateContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    propertyId: string;
    propertyName: string;
    tenantId?: string; // Pre-selected user_id
    tenantName?: string;
    monthlyRent?: number;
}

const INVENTORY_ITEMS = [
    "Climatisation", "Chauffe-eau", "Cuisine équipée", "Réfrigérateur",
    "Lave-linge", "Meubles de salon", "Literie", "Placards", "Peinture",
    "Vitrage", "Serrures", "Électricité (prises/interrupteurs)"
];

export const CreateContractDialog = ({ open, onOpenChange, onSuccess, propertyId, propertyName, tenantId, tenantName, monthlyRent }: CreateContractDialogProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({
        tenant_id: "",
        property_id: propertyId,
        unit_id: "",
        start_date: new Date().toISOString().split('T')[0],
        duration_months: 12,
        rent_amount: monthlyRent ? String(monthlyRent) : "",
        deposit_amount: monthlyRent ? String(monthlyRent * 2) : "",
        payment_day: 5,
        payment_method: "virement",
        notes: "",
        contract_type: "standard",
        // Legal Identity
        owner_id_type: "CNI",
        owner_id_number: "",
        owner_id_date: "",
        owner_dob: "",
        owner_birthplace: "",
        tenant_id_type: "CNI",
        tenant_id_number: "",
        tenant_id_date: "",
        tenant_dob: "",
        tenant_birthplace: "",
        // Property details
        detailed_address: "",
        occupancy_limit: "4",
        charges_description: "Eau, Électricité, Charges communes",
        // Inventory
        inventory: {} as Record<string, string>
    });

    const [activeTab, setActiveTab] = useState("general");
    const [customItem, setCustomItem] = useState("");
    const [customItems, setCustomItems] = useState<string[]>([]);
    const [showLegalReminder, setShowLegalReminder] = useState(true);
    const { hasFeature } = useSubscription();
    const canInventory = hasFeature('inventory_contract');
    const [upgradeModal, setUpgradeModal] = useState({
        open: false,
        title: "",
        description: ""
    });

    const tabs = ["general", "parties", "property"];
    if (formData.contract_type === 'premium') tabs.push("premium");

    const isLastTab = activeTab === tabs[tabs.length - 1];
    const isFirstTab = activeTab === tabs[0];

    const isTabValid = () => {
        switch (activeTab) {
            case "general":
                return !!formData.tenant_id && !!formData.start_date && !!formData.rent_amount;
            case "parties":
                return !!formData.owner_id_number && !!formData.tenant_id_number;
            case "property":
                return !!formData.detailed_address;
            case "premium":
                return true;
            default:
                return true;
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    };

    useEffect(() => {
        if (open) {
            loadTenants();
            if (tenantId) {
                setFormData(prev => ({
                    ...prev,
                    tenant_id: tenantId,
                    rent_amount: monthlyRent ? String(monthlyRent) : prev.rent_amount,
                    deposit_amount: monthlyRent ? String(monthlyRent * 2) : prev.deposit_amount
                }));
            }
        }
    }, [open, tenantId, propertyId, monthlyRent]);

    const loadTenants = async () => {
        try {
            const data = await getOwnerTenants();
            const filtered = propertyId ? data.filter((t: any) => t.property_id === propertyId) : data;
            setTenants(filtered);

            if (tenantId) {
                const current = filtered.find((t: any) => t.user_id === tenantId);
                if (current) {
                    setFormData(prev => ({
                        ...prev,
                        unit_id: current.unit_id,
                        property_id: current.property_id,
                        detailed_address: current.property_address || ""
                    }));
                }
            }
        } catch (error) {
            console.error("Error loading tenants:", error);
        }
    };

    useEffect(() => {
        const selected = tenants.find(t => t.user_id === formData.tenant_id);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                unit_id: selected.unit_id,
                property_id: selected.property_id,
                rent_amount: String(selected.monthly_rent || prev.rent_amount),
                detailed_address: selected.property_address || prev.detailed_address
            }));
        }
    }, [formData.tenant_id, tenants]);

    const toggleInventory = (item: string) => {
        setFormData(prev => {
            const newInventory = { ...prev.inventory };
            if (newInventory[item]) {
                delete newInventory[item];
            } else {
                newInventory[item] = "ok";
            }
            return { ...prev, inventory: newInventory };
        });
    };

    const updateItemStatus = (item: string, status: string) => {
        setFormData(prev => ({
            ...prev,
            inventory: { ...prev.inventory, [item]: status }
        }));
    };

    const addCustomItem = () => {
        const trimmed = customItem.trim();
        if (trimmed && !INVENTORY_ITEMS.includes(trimmed) && !customItems.includes(trimmed)) {
            setCustomItems([...customItems, trimmed]);
            toggleInventory(trimmed);
            setCustomItem("");
        }
    };

    const removeCustomItem = (item: string) => {
        setCustomItems(customItems.filter(i => i !== item));
        setFormData(prev => {
            const newInventory = { ...prev.inventory };
            delete newInventory[item];
            return { ...prev, inventory: newInventory };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isTabValid()) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir tous les champs obligatoires de cette étape.",
                variant: "destructive"
            });
            return;
        }

        if (!isLastTab) {
            const currentIndex = tabs.indexOf(activeTab);
            setActiveTab(tabs[currentIndex + 1]);
            return;
        }

        try {
            setLoading(true);
            const selectedTenant = tenants.find(t => t.user_id === formData.tenant_id);
            if (!selectedTenant) throw new Error("Locataire non trouvé");

            await createContract({
                ...formData,
                contract_type: formData.contract_type as 'standard' | 'premium',
                tenant_id: selectedTenant.id,
                rent_amount: Number(formData.rent_amount),
                deposit_amount: Number(formData.deposit_amount),
                duration_months: Number(formData.duration_months),
                payment_day: Number(formData.payment_day),
                occupancy_limit: Number(formData.occupancy_limit),
                charges_info: { description: formData.charges_description }
            });

            toast({ title: "Contrat généré", description: "Le contrat de location a été créé avec succès." });
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message || "Impossible de créer le contrat", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] max-h-[92vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader>
                        <div className="flex justify-between items-center mb-1">
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Génération de Bail Sécurisé
                            </DialogTitle>
                        </div>
                        <DialogDescription>
                            Établissez un contrat conforme à la législation sénégalaise pour <span className="font-semibold text-foreground">{propertyName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-6 h-auto">
                            <TabsTrigger value="general" className="flex items-center gap-1.5 py-2"><Info className="h-3.5 w-3.5" /> 1. Général</TabsTrigger>
                            <TabsTrigger value="parties" className="flex items-center gap-1.5 py-2"><User className="h-3.5 w-3.5" /> 2. Parties</TabsTrigger>
                            <TabsTrigger value="property" className="flex items-center gap-1.5 py-2"><MapPin className="h-3.5 w-3.5" /> 3. Lieu</TabsTrigger>
                            <TabsTrigger value="premium" className="flex items-center gap-1.5 py-2" disabled={formData.contract_type !== 'premium'}>
                                <ClipboardList className="h-3.5 w-3.5" /> 4. Premium
                            </TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} id="contract-form">
                            {/* TAB 1: GENERAL */}
                            <TabsContent value="general" className="space-y-6 focus-visible:outline-none">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Zap className="h-4 w-4 text-accent fill-accent" />
                                        Choisir le type de contrat
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, contract_type: 'standard' })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all relative ${formData.contract_type === 'standard' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="p-2 rounded-lg bg-secondary/50">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                {formData.contract_type === 'standard' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                            </div>
                                            <p className="font-bold text-sm">Version Standard</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Bail officiel conforme sans inventaire détaillé.</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!canInventory) {
                                                    setUpgradeModal({
                                                        open: true,
                                                        title: "État des Lieux non inclus",
                                                        description: "La génération de bail avec état des lieux détaillé est réservée aux abonnés Premium et Professionnels."
                                                    });
                                                    return;
                                                }
                                                setFormData({ ...formData, contract_type: 'premium' });
                                            }}
                                            className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${formData.contract_type === 'premium' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:border-accent/30'} ${!canInventory ? 'opacity-70 group' : ''}`}
                                        >
                                            <div className="absolute -top-1 -right-5 bg-accent text-white text-[8px] font-bold px-5 py-1 rotate-12">PREMIUM</div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="p-2 rounded-lg bg-accent/10">
                                                    {canInventory ? <Crown className="h-5 w-5 text-accent" /> : <Lock className="h-5 w-5 text-slate-400" />}
                                                </div>
                                                {formData.contract_type === 'premium' && <CheckCircle2 className="h-4 w-4 text-accent" />}
                                                {!canInventory && <Lock className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />}
                                            </div>
                                            <p className="font-bold text-sm">Version avec État des Lieux</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Inventaire complet et description détaillée du bien.</p>
                                            {!canInventory && (
                                                <div className="mt-2 text-[9px] font-bold text-primary flex items-center gap-1">
                                                    <Crown className="h-3 w-3" /> Débloquer cette option
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Locataire *</Label>
                                        <Select value={formData.tenant_id} onValueChange={(v) => setFormData({ ...formData, tenant_id: v })} disabled={!!tenantId}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                            <SelectContent>{tenants.map((t) => (<SelectItem key={t.id} value={t.user_id}>{t.full_name}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date de début *</Label>
                                        <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Loyer Mensuel (FCFA) *</Label>
                                        <Input type="number" value={formData.rent_amount} onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dépôt de Garantie / Caution (FCFA)</Label>
                                        <Input type="number" value={formData.deposit_amount} onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Durée du bail (mois)</Label>
                                        <Input type="number" value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jour limite de paiement</Label>
                                        <Select value={String(formData.payment_day)} onValueChange={(v) => setFormData({ ...formData, payment_day: parseInt(v) })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 5, 10, 15].map(d => <SelectItem key={d} value={String(d)}>Le {d} du mois</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: PARTIES */}
                            <TabsContent value="parties" className="space-y-6 focus-visible:outline-none">
                                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 border-b pb-2"><ShieldCheck className="h-4 w-4 text-primary" /> Identité du Bailleur</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Type de pièce ID</Label>
                                            <Select value={formData.owner_id_type} onValueChange={(v) => setFormData({ ...formData, owner_id_type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CNI">Carte d'Identité Nationale</SelectItem>
                                                    <SelectItem value="Passeport">Passeport</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Numéro de pièce *</Label><Input value={formData.owner_id_number} onChange={(e) => setFormData({ ...formData, owner_id_number: e.target.value })} placeholder="Numéro ID" required /></div>
                                        <div className="space-y-2"><Label>Date de délivrance ID</Label><Input type="date" value={formData.owner_id_date} onChange={(e) => setFormData({ ...formData, owner_id_date: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Né(e) le</Label><Input type="date" value={formData.owner_dob} onChange={(e) => setFormData({ ...formData, owner_dob: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={formData.owner_birthplace} onChange={(e) => setFormData({ ...formData, owner_birthplace: e.target.value })} placeholder="Ville" /></div>
                                        <div className="space-y-2"><Label>Téléphone Bailleur</Label><Input value={formData.owner_phone} onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })} placeholder="77..." /></div>
                                        <div className="space-y-2"><Label>Email Bailleur</Label><Input value={formData.owner_email} onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })} placeholder="dest@exemple.com" /></div>
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 border-b pb-2"><User className="h-4 w-4 text-primary" /> Identité du Locataire</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Numéro de pièce ID *</Label><Input value={formData.tenant_id_number} onChange={(e) => setFormData({ ...formData, tenant_id_number: e.target.value })} placeholder="Numéro ID" required /></div>
                                        <div className="space-y-2"><Label>Date de délivrance ID</Label><Input type="date" value={formData.tenant_id_date} onChange={(e) => setFormData({ ...formData, tenant_id_date: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Né(e) le</Label><Input type="date" value={formData.tenant_dob} onChange={(e) => setFormData({ ...formData, tenant_dob: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={formData.tenant_birthplace} onChange={(e) => setFormData({ ...formData, tenant_birthplace: e.target.value })} placeholder="Ville" /></div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 3: LIEU & USAGE */}
                            <TabsContent value="property" className="space-y-4 focus-visible:outline-none">
                                <div className="space-y-2">
                                    <Label>Adresse complète du bien *</Label>
                                    <Textarea value={formData.detailed_address} onChange={(e) => setFormData({ ...formData, detailed_address: e.target.value })} placeholder="Ex: Dakar Plateau, Rue Vincens, Immeuble X, Appartement 4B" rows={3} required />
                                    <p className="text-[10px] text-muted-foreground italic">Soyez le plus précis possible pour la solidité juridique.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Limite d'occupation (pers.)</Label><Input type="number" value={formData.occupancy_limit} onChange={(e) => setFormData({ ...formData, occupancy_limit: e.target.value })} /></div>
                                    <div className="space-y-2">
                                        <Label>Usage exclusif</Label>
                                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted/10 text-xs font-semibold text-primary">HABITATION</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Charges à la charge du locataire</Label>
                                    <Input value={formData.charges_description} onChange={(e) => setFormData({ ...formData, charges_description: e.target.value })} placeholder="Ex: Eau, Électricité, Internet, Ordures" />
                                </div>
                            </TabsContent>

                            {/* TAB 4: PREMIUM */}
                            <TabsContent value="premium" className="space-y-4 focus-visible:outline-none">
                                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 border-b pb-2"><ClipboardList className="h-4 w-4 text-primary" /> État des Lieux & Inventaire 💎</h4>
                                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                                        {[...INVENTORY_ITEMS, ...customItems].map((item) => (
                                            <div key={item} className="flex items-center justify-between p-2 border rounded hover:bg-white transition-colors">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id={item} checked={!!formData.inventory[item]} onCheckedChange={() => toggleInventory(item)} />
                                                    <Label htmlFor={item} className="text-xs cursor-pointer flex items-center gap-1">
                                                        {item}
                                                        {customItems.includes(item) && <X className="h-3 w-3 text-destructive cursor-pointer hover:scale-120" onClick={(e) => { e.preventDefault(); removeCustomItem(item); }} />}
                                                    </Label>
                                                </div>
                                                {formData.inventory[item] && (
                                                    <div className="flex gap-1">
                                                        <Button type="button" size="sm" variant={formData.inventory[item] === 'ok' ? "default" : 'outline'} className="h-6 text-[10px] px-2" onClick={() => updateItemStatus(item, 'ok')}>OK</Button>
                                                        <Button type="button" size="sm" variant={formData.inventory[item] === 'degraded' ? "destructive" : 'outline'} className="h-6 text-[10px] px-2" onClick={() => updateItemStatus(item, 'degraded')}>DÉGRADÉ</Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-2 items-center">
                                        <Input
                                            placeholder="Ex: Micro-ondes, Miroir..."
                                            value={customItem}
                                            onChange={(e) => setCustomItem(e.target.value)}
                                            className="text-xs h-9"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addCustomItem();
                                                }
                                            }}
                                        />
                                        <Button type="button" size="sm" onClick={(e) => { e.preventDefault(); addCustomItem(); }} className="h-9 px-3 gap-1">
                                            <PlusCircle className="h-4 w-4" /> Ajouter
                                        </Button>
                                    </div>
                                </div>

                            </TabsContent>

                            <div className="mt-6 space-y-2 border-t pt-4">
                                <Label className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Notes & Clauses spécifiques supplémentaires</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ajoutez ici des clauses particulières ou des précisions importantes (visible sur toutes les versions du contrat)..."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </form>
                    </Tabs>
                </div>

                <div className="p-6 pt-2 border-t bg-muted/5">
                    {showLegalReminder && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-[10px] leading-tight flex flex-col gap-1 italic mb-4 relative group">
                            <button
                                onClick={() => setShowLegalReminder(false)}
                                className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-500"
                                title="Masquer le rappel"
                            >
                                <X className="h-3 w-3" />
                            </button>
                            <div className="flex items-center gap-1.5 font-bold mb-1"><AlertTriangle className="h-3 w-3" /> Rappel Juridique Important :</div>
                            <p>• Ce contrat inclut une clause de préavis d'un mois pour protéger les deux parties d'une reconduction tacite non souhaitée.</p>
                            <p>• Pour une pleine validité, le bail doit être légalisé à la mairie et enregistré à la DGID.</p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <div className="flex justify-between w-full items-center">
                            <Button type="button" variant="ghost" onClick={isFirstTab ? () => onOpenChange(false) : handleBack}>
                                {isFirstTab ? "Annuler" : "Précédent"}
                            </Button>

                            <div className="flex gap-2">
                                {!isLastTab ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!isTabValid()}
                                        className="bg-primary shadow-lg shadow-primary/20 min-w-[100px]"
                                    >
                                        Suivant
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        form="contract-form"
                                        disabled={loading || !isTabValid()}
                                        className="bg-primary shadow-lg shadow-primary/20"
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Générer le Bail Officiel {formData.contract_type === 'premium' ? 'Premium' : ''}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </div>

                <UpgradeModal
                    open={upgradeModal.open}
                    onOpenChange={(open) => setUpgradeModal(prev => ({ ...prev, open }))}
                    title={upgradeModal.title}
                    description={upgradeModal.description}
                />
            </DialogContent>
        </Dialog>
    );
};
