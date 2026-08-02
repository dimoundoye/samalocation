import { baseClient, API_BASE_URL } from "./baseClient";
import { CreateContractData, RentalContract } from "@/types";
import { getTabLoaderHtml, getTabErrorHtml } from "@/lib/tabViewerHelpers";

export const createContract = async (data: CreateContractData): Promise<RentalContract> => {
    return await baseClient('/contracts', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const getOwnerContracts = async (): Promise<RentalContract[]> => {
    return await baseClient('/contracts/owner');
};

export const getTenantContracts = async (): Promise<RentalContract[]> => {
    return await baseClient('/contracts/tenant');
};

export const getContractDetails = async (id: string): Promise<RentalContract> => {
    return await baseClient(`/contracts/${id}`);
};

export const signContract = async (id: string): Promise<RentalContract> => {
    return await baseClient(`/contracts/${id}/sign`, {
        method: 'POST'
    });
};

export const downloadContract = async (id: string, contractNumber: string) => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
    };

    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/contracts/${id}/download`, {
        headers
    });

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Contrat_${contractNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const previewContract = async (id: string): Promise<string> => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
    };

    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/contracts/${id}/download?inline=true`, {
        headers
    });

    if (!response.ok) throw new Error("Erreur lors de la génération de l'aperçu du contrat");

    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    return window.URL.createObjectURL(pdfBlob);
};

export const openContractInNewTab = async (id: string) => {
    // Ouvrir l'onglet immédiatement pour éviter le blocage des popups par le navigateur
    const newTab = window.open("", "_blank");
    if (newTab) {
        newTab.document.write(getTabLoaderHtml("Préparation du contrat", "Veuillez patienter pendant la génération de votre contrat de bail..."));
    }

    try {
        const url = await previewContract(id);
        console.log(`✅ [FRONTEND SUCCESS] Prévisualisation du contrat ${id} générée avec succès.`);
        if (newTab) {
            newTab.location.href = url;
        } else {
            window.location.href = url;
        }
    } catch (error: any) {
        console.error(`❌ [FRONTEND ERROR] Échec de la prévisualisation du contrat ${id}:`, error);
        if (newTab) {
            const errorMsg = error?.message || "Impossible de charger le contrat de bail. Le document est introuvable ou le serveur est indisponible.";
            newTab.document.open();
            newTab.document.write(getTabErrorHtml("Impossible d'afficher le contrat", errorMsg));
            newTab.document.close();
        }
        throw error;
    }
};

export const verifyContract = async (id: string): Promise<any> => {
    return await baseClient(`/contracts/${id}/verify`);
};
