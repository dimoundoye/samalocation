import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Download, ShieldCheck, Crown, Lock, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "./UpgradeModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileIcon } from "lucide-react";

export const ContractModelPreview = () => {
    const [open, setOpen] = useState(false);
    const { hasFeature } = useSubscription();
    const isMobile = useIsMobile();
    const canPremiumContract = hasFeature('inventory_contract');
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const handlePremiumClick = (e: React.MouseEvent) => {
        if (!canPremiumContract) {
            e.preventDefault();
            e.stopPropagation();
            setUpgradeModalOpen(true);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary/50 text-xs h-8">
                        <Eye className="h-3.5 w-3.5" /> Voir les modèles
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-primary" />
                            Aperçu des Modèles de Contrats Samalocation
                        </DialogTitle>
                        <DialogDescription>
                            Comparez nos modèles certifiés pour choisir celui qui convient le mieux à votre gestion.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="standard" className="flex-1 flex flex-col mt-4">
                        <div className="px-6">
                            <TabsList className="grid w-80 grid-cols-2">
                                <TabsTrigger value="standard" className="gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Standard
                                </TabsTrigger>
                                <div className="relative group" onClickCapture={handlePremiumClick}>
                                    <TabsTrigger 
                                        value="premium" 
                                        className="gap-2 w-full"
                                        disabled={!canPremiumContract}
                                    >
                                        {canPremiumContract ? <Crown className="h-4 w-4" /> : <Lock className="h-4 w-4" />} 
                                        Premium
                                    </TabsTrigger>
                                </div>
                            </TabsList>
                        </div>

                        <div className="flex-1 mt-4 relative bg-muted/30">
                            <TabsContent value="standard" className="absolute inset-0 m-0">
                                <div className="w-full h-full flex flex-col">
                                    <div className="p-4 bg-white border-b flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm">Modèle Standard</h4>
                                            <p className="text-xs text-muted-foreground">Idéal pour les locations résidentielles classiques au Sénégal. Sans états des lieux</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="gap-2 border-primary/20 text-primary h-8" asChild>
                                                <a href={`${window.location.origin}/contrat_standard.pdf`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                                                </a>
                                            </Button>
                                            <Button size="sm" variant="ghost" className="gap-2 h-8" asChild>
                                                <a href={`${window.location.origin}/contrat_standard.pdf`} download>
                                                    <Download className="h-3.5 w-3.5" /> Télécharger
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                                        <div className="bg-muted w-24 h-24 rounded-2xl flex items-center justify-center mb-4">
                                            <FileIcon className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mb-6">contrat_standard.pdf</p>
                                        <Button 
                                            className="w-full max-w-xs h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg"
                                            asChild
                                        >
                                            <a href={`${window.location.origin}/contrat_standard.pdf`} target="_blank" rel="noopener noreferrer">
                                                Ouvrir
                                            </a>
                                        </Button>
                                        <p className="mt-4 text-[10px] text-muted-foreground italic text-center max-w-xs">
                                            Si l'aperçu ne s'affiche pas directement, utilisez le bouton ci-dessus pour ouvrir le document dans un nouvel onglet.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="premium" className="absolute inset-0 m-0">
                                <div className="w-full h-full flex flex-col">
                                    <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                Modèle Premium <Crown className="h-3 w-3 text-amber-400" />
                                            </h4>
                                            <p className="text-xs text-slate-400">Clauses renforcées. Avec états des lieux</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="gap-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8" asChild>
                                                <a href={`${window.location.origin}/contrat_premium.pdf`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                                                </a>
                                            </Button>
                                            <Button size="sm" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100 h-8" asChild>
                                                <a href={`${window.location.origin}/contrat_premium.pdf`} download>
                                                    <Download className="h-3.5 w-3.5" /> Télécharger
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900">
                                        <div className="bg-slate-800 w-24 h-24 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                                            <FileIcon className="h-12 w-12 text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-400 mb-6">contrat_premium.pdf</p>
                                        <Button 
                                            className="w-full max-w-xs h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg"
                                            asChild
                                        >
                                            <a href={`${window.location.origin}/contrat_premium.pdf`} target="_blank" rel="noopener noreferrer">
                                                Ouvrir
                                            </a>
                                        </Button>
                                        <p className="mt-4 text-[10px] text-slate-500 italic text-center max-w-xs">
                                            Si l'aperçu ne s'affiche pas directement, utilisez le bouton ci-dessus pour ouvrir le document dans un nouvel onglet.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <UpgradeModal 
                open={upgradeModalOpen}
                onOpenChange={setUpgradeModalOpen}
                title="Modèle Premium restreint"
                description="L'accès aux modèles de contrats premium (incluant l'état des lieux et des clauses renforcées) est réservé aux abonnés Premium et Professionnels."
            />
        </>
    );
};
