import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Camera, Upload, Check, X, RotateCw, Contrast, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (blob: Blob) => void;
    existingImageUrl?: string;
}

export const SignatureScanner: React.FC<SignatureScannerProps> = ({
    open,
    onOpenChange,
    onSave,
    existingImageUrl
}) => {
    const { toast } = useToast();
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [threshold, setThreshold] = useState(200);
    const [isGrayscale, setIsGrayscale] = useState(false);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process image when threshold or grayscale changes
    useEffect(() => {
        if (image && canvasRef.current) {
            processImage();
        }
    }, [image, threshold, isGrayscale]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => setImage(img);
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = () => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas dimensions
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        // Draw original image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate brightness
            const brightness = (r + g + b) / 3;

            if (brightness > threshold) {
                // Transparent background
                data[i + 3] = 0;
            } else if (isGrayscale) {
                // Enforce pure black for signature if grayscale
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedUrl(canvas.toDataURL("image/png"));
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.toBlob((blob) => {
                if (blob) {
                    onSave(blob);
                    onOpenChange(false);
                    toast({
                        title: "Signature traitée",
                        description: "Votre signature a été optimisée et prête à être enregistrée.",
                    });
                }
            }, "image/png");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Scanner de Signature & Cachet</DialogTitle>
                    <DialogDescription>
                        Prenez une photo de votre signature sur papier blanc. Nous allons supprimer le fond automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {!image ? (
                        <div
                            className="border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center gap-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-4 rounded-full bg-primary/10">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Cliquez pour importer une photo</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG ou Capture mobile</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative border rounded-lg overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat min-h-[300px] flex items-center justify-center border-slate-200 dark:border-slate-800">
                                <canvas ref={canvasRef} className="max-w-full max-h-[400px] object-contain" />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 rounded-full shadow-md"
                                    onClick={() => setImage(null)}
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-secondary/30 rounded-lg">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="flex items-center gap-2">
                                            <Contrast className="h-4 w-4" /> Seuil de scan
                                        </Label>
                                        <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border">{threshold}</span>
                                    </div>
                                    <Slider
                                        value={[threshold]}
                                        min={50}
                                        max={250}
                                        step={1}
                                        onValueChange={(val) => setThreshold(val[0])}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Ajustez pour supprimer le fond sans effacer la signature.
                                    </p>
                                </div>

                                <div className="flex flex-col justify-center gap-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="grayscale" className="flex items-center gap-2 cursor-pointer">
                                            <ImageIcon className="h-4 w-4" /> Mode Noir & Blanc
                                        </Label>
                                        <Switch
                                            id="grayscale"
                                            checked={isGrayscale}
                                            onCheckedChange={setIsGrayscale}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Activez pour une signature purement noire (idéal pour les baux). Désactivez pour garder les couleurs des cachets.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={!image} className="gap-2">
                        <Check className="h-4 w-4" /> Utiliser cette signature
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
