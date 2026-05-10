import { baseClient } from "./baseClient";

export interface TenantDossier {
    id?: string;
    user_id: string;
    profession: string;
    contract_type: string;
    employer_name: string;
    monthly_income: number;
    profession_since: string;
    cni_url?: string;
    last_three_payslips: string[];
    tax_notice_url?: string;
    employment_certificate_url?: string;
    proof_of_residence_url?: string;
    has_guarantor: boolean;
    guarantor_info: any;
    is_complete: boolean;
    is_verified: boolean;
    occupants_count?: number;
    guarantor_relationship?: string;
    marital_status?: string;
}

export const getMyDossier = async (): Promise<TenantDossier | null> => {
    return await baseClient('/dossier/me');
};

export const saveDossier = async (data: Partial<TenantDossier>) => {
    return await baseClient('/dossier/save', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const shareDossier = async (propertyId: string) => {
    return await baseClient('/dossier/share', {
        method: 'POST',
        body: JSON.stringify({ propertyId })
    });
};

export const getSharedDossiers = async () => {
    return await baseClient('/dossier/shared');
};

export const getSharedDossierDetails = async (dossierId: string) => {
    return await baseClient(`/dossier/shared/${dossierId}`);
};

export const updateSharedDossierStatus = async (dossierId: string, status: string) => {
    return await baseClient(`/dossier/shared/${dossierId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
};

export const getMyShares = async () => {
    return await baseClient('/dossier/shares');
};

export const revokeShare = async (ownerId: string, propertyId?: string) => {
    const url = propertyId ? `/dossier/shares/${ownerId}?propertyId=${propertyId}` : `/dossier/shares/${ownerId}`;
    return await baseClient(url, {
        method: 'DELETE'
    });
};
