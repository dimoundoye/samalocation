import { baseClient } from "./baseClient";

export const getAdminStatistics = async (params?: { lastUsersCheck?: string, lastPropertiesCheck?: string }) => {
    return await baseClient("/admin/statistics", { params });
};

export const getRecentUsers = async (limit = 10, since?: string) => {
    let url = `/admin/users/recent?limit=${limit}`;
    if (since) url += `&since=${since}`;
    return await baseClient(url);
};

export const getUserGrowthData = async (days = 30) => {
    return await baseClient(`/admin/users/growth?days=${days}`);
};

export const getPropertiesOverview = async () => {
    return await baseClient("/admin/properties/overview");
};

export const getAllProperties = async () => {
    return await baseClient("/admin/properties");
};

export const getPendingVerifications = async () => {
    return await baseClient("/admin/verifications/pending");
};

export const getVerifications = async (status?: string) => {
    let url = "/admin/verifications";
    if (status) url += `?status=${status}`;
    return await baseClient(url);
};

export const updateVerificationStatus = async (ownerId: string, status: 'verified' | 'rejected') => {
    return await baseClient(`/admin/verifications/${ownerId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });
};
