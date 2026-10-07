import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eraser, PenLine, RotateCcw, ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// L'image envoyée au serveur doit rester sous sa limite (≈ 90 000 caractères)
const MAX_EXPORT_WIDTH = 600;
const MAX_EXPORT_HEIGHT = 200;
const MAX_DATA_URL_LENGTH = 85000;
const INK_COLOR = "#0f172a";

interface SignaturePadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signerName?: string;
    signerCustomId?: string;
    submitting?: boolean;
    onOpenContract?: () => void;
    onConfirm: (signatureDataUrl: string) => void;
    /** contract : signature d'un contrat (locataire) ; profile : signature enregistrée dans le profil du propriétaire */
    variant?: "contract" | "profile";
}

const TEXTS = {
    contract: {
        drawTitle: "Signez le contrat",
        consent: "J'ai lu le contrat et j'accepte sans réserve ses clauses. Je reconnais que cette signature électronique m'engage au même titre qu'une signature manuscrite sur papier.",
        confirm: "Confirmer et signer",
    },
    profile: {
        drawTitle: "Dessinez votre signature",
        consent: "Je certifie que cette signature est la mienne. Elle sera apposée sur les reçus et contrats que j'émettrai à partir de maintenant ; les documents déjà émis gardent leur signature d'origine.",
        confirm: "Utiliser cette signature",
    },
};

/**
 * Recadre la signature sur sa zone dessinée et l'exporte en PNG transparent de taille bornée.
 */
function exportSignature(canvas: HTMLCanvasElement): string | null {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = canvas;
    const pixels = ctx.getImageData(0, 0, width, height).data;

    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pixels[(y * width + x) * 4 + 3] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return null;

    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    let scale = Math.min(1, MAX_EXPORT_WIDTH / cropW, MAX_EXPORT_HEIGHT / cropH);
    for (let attempt = 0; attempt < 4; attempt++) {
        const out = document.createElement("canvas");
        out.width = Math.max(1, Math.round(cropW * scale));
        out.height = Math.max(1, Math.round(cropH * scale));
        out.getContext("2d")!.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, out.width, out.height);
        const dataUrl = out.toDataURL("image/png");
        if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
        scale *= 0.7;
    }
    return null;
}

export const SignaturePadDialog = ({
    open,
    onOpenChange,
    signerName,
    signerCustomId,
    submitting = false,
    onOpenContract,
    onConfirm,
    variant = "contract",
}: SignaturePadDialogProps) => {
    const texts = TEXTS[variant];
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const strokeLength = useRef(0);

    const [step, setStep] = useState<"draw" | "review">("draw");
    const [hasInk, setHasInk] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Réinitialise à chaque ouverture
    useEffect(() => {
        if (open) {
            setStep("draw");
            setPreview(null);
            setAccepted(false);
            setError(null);
            setHasInk(false);
            strokeLength.current = 0;
        }
    }, [open]);

    // Adapte la résolution du canvas à l'écran (net sur mobile) une fois affiché.
    // offsetWidth/offsetHeight = taille de mise en page, non faussée par l'animation d'ouverture (scale).
    // Dimensionné dès que le canvas est inséré dans la page (la pop-up l'insère un rendu après l'ouverture),
    // puis à chaque changement de taille (rotation de l'écran) : le tracé est recopié au lieu d'être effacé.
    const pixelRatio = useRef(1);
    const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
    const attachCanvas = useCallback((node: HTMLCanvasElement | null) => {
        canvasRef.current = node;
        setCanvasEl(node);
    }, []);
    useLayoutEffect(() => {
        const canvas = canvasEl;
        if (!canvas) return;

        const fit = () => {
            const ratio = window.devicePixelRatio || 1;
            const width = Math.round(canvas.offsetWidth * ratio);
            const height = Math.round(canvas.offsetHeight * ratio);
            if (!width || !height || (width === canvas.width && height === canvas.height)) return;

            let previous: HTMLCanvasElement | null = null;
            if (canvas.width && canvas.height && strokeLength.current > 0) {
                previous = document.createElement("canvas");
                previous.width = canvas.width;
                previous.height = canvas.height;
                previous.getContext("2d")!.drawImage(canvas, 0, 0);
            }

            pixelRatio.current = ratio;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            if (previous) ctx.drawImage(previous, 0, 0, width, height);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = INK_COLOR;
            ctx.fillStyle = INK_COLOR;
            ctx.lineWidth = 2.5 * ratio;
        };

        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [canvasEl]);

    // Position du doigt en pixels internes du canvas, quelle que soit la mise à l'échelle CSS
    const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        const p = pointFrom(e);
        lastPoint.current = p;
        // Un simple appui laisse un point
        const ctx = e.currentTarget.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2 * pixelRatio.current, 0, Math.PI * 2);
        ctx.fill();
        setHasInk(true);
        setError(null);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current || !lastPoint.current) return;
        e.preventDefault();
        const ctx = e.currentTarget.getContext("2d")!;
        const p = pointFrom(e);
        const last = lastPoint.current;
        const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        strokeLength.current += Math.hypot(p.x - last.x, p.y - last.y) / pixelRatio.current;
        lastPoint.current = p;
    };

    const handlePointerUp = () => {
        drawing.current = false;
        lastPoint.current = null;
    };

    const clearPad = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
        strokeLength.current = 0;
        setHasInk(false);
        setError(null);
    };

    const validateDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (strokeLength.current < 60) {
            setError("Votre signature est trop courte. Signez comme sur un document papier.");
            return;
        }
        const dataUrl = exportSignature(canvas);
        if (!dataUrl) {
            setError("Impossible d'enregistrer cette signature. Effacez et recommencez.");
            return;
        }
        setPreview(dataUrl);
        setStep("review");
    };

    const redo = () => {
        setPreview(null);
        setAccepted(false);
        setStep("draw");
        setHasInk(false);
        strokeLength.current = 0;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
            <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                    <div className="mx-auto bg-primary/5 p-4 rounded-3xl w-fit border border-primary/10">
                        {step === "draw" ? <PenLine className="h-9 w-9 text-primary" /> : <ShieldCheck className="h-9 w-9 text-primary" />}
                    </div>
                    <DialogTitle className="text-center text-xl font-black text-primary">
                        {step === "draw" ? texts.drawTitle : "Vérifiez votre signature"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-balance">
                        {step === "draw"
                            ? "Signez avec votre doigt (ou la souris) dans le cadre ci-dessous."
                            : "Si la signature vous convient, confirmez. Sinon, refaites-la."}
                    </DialogDescription>
                </DialogHeader>

                {step === "draw" ? (
                    <div className="space-y-3">
                        <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-white overflow-hidden">
                            <canvas
                                ref={attachCanvas}
                                className="block w-full h-48 sm:h-52 cursor-crosshair"
                                style={{ touchAction: "none" }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                                aria-label="Zone de signature"
                            />
                            <div className="pointer-events-none absolute left-6 right-6 bottom-10 border-b border-slate-300" />
                            {!hasInk && (
                                <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                                    Signez ici
                                </p>
                            )}
                        </div>
                        {error && <p className="text-sm text-destructive text-center">{error}</p>}
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" className="flex-1 gap-2" onClick={clearPad} disabled={!hasInk}>
                                <Eraser className="h-4 w-4" /> Effacer
                            </Button>
                            <Button type="button" className="flex-1 gap-2" onClick={validateDrawing} disabled={!hasInk}>
                                <PenLine className="h-4 w-4" /> Valider ma signature
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border bg-white p-4 text-center">
                            {preview && <img src={preview} alt="Aperçu de votre signature" className="mx-auto max-h-28 object-contain" />}
                            <div className="mt-3 border-t pt-3 text-xs text-slate-600 space-y-0.5">
                                {signerName && <p className="font-semibold text-slate-800">{signerName}</p>}
                                {signerCustomId && <p>ID Samalocation : <span className="font-mono">{signerCustomId}</span></p>}
                                <p>{format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-900 cursor-pointer">
                            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
                            <span>
                                {texts.consent}
                                {onOpenContract && (
                                    <button type="button" onClick={onOpenContract} className="ml-1 inline-flex items-center gap-1 font-semibold underline">
                                        Relire le contrat <ExternalLink className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        </label>
                    </div>
                )}

                {step === "review" && (
                    <DialogFooter className="gap-3 sm:gap-3 sm:justify-center">
                        <Button type="button" variant="outline" className="gap-2" onClick={redo} disabled={submitting}>
                            <RotateCcw className="h-4 w-4" /> Refaire
                        </Button>
                        <Button
                            type="button"
                            className="gap-2 bg-primary hover:bg-primary/90 text-white"
                            onClick={() => preview && onConfirm(preview)}
                            disabled={!accepted || submitting}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            {texts.confirm}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
