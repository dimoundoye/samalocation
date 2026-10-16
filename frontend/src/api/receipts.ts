import { baseClient, API_BASE_URL } from "./baseClient";
import { Receipt, CreateReceiptData, SettleDepositData, RentPeriodBalance } from "@/types";
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

// Solde d'un mois de loyer (loyer dû, déjà versé, reste à payer) pour le formulaire de reçu
export const getReceiptBalance = async (params: { tenant_id: string; property_id: string; unit_id?: string | null; month: number; year: number }): Promise<RentPeriodBalance> => {
    const query = new URLSearchParams({
        tenant_id: params.tenant_id,
        property_id: params.property_id,
        month: String(params.month),
        year: String(params.year),
        ...(params.unit_id ? { unit_id: params.unit_id } : {})
    });
    return await baseClient(`/receipts/balance?${query.toString()}`);
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

// Restituer une caution (en totalité, en partie avec retenues, ou retenue en totalité)
export const settleDeposit = async (receiptId: string, data: SettleDepositData) => {
    return await baseClient(`/receipts/${receiptId}/settlement`, {
        method: "POST",
        body: JSON.stringify(data)
    });
};

// Annuler une restitution de caution avec motif : la caution redevient détenue
export const cancelDepositSettlement = async (settlementId: string, cancellation_reason: string) => {
    return await baseClient(`/receipts/settlements/${settlementId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ cancellation_reason })
    });
};

const fetchSettlementPdf = async (settlementId: string, inline: boolean): Promise<Blob> => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/receipts/settlements/${settlementId}/download${inline ? "?inline=true" : ""}`, { headers });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Impossible de récupérer le décompte de restitution");
    }
    return new Blob([await response.blob()], { type: "application/pdf" });
};

// Ouvrir le décompte de restitution d'une caution dans un nouvel onglet
export const openDepositSettlementInNewTab = async (settlementId: string) => {
    const newTab = window.open("", "_blank");
    if (newTab) {
        newTab.document.write(getTabLoaderHtml("Préparation du décompte", "Veuillez patienter pendant la génération du décompte de restitution..."));
    }
    try {
        const url = window.URL.createObjectURL(await fetchSettlementPdf(settlementId, true));
        if (newTab) {
            newTab.location.href = url;
        } else {
            window.location.href = url;
        }
    } catch (error: any) {
        if (newTab) {
            newTab.document.open();
            newTab.document.write(getTabErrorHtml("Impossible d'afficher le décompte", error?.message || "Le document est introuvable ou le serveur est indisponible."));
            newTab.document.close();
        }
        throw error;
    }
};

// Télécharger le décompte de restitution d'une caution
export const downloadDepositSettlement = async (settlementId: string, settlementNumber?: string | null) => {
    const url = window.URL.createObjectURL(await fetchSettlementPdf(settlementId, false));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Restitution caution ${settlementNumber || settlementId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// Fonction de compatibilité avec l'ancien code
export const getReceipts = getTenantReceipts;
