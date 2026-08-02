import { baseClient, API_BASE_URL } from "./baseClient";
import { CreateContractData, RentalContract } from "@/types";

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
        newTab.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Chargement du contrat...</title>
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
                        <div class="text">Chargement du contrat de bail...</div>
                    </div>
                </body>
            </html>
        `);
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
            newTab.document.title = "Erreur de prévisualisation";
            newTab.document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; background-color: #f8fafc;">
                    <div style="text-align: center; padding: 32px 24px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); max-width: 420px; width: 90%; border-top: 4px solid #ef4444;">
                        <div style="width: 56px; height: 56px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px auto;">✕</div>
                        <div style="font-size: 18px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">Échec de la prévisualisation</div>
                        <div style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">${error?.message || "Impossible de charger le contrat de bail."}</div>
                        <button onclick="window.close()" style="background-color: #0f172a; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Fermer cet onglet</button>
                    </div>
                </div>
            `;
        }
        throw error;
    }
};

export const verifyContract = async (id: string): Promise<any> => {
    return await baseClient(`/contracts/${id}/verify`);
};
