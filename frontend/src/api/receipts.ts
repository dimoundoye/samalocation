import { baseClient, API_BASE_URL } from "./baseClient";
import { Receipt, CreateReceiptData } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
        throw new Error("Erreur lors de la récupération du reçu");
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
        newTab.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Chargement du reçu...</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; }
                        .loader-container { text-align: center; }
                        .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #0d9488; border-radius: 50%; width: 36px; height: 36px; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .text { font-size: 14px; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <div class="loader-container">
                        <div class="spinner"></div>
                        <div class="text">Chargement de la quittance...</div>
                    </div>
                </body>
            </html>
        `);
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
            newTab.document.title = "Erreur de prévisualisation";
            newTab.document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; background-color: #f8fafc;">
                    <div style="text-align: center; padding: 32px 24px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); max-width: 420px; width: 90%; border-top: 4px solid #ef4444;">
                        <div style="width: 56px; height: 56px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px auto;">✕</div>
                        <div style="font-size: 18px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">Échec de la prévisualisation</div>
                        <div style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">${error?.message || "Impossible de charger la quittance de loyer."}</div>
                        <button onclick="window.close()" style="background-color: #0f172a; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Fermer cet onglet</button>
                    </div>
                </div>
            `;
        }
        throw error;
    }
};

// Supprimer un reçu (propriétaire)
export const deleteReceipt = async (id: string) => {
    return await baseClient(`/receipts/${id}`, {
        method: "DELETE"
    });
};

// Fonction de compatibilité avec l'ancien code
export const getReceipts = getTenantReceipts;
