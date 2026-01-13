import { baseClient } from "./baseClient";

export const getAdminStatistics = async (params?: { lastUsersCheck?: string, lastPropertiesCheck?: string }) => {
    return await baseClient("/admin/statistics", { params });
};

export const getRecentUsers = async (limit = 10) => {
    return await baseClient(`/admin/users/recent?limit=${limit}`);
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
