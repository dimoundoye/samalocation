import { baseClient, API_BASE_URL } from "./baseClient";
import { Receipt, CreateReceiptData } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getTabLoaderHtml, getTabErrorHtml } from "@/lib/tabViewerHelpers";

// Créer un reçu (propriétaire)
export const createReceipt = async (data: CreateReceiptData) => {
    return await baseClient("/receipts", {
        method: "POST",
        body: JSON.stringify(data)
    });
};

// Récupérer les reçus d'un locataire
export const getTenantReceipts = async (): Promise<Receipt[]> => {
    try {
        return await baseClient("/receipts/tenant");
    } catch (error) {
        console.error("GetTenantReceipts error:", error);
        return [];
    }
};

// Récupérer les reçus créés par un propriétaire
export const getOwnerReceipts = async (): Promise<Receipt[]> => {
    try {
        return await baseClient("/receipts/owner");
    } catch (error) {
        console.error("GetOwnerReceipts error:", error);
        return [];
    }
};

// Télécharger un reçu en PDF
export const downloadReceipt = async (id: string, receiptNumber?: string, paymentDate?: string) => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/receipts/${id}/download`, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du reçu");
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();

    // Générer un nom de fichier propre
    let filename = `recu-${id}.pdf`;
    if (receiptNumber && paymentDate) {
        try {
            const formattedDate = format(new Date(paymentDate), "dd.MM.yyyy");
            filename = `Reçu N°${receiptNumber} ${formattedDate}.pdf`;
        } catch (e) {
            console.error("Error formatting date for filename:", e);
        }
    }

    // Créer un lien de téléchargement temporaire
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Nettoyer
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// Obtenir l'URL du PDF pour prévisualisation sans téléchargement direct
export const previewReceipt = async (id: string): Promise<string> => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/receipts/${id}/download?inline=true`, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Erreur lors de la récupération du reçu");
    }

    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    return window.URL.createObjectURL(pdfBlob);
};

// Ouvrir le reçu directement dans un nouvel onglet du navigateur (plein écran)
export const openReceiptInNewTab = async (id: string) => {
    // Ouvrir l'onglet immédiatement pour éviter le blocage des popups par le navigateur
    const newTab = window.open("", "_blank");
    if (newTab) {
        newTab.document.write(getTabLoaderHtml("Préparation de la quittance", "Veuillez patienter pendant la génération de votre reçu..."));
    }

    try {
        const url = await previewReceipt(id);
        console.log(`✅ [FRONTEND SUCCESS] Prévisualisation du reçu ${id} générée avec succès.`);
        if (newTab) {
            newTab.location.href = url;
        } else {
            window.location.href = url;
        }
    } catch (error: any) {
        console.error(`❌ [FRONTEND ERROR] Échec de la prévisualisation du reçu ${id}:`, error);
        if (newTab) {
            const errorMsg = error?.message || "Impossible de charger la quittance de loyer. Le document est introuvable ou le serveur est indisponible.";
            newTab.document.open();
            newTab.document.write(getTabErrorHtml("Impossible d'afficher la quittance", errorMsg));
            newTab.document.close();
        }
        throw error;
    }
};

// Annuler un reçu avec motif (propriétaire/agence)
export const cancelReceipt = async (id: string, cancellation_reason: string) => {
    return await baseClient(`/receipts/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ cancellation_reason })
    });
};

// Supprimer un reçu (propriétaire)
export const deleteReceipt = async (id: string) => {
    return await baseClient(`/receipts/${id}`, {
        method: "DELETE"
    });
};

// Fonction de compatibilité avec l'ancien code
export const getReceipts = getTenantReceipts;
