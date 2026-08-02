import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { previewReceipt, downloadReceipt } from "@/lib/api";
import { Loader2, Download, Printer, ExternalLink, AlertCircle, FileText, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReceiptPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receiptId: string | null;
    receiptNumber?: string;
    paymentDate?: string;
    defaultFullScreen?: boolean;
}

export const ReceiptPreviewModal = ({
    open,
    onOpenChange,
    receiptId,
    receiptNumber,
    paymentDate,
    defaultFullScreen = false,
}: ReceiptPreviewModalProps) => {
    const { toast } = useToast();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(defaultFullScreen);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        let currentBlobUrl: string | null = null;

        const loadReceiptPdf = async () => {
            if (!open || !receiptId) {
                setBlobUrl(null);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const url = await previewReceipt(receiptId);
                currentBlobUrl = url;
                setBlobUrl(url);
            } catch (err: any) {
                console.error("Erreur chargement aperçu reçu:", err);
                setError(err.message || "Impossible de charger l'aperçu du reçu");
                toast({
                    variant: "destructive",
                    title: "Erreur d'aperçu",
                    description: "Impossible d'afficher le reçu. Veuillez réessayer.",
                });
            } finally {
                setLoading(false);
            }
        };

        loadReceiptPdf();

        return () => {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [open, receiptId]);

    const handleDownload = async () => {
        if (!receiptId) return;
        setDownloading(true);
        try {
            await downloadReceipt(receiptId, receiptNumber, paymentDate);
            toast({
                title: "Téléchargement réussi",
                description: "Le reçu a été téléchargé avec succès.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Échec du téléchargement",
                description: err.message || "Impossible de télécharger le reçu.",
            });
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                iframeRef.current.contentWindow.focus();
                iframeRef.current.contentWindow.print();
            } catch (e) {
                console.error("Impression échouée:", e);
                window.open(blobUrl || "", "_blank");
            }
        } else if (blobUrl) {
            window.open(blobUrl, "_blank");
        }
    };

    const handleOpenNewTab = () => {
        if (blobUrl) {
            window.open(blobUrl, "_blank");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "flex flex-col transition-all duration-200 overflow-hidden",
                    isFullScreen
                        ? "w-screen h-screen max-w-none max-h-none rounded-none p-3 sm:p-4"
                        : "max-w-5xl w-[95vw] h-[90vh] max-h-[90vh] p-4 md:p-6 rounded-xl"
                )}
            >
                <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b space-y-0 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg md:text-xl font-bold">
                                {receiptNumber ? `Reçu N° ${receiptNumber}` : "Aperçu du reçu"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Visualisation directe de la quittance sans téléchargement
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Quick Toolbar */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pr-6">
                        {blobUrl && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="items-center gap-1.5 text-xs sm:text-sm"
                                    title={isFullScreen ? "Réduire l'affichage" : "Afficher en plein écran"}
                                >
                                    {isFullScreen ? (
                                        <Minimize2 className="h-4 w-4" />
                                    ) : (
                                        <Maximize2 className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {isFullScreen ? "Réduire" : "Plein écran"}
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="hidden sm:inline-flex items-center gap-1.5"
                                    title="Imprimer le reçu"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Imprimer</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenNewTab}
                                    className="hidden md:inline-flex items-center gap-1.5"
                                    title="Ouvrir dans un nouvel onglet navigateur"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Nouvel onglet</span>
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="bg-teal-600 hover:bg-teal-700 text-white items-center gap-1.5"
                                >
                                    {downloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Télécharger</span>
                                </Button>
                            </>
                        )}
                    </div>
                </DialogHeader>

                {/* Body / PDF Container */}
                <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden relative mt-3 flex items-center justify-center border border-border">
                    {loading && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                            <p className="text-sm font-medium">Génération de l'aperçu du reçu...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 max-w-md">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                            <h4 className="font-semibold text-base">Erreur d'affichage</h4>
                            <p className="text-xs text-muted-foreground">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                className="mt-2"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger directement le PDF
                            </Button>
                        </div>
                    )}

                    {!loading && blobUrl && (
                        <iframe
                            ref={iframeRef}
                            src={blobUrl}
                            className="w-full h-full border-0 rounded-lg"
                            title={receiptNumber ? `Reçu N° ${receiptNumber}` : "Reçu PDF"}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
