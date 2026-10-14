import { baseClient } from "./baseClient";

export const getAdminStatistics = async (params?: { lastUsersCheck?: string, lastPropertiesCheck?: string }) => {
    return await baseClient("/admin/statistics", { params });
};

export const getRecentUsers = async (limit = 10, since?: string) => {
    let url = `/admin/users/recent?limit=${limit}`;
    if (since) url += `&since=${since}`;
    return await baseClient(url);
};

export const getUserGrowthData = async (options?: number | { period?: 'month' | 'year' | 'day'; year?: number; days?: number }) => {
    if (typeof options === 'number') {
        return await baseClient(`/admin/users/growth?days=${options}`);
    }
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.year) params.append('year', options.year.toString());
    if (options?.days) params.append('days', options.days.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return await baseClient(`/admin/users/growth${query}`);
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

export const getRevenueStats = async (params?: { year?: number | string }) => {
    return await baseClient("/admin/revenue-stats", { params });
};

export const getAdminEvents = async (limit = 20) => {
    return await baseClient(`/admin/events?limit=${limit}`);
};

export const getAdminSubscriptions = async () => {
    return await baseClient("/admin/subscriptions");
};

export const updateUserSubscription = async (userId: string, data: { planName: string, status: string, durationDays?: number, price?: number, subscriptionId?: string, reason?: string }) => {
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

export const verifyPDFDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await baseClient("/admin/verify-document", {
        method: "POST",
        body: formData
    });
};

export const getOwnerBalances = async () => {
    return await baseClient("/admin/owners/balances");
};

export const forceOwnerWithdrawal = async (ownerId: string, data: { customPhone?: string; customProvider?: string; password: string }) => {
    return await baseClient(`/admin/owners/${ownerId}/force-withdrawal`, {
        method: "POST",
        body: JSON.stringify(data)
    });
};

export const getAdminAuditLogs = async (limit = 100) => {
    return await baseClient(`/admin/audit-logs?limit=${limit}`);
};

export const getAllReceipts = async (params?: any) => {
    return await baseClient("/admin/receipts/list", { params });
};

export const getAIPerformance = async (options?: { period?: 'all' | 'month' | 'year'; year?: number; month?: number }) => {
    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.year) params.append('year', options.year.toString());
    if (options?.month) params.append('month', options.month.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return await baseClient(`/admin/ai/performance${query}`);
};
