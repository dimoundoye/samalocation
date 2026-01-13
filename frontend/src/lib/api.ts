import { getProperties, getPropertyById, getOwnerProperties, createProperty, createPropertyUnits, togglePropertyPublication, deleteProperty } from "../api/properties";
import { getMessages, sendMessage, markMessagesAsRead, deleteMessage } from "../api/messages";
import { getNotifications, createNotification, markNotificationAsRead, markAllNotificationsAsRead } from "../api/notifications";
import { login, signup, getMe, searchUsers } from "../api/auth";
import { getTenantMe, getOwnerTenants, assignTenant, updateTenant, deleteTenant, updateTenantProfile } from "../api/tenant";
import { getOwnerProfile, updateOwnerProfile } from "../api/owner";
import { getReceipts, getTenantReceipts, getOwnerReceipts, createReceipt, downloadReceipt, deleteReceipt } from "../api/receipts";
import { createReport, getAllReports, getReportStatistics, updateReport, getAllUsers, blockUser, unblockUser } from "../api/reports";
import { getAdminStatistics, getRecentUsers, getUserGrowthData, getPropertiesOverview, getAllProperties } from "../api/admin";
import { getContactMessages, updateContactMessageStatus } from "../api/contact";

const API_BASE_URL = "http://localhost:5000/api";

export {
    getProperties, getPropertyById, getOwnerProperties, createProperty, createPropertyUnits, togglePropertyPublication, deleteProperty,
    getMessages, sendMessage, markMessagesAsRead, deleteMessage,
    getNotifications, createNotification, markNotificationAsRead, markAllNotificationsAsRead,
    login, signup, getMe, searchUsers,
    getTenantMe, getOwnerTenants, assignTenant, updateTenant, deleteTenant, updateTenantProfile,
    getOwnerProfile, updateOwnerProfile,
    getReceipts, getTenantReceipts, getOwnerReceipts, createReceipt, downloadReceipt, deleteReceipt,
    createReport, getAllReports, getReportStatistics, updateReport, getAllUsers, blockUser, unblockUser,
    getAdminStatistics, getRecentUsers, getUserGrowthData, getPropertiesOverview, getAllProperties,
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
        return data.urls.map((url: string) => `${baseUrl}${url}`);
    } catch (error) {
        console.error("UploadPhotos error:", error);
        throw error;
    }
};
