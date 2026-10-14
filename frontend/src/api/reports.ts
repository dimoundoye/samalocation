import { baseClient } from './baseClient';

/** Signaler un propriétaire ; photos = URLs déjà envoyées via uploadPhotos (preuves) */
export const createReport = async (reported_id: string, reason: string, photos: string[] = []) => {
    return baseClient('/reports', {
        method: 'POST',
        body: JSON.stringify({ reported_id, reason, photos })
    });
};

export const getAllReports = async (filters?: { status?: string; reported_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reported_id) params.append('reported_id', filters.reported_id);

    return baseClient(`/reports?${params.toString()}`);
};

export const getReportStatistics = async () => {
    return baseClient('/reports/stats');
};

export const updateReport = async (id: string, status: string, admin_notes?: string) => {
    return baseClient(`/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_notes })
    });
};

export const getAllUsers = async () => {
    return baseClient('/users');
};

export const blockUser = async (id: string, reason: string) => {
    return baseClient(`/users/${id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
    });
};

export const unblockUser = async (id: string) => {
    return baseClient(`/users/${id}/unblock`, {
        method: 'PATCH'
    });
};

export type PropertyReportCategory = 'scam' | 'unavailable' | 'misleading' | 'price' | 'broker' | 'inappropriate' | 'other';

/** Signaler une annonce publiée, avec ou sans compte (contact et identifiant anonyme : visiteurs sans compte) */
export const reportProperty = async (
    property_id: string,
    category: PropertyReportCategory,
    reason: string,
    extra: { contact?: string; visitorId?: string | null; website?: string } = {}
) => {
    return baseClient('/reports/property', {
        method: 'POST',
        body: JSON.stringify({ property_id, category, reason, ...extra })
    });
};
