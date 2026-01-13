import { baseClient } from "./baseClient";
import { Receipt, CreateReceiptData } from "@/types";

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
export const downloadReceipt = async (id: string) => {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(`http://localhost:5000/api/receipts/${id}/download`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du reçu");
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();

    // Créer un lien de téléchargement temporaire
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recu-${id}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Nettoyer
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// Supprimer un reçu (propriétaire)
export const deleteReceipt = async (id: string) => {
    return await baseClient(`/receipts/${id}`, {
        method: "DELETE"
    });
};

// Fonction de compatibilité avec l'ancien code
export const getReceipts = getTenantReceipts;
