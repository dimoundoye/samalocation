import { baseClient } from "./baseClient";

export const getTenantMe = async () => {
    try {
        return await baseClient("/tenants/me");
    } catch (error) {
        console.error("GetTenantMe error:", error);
        return null;
    }
};

export const updateTenantProfile = async (data: any) => {
    try {
        return await baseClient("/tenants/me/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("UpdateTenantProfile error:", error);
        throw error;
    }
};

export const getOwnerTenants = async () => {
    try {
        return await baseClient("/tenants/owner");
    } catch (error) {
        console.error("GetOwnerTenants error:", error);
        return [];
    }
};

export const assignTenant = async (data: any) => {
    try {
        return await baseClient("/tenants", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("AssignTenant error:", error);
        throw error;
    }
};

export const updateTenant = async (id: string, data: any) => {
    try {
        return await baseClient(`/tenants/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("UpdateTenant error:", error);
        throw error;
    }
};

export const deleteTenant = async (id: string) => {
    try {
        return await baseClient(`/tenants/${id}`, {
            method: "DELETE",
        });
    } catch (error) {
        console.error("DeleteTenant error:", error);
        throw error;
    }
};
