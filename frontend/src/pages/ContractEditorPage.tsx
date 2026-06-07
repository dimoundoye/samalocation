import { useState, useEffect } from "react";
import { ContractRichEditor } from "@/components/owner/ContractRichEditor";
import { getContractTemplates, createContractTemplate, updateContractTemplate } from "@/api/contractTemplates";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ContractEditorPageProps {
    templateId?: string;
    onClose: () => void;
}

export default function ContractTemplateEditor({ templateId, onClose }: ContractEditorPageProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(!!templateId);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("Mon modèle de contrat");
    const [content, setContent] = useState(`<h1 style="text-align: center">CONTRAT DE BAIL</h1>
<p style="text-align: center">Entre les soussignés :</p>
<hr>
<h2>1. DESIGNATION DES PARTIES</h2>
<p><strong>LE BAILLEUR :</strong> ______________________________</p>
<p><strong>LE LOCATAIRE :</strong> ______________________________</p>
<hr>
<h2>2. OBJET DU BAIL</h2>
<p>Le bailleur donne en location le bien situé à ______________________________.</p>
<hr>
<h2>3. DUREE ET CONDITIONS FINANCIERES</h2>
<p>Loyer mensuel : ____________ | Duree : ____________ mois</p>
<hr>
<h2>4. CLAUSES PARTICULIERES</h2>
<p>Ajoutez vos clauses personnalisees ici...</p>`);

    useEffect(() => {
        if (templateId) {
            const loadTemplate = async () => {
                try {
                    const templates = await getContractTemplates();
                    const template = templates.find((t) => t.id === templateId);
                    if (template) {
                        setTitle(template.title);
                        setContent(template.content);
                    } else {
                        toast({ title: "Erreur", description: "Modèle introuvable.", variant: "destructive" });
                        onClose();
                    }
                } catch (err: any) {
                    toast({ title: "Erreur", description: err.message || "Impossible de charger le modèle.", variant: "destructive" });
                    onClose();
                } finally {
                    setLoading(false);
                }
            };
            loadTemplate();
        }
    }, [templateId]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ title: "Erreur", description: "Le titre est requis.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (templateId) {
                await updateContractTemplate(templateId, title, content);
                toast({ title: "Modèle mis à jour" });
            } else {
                await createContractTemplate(title, content);
                toast({ title: "Modèle créé" });
            }
            onClose();
        } catch (err: any) {
            toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <ContractRichEditor
                title={title}
                content={content}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onSave={handleSave}
                onClose={onClose}
                saving={saving}
            />
        </div>
    );
}
