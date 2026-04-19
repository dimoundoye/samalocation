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
import { Eye, FileText, Download, ShieldCheck, Crown } from "lucide-react";

export const ContractModelPreview = () => {
    const [open, setOpen] = useState(false);

    return (
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
                            <TabsTrigger value="premium" className="gap-2">
                                <Crown className="h-4 w-4" /> Premium
                            </TabsTrigger>
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
                                    <Button size="sm" variant="ghost" className="gap-2" asChild>
                                        <a href="/contrat_standard.pdf" download>
                                            <Download className="h-4 w-4" /> Télécharger
                                        </a>
                                    </Button>
                                </div>
                                <iframe
                                    src="/contrat_standard.pdf#toolbar=0"
                                    className="w-full flex-1 border-none"
                                    title="Modèle Standard"
                                />
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
                                    <Button size="sm" variant="secondary" className="gap-2 bg-white text-slate-900 hover:bg-slate-100" asChild>
                                        <a href="/contrat_premium.pdf" download>
                                            <Download className="h-4 w-4" /> Télécharger
                                        </a>
                                    </Button>
                                </div>
                                <iframe
                                    src="/contrat_premium.pdf#toolbar=0"
                                    className="w-full flex-1 border-none"
                                    title="Modèle Premium"
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
