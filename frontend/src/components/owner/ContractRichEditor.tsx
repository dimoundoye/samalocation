import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Heading1, Heading2, Heading3, List, ListOrdered, Minus, Table as TableIcon,
    Trash2, PlusSquare, ChevronLeft, ChevronDown, ChevronUp, Upload, Loader2, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractDocumentText } from "@/api/contractTemplates";
import { useToast } from "@/hooks/use-toast";

interface ContractRichEditorProps {
    title: string;
    content: string;
    onTitleChange: (v: string) => void;
    onContentChange: (v: string) => void;
    onSave: () => Promise<void>;
    onClose: () => void;
    saving?: boolean;
}

const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
    disabled
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
            "h-7 w-7 rounded flex items-center justify-center transition-colors text-sm",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            active && "bg-primary text-white hover:bg-primary/90",
            disabled && "opacity-40 cursor-not-allowed"
        )}
    >
        {children}
    </button>
);

const Divider = () => (
    <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
);

export function ContractRichEditor({
    title,
    content,
    onTitleChange,
    onContentChange,
    onSave,
    onClose,
    saving = false
}: ContractRichEditorProps) {
    const { toast } = useToast();
    const [extracting, setExtracting] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content || "<p></p>",
        onUpdate: ({ editor }) => {
            onContentChange(editor.getHTML());
        },
    });

    const insertTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setExtracting(true);
        try {
            const result = await extractDocumentText(file);
            const htmlTableCount = (result.html.match(/<table/gi) || []).length;
            console.log('[IMPORT HTML TABLES]', htmlTableCount);
            editor?.chain().focus().setContent(result.html).run();
            // Diagnostic : compter les tables dans le HTML parsé
            const editorHtml = editor?.getHTML() || '';
            const editorTableCount = (editorHtml.match(/<table/gi) || []).length;
            console.log('[EDITOR TABLE COUNT]', editorTableCount, '/', htmlTableCount, 'tables in editor');
            if (editorTableCount < htmlTableCount) {
                console.log('[EDITOR HTML FULL]', editorHtml);
            }
            onContentChange(result.html);
            toast({ title: "Document importé", description: "Le texte a été extrait et chargé dans l'éditeur." });
        } catch (err: any) {
            toast({ title: "Erreur", description: err.message || "Impossible d'extraire le document.", variant: "destructive" });
        } finally {
            setExtracting(false);
            e.target.value = "";
        }
    };

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Title */}
            <div className="mb-4 shrink-0">
                <Label htmlFor="template-title" className="text-sm font-medium mb-1 block">
                    Titre du modèle
                </Label>
                <Input
                    id="template-title"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Ex: Contrat bail meublé, Bail commercial..."
                    className="font-medium text-base"
                />
            </div>

            {/* Note PDF ↔ Word */}
            <div className="mb-3 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                <strong>⚠ Import de documents :</strong> Les fichiers PDF ne préservent pas les tableaux.
                Pour importer un document contenant des tableaux, utilisez un fichier Word (<strong>.docx</strong>).
            </div>

            {/* Toolbar - sticky dans le scroll container du dashboard */}
            <div className="sticky top-0 z-10 border rounded-t-md bg-gray-50 dark:bg-gray-900 px-2 py-1.5 flex flex-wrap items-center gap-0.5 shadow-sm">
                {/* Text Style */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Gras (Ctrl+B)"
                >
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Italique (Ctrl+I)"
                >
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive("underline")}
                    title="Souligné (Ctrl+U)"
                >
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Divider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive("heading", { level: 1 })}
                    title="Titre 1"
                >
                    <Heading1 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive("heading", { level: 2 })}
                    title="Titre 2"
                >
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive("heading", { level: 3 })}
                    title="Titre 3"
                >
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Divider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    active={editor.isActive({ textAlign: "left" })}
                    title="Aligner à gauche"
                >
                    <AlignLeft className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    active={editor.isActive({ textAlign: "center" })}
                    title="Centrer"
                >
                    <AlignCenter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    active={editor.isActive({ textAlign: "right" })}
                    title="Aligner à droite"
                >
                    <AlignRight className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    active={editor.isActive({ textAlign: "justify" })}
                    title="Justifier"
                >
                    <AlignJustify className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive("bulletList")}
                    title="Liste à puces"
                >
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive("orderedList")}
                    title="Liste numérotée"
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Divider />

                {/* Separator line */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Ligne de séparation"
                >
                    <Minus className="h-3.5 w-3.5" />
                </ToolbarButton>

                {/* Table */}
                <ToolbarButton onClick={insertTable} title="Insérer un tableau">
                    <TableIcon className="h-3.5 w-3.5" />
                </ToolbarButton>

                {editor.isActive("table") && (
                    <>
                        <Divider />
                        <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground mr-1">
                            Tableau:
                        </div>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            title="Ajouter une ligne après"
                            className="h-7 px-1.5 rounded flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                        >
                            <ChevronDown className="h-3 w-3" />
                            <span>Ligne</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            title="Supprimer la ligne"
                            className="h-7 px-1.5 rounded flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-red-600"
                        >
                            <ChevronUp className="h-3 w-3" />
                            <span>Ligne</span>
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            title="Ajouter une colonne après"
                            className="h-7 px-1.5 rounded flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                        >
                            <PlusSquare className="h-3 w-3" />
                            <span>Colonne</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            title="Supprimer la colonne"
                            className="h-7 px-1.5 rounded flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-red-600"
                        >
                            <ChevronLeft className="h-3 w-3" />
                            <span>Colonne</span>
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            title="Supprimer le tableau"
                            className="h-7 px-1.5 rounded flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-red-600 font-medium"
                        >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer</span>
                        </button>
                    </>
                )}

                <div className="flex-1" />

                {/* Import button */}
                <label className={cn(
                    "h-7 px-2 rounded flex items-center gap-1.5 text-xs cursor-pointer transition-colors",
                    "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                    extracting && "opacity-60 cursor-not-allowed pointer-events-none"
                )}>
                    {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    <span>Importer PDF/Word</span>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={extracting}
                    />
                </label>
            </div>

            {/* Editor area */}
            <div className="border border-t-0 rounded-b-md flex-1 overflow-auto bg-white dark:bg-gray-950 min-h-[350px]">
                <style>{`
                    .contract-editor .ProseMirror {
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 12pt !important;
                        line-height: 1.5 !important;
                        color: #000 !important;
                    }
                    .contract-editor .ProseMirror h1 {
                        font-size: 22pt !important;
                        font-weight: bold !important;
                        margin: 16px 0 8px 0 !important;
                    }
                    .contract-editor .ProseMirror h2 {
                        font-size: 16pt !important;
                        font-weight: bold !important;
                        margin: 12px 0 6px 0 !important;
                    }
                    .contract-editor .ProseMirror h3 {
                        font-size: 13pt !important;
                        font-weight: bold !important;
                        margin: 10px 0 4px 0 !important;
                    }
                    .contract-editor .ProseMirror h4 {
                        font-size: 12pt !important;
                        font-weight: bold !important;
                        margin: 8px 0 4px 0 !important;
                    }
                    .contract-editor .ProseMirror p {
                        margin: 0 0 6px 0 !important;
                    }
                    .contract-editor .ProseMirror ul,
                    .contract-editor .ProseMirror ol {
                        margin: 4px 0 8px 0 !important;
                    }
                    .contract-editor .ProseMirror li {
                        margin-bottom: 4px !important;
                    }
                    .contract-editor .ProseMirror hr {
                        border: none !important;
                        border-top: 1px solid #ccc !important;
                        margin: 12px 0 !important;
                    }
                `}</style>
                <EditorContent
                    editor={editor}
                    className="contract-editor prose prose-sm dark:prose-invert max-w-none p-4 h-full focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[340px] [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-1.5 [&_th]:border [&_th]:border-gray-300 [&_th]:p-1.5 [&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_th]:font-bold"
                />
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 mt-4 shrink-0">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                    <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
                <Button onClick={onSave} disabled={saving || !title.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Enregistrer le modèle
                </Button>
            </div>
        </div>
    );
}
