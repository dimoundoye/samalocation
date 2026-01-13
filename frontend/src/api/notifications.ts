import { baseClient } from "./baseClient";

export const getNotifications = async () => {
    try {
        return await baseClient("/notifications");
    } catch (error) {
        console.error("GetNotifications error:", error);
        return [];
    }
};

export const createNotification = async (data: { user_id: string; type: string; title: string; message: string; link?: string }) => {
    try {
        return await baseClient("/notifications", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("CreateNotification error:", error);
        return null;
    }
};

export const markNotificationAsRead = async (id: string) => {
    try {
        return await baseClient(`/notifications/${id}/read`, {
            method: "PATCH",
        });
    } catch (error) {
        console.error("MarkNotificationAsRead error:", error);
        return null;
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        return await baseClient("/notifications/read-all", {
            method: "PATCH",
        });
    } catch (error) {
        console.error("MarkAllNotificationsAsRead error:", error);
        return null;
    }
};
