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

export const getAdminTransactions = async (limit = 20) => {
    return await baseClient(`/admin/transactions?limit=${limit}`);
};

export const getRevenueStats = async () => {
    return await baseClient("/admin/revenue-stats");
};

export const getAdminEvents = async (limit = 20) => {
    return await baseClient(`/admin/events?limit=${limit}`);
};

export const updateUserSubscription = async (userId: string, data: { planName: string, status: string, durationDays?: number, price?: number, subscriptionId?: string }) => {
    return await baseClient(`/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
};
export const getLiveAnalytics = async () => {
    return await baseClient("/admin/analytics/live");
};

export const getPlatformSettings = async () => {
    return await baseClient("/admin/platform/settings");
};

export const updatePlatformSetting = async (key: string, value: any) => {
    return await baseClient("/admin/platform/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, value })
    });
};
