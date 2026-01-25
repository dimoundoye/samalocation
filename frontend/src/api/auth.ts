import { baseClient } from "./baseClient";

export const login = async (credentials: any) => {
    try {
        const data = await baseClient("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
        return data;
    } catch (error: any) {
        console.error("Login error:", error);
        throw error;
    }
};

export const signup = async (userData: any) => {
    try {
        const data = await baseClient("/auth/signup", {
            method: "POST",
            body: JSON.stringify(userData),
        });
        return data;
    } catch (error: any) {
        console.error("Signup error:", error);
        throw error;
    }
};

export const getMe = async () => {
    try {
        return await baseClient("/auth/me");
    } catch (error) {
        console.error("GetMe error:", error);
        return null;
    }
};

export const searchUsers = async (query: string, role?: string) => {
    try {
        const params = new URLSearchParams({ q: query });
        if (role) params.append('role', role);
        return await baseClient(`/auth/users/search?${params.toString()}`);
    } catch (error) {
        console.error("SearchUsers error:", error);
        return [];
    }
};

export const createTenantAccount = async (userData: any) => {
    try {
        return await baseClient("/auth/create-tenant-account", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    } catch (error: any) {
        console.error("CreateTenantAccount error:", error);
        throw error;
    }
};

export const completeSetup = async (setupData: any) => {
    try {
        return await baseClient("/auth/complete-setup", {
            method: "POST",
            body: JSON.stringify(setupData),
        });
    } catch (error: any) {
        console.error("CompleteSetup error:", error);
        throw error;
    }
};
