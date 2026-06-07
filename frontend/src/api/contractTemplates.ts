import { baseClient, API_BASE_URL } from "./baseClient";

export interface ContractTemplate {
    id: string;
    owner_id: string;
    title: string;
    content: string; // HTML content
    created_at: string;
    updated_at: string;
}

export const getContractTemplates = async (): Promise<ContractTemplate[]> => {
    return await baseClient('/contract-templates');
};

export const createContractTemplate = async (title: string, content: string): Promise<ContractTemplate> => {
    return await baseClient('/contract-templates', {
        method: 'POST',
        body: JSON.stringify({ title, content })
    });
};

export const updateContractTemplate = async (id: string, title: string, content: string): Promise<ContractTemplate> => {
    return await baseClient(`/contract-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content })
    });
};

export const deleteContractTemplate = async (id: string): Promise<void> => {
    return await baseClient(`/contract-templates/${id}`, {
        method: 'DELETE'
    });
};

/**
 * Upload a PDF or DOCX file and get extracted HTML text back.
 */
export const extractDocumentText = async (file: File): Promise<{ html: string; raw: string }> => {
    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");

    const formData = new FormData();
    formData.append('document', file);

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
    };
    if (activeContext) {
        headers["X-Active-Context"] = activeContext;
    }

    const response = await fetch(`${API_BASE_URL}/contract-templates/extract`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erreur extraction' }));
        throw new Error(err.message || 'Erreur lors de l\'extraction du document.');
    }

    const json = await response.json();
    return json.data;
};
