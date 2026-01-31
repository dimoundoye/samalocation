import { getProperties, getPropertyById, getSimilarProperties, getOwnerProperties, createProperty, createPropertyUnits, togglePropertyPublication, deleteProperty, updateProperty } from "../api/properties";
import { getMessages, sendMessage, markMessagesAsRead, deleteMessage } from "../api/messages";
import { getNotifications, createNotification, markNotificationAsRead, markAllNotificationsAsRead } from "../api/notifications";
import { login, signup, getMe, searchUsers, createTenantAccount, completeSetup } from "../api/auth";
import { getTenantMe, getOwnerTenants, assignTenant, updateTenant, deleteTenant, updateTenantProfile } from "../api/tenant";
import { getOwnerProfile, updateOwnerProfile } from "../api/owner";
import { getReceipts, getTenantReceipts, getOwnerReceipts, createReceipt, downloadReceipt, deleteReceipt } from "../api/receipts";
import { createReport, getAllReports, getReportStatistics, updateReport, getAllUsers, blockUser, unblockUser } from "../api/reports";
import { getAdminStatistics, getRecentUsers, getUserGrowthData, getPropertiesOverview, getAllProperties, getPendingVerifications, updateVerificationStatus } from "../api/admin";
import { getContactMessages, updateContactMessageStatus } from "../api/contact";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


export {
    getProperties, getPropertyById, getSimilarProperties, getOwnerProperties, createProperty, createPropertyUnits, togglePropertyPublication, deleteProperty, updateProperty,
    getMessages, sendMessage, markMessagesAsRead, deleteMessage,
    getNotifications, createNotification, markNotificationAsRead, markAllNotificationsAsRead,
    getMe, searchUsers, createTenantAccount, completeSetup,
    getTenantMe, getOwnerTenants, assignTenant, updateTenant, deleteTenant, updateTenantProfile,
    getOwnerProfile, updateOwnerProfile,
    getReceipts, getTenantReceipts, getOwnerReceipts, createReceipt, downloadReceipt, deleteReceipt,
    createReport, getAllReports, getReportStatistics, updateReport, getAllUsers, blockUser, unblockUser,
    getAdminStatistics, getRecentUsers, getUserGrowthData, getPropertiesOverview, getAllProperties, getPendingVerifications, updateVerificationStatus,
    getContactMessages, updateContactMessageStatus
};


export const getHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error("Health check failed:", error);
        return { status: "error" };
    }
};

export { login, signup } from "../api/auth";


export const uploadPhotos = async (files: File[]) => {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    files.forEach(file => {
        formData.append("photos", file);
    });

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Upload failed");

        const baseUrl = API_BASE_URL.replace("/api", "");
        return data.urls.map((url: string) => {
            if (url.startsWith('http')) return url;
            return `${baseUrl}${url}`;
        });

    } catch (error) {
        console.error("UploadPhotos error:", error);
        throw error;
    }
};
export const generateAIDescription = async (propertyData: any) => {
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_BASE_URL}/ai/generate-description`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(propertyData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Generation failed");
        return data.data.description;
    } catch (error) {
        console.error("GenerateAIDescription error:", error);
        throw error;
    }
};

export const parseSmartSearch = async (query: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/parse-search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Parse failed");
        return data.data.filters;
    } catch (error) {
        console.error("ParseSmartSearch error:", error);
        throw error;
    }
};

export const getAIChatResponse = async (message: string, history: any[] = []) => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message, history }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Chat failed");
        return data.data.response;
    } catch (error) {
        console.error("GetAIChatResponse error:", error);
        throw error;
    }
};

// --- Maintenance Requests ---

export const getTenantMaintenanceRequests = async () => {
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/tenant`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch maintenance requests");
        return data.data;
    } catch (error) {
        console.error("GetTenantMaintenanceRequests error:", error);
        throw error;
    }
};

export const getOwnerMaintenanceRequests = async () => {
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/owner`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch maintenance requests");
        return data.data;
    } catch (error) {
        console.error("GetOwnerMaintenanceRequests error:", error);
        throw error;
    }
};

export const createMaintenanceRequest = async (requestData: any) => {
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to create maintenance request");
        return data.data;
    } catch (error) {
        console.error("CreateMaintenanceRequest error:", error);
        throw error;
    }
};

export const updateMaintenanceRequestStatus = async (id: string, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update maintenance status");
        return data.data;
    } catch (error) {
        console.error("UpdateMaintenanceRequestStatus error:", error);
        throw error;
    }
};

