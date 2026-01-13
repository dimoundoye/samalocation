import { baseClient } from "./baseClient";

export const getMessages = async () => {
    try {
        return await baseClient("/messages");
    } catch (error) {
        console.error("GetMessages error:", error);
        return [];
    }
};

export const sendMessage = async (data: { receiver_id: string; message: string; property_id?: string }) => {
    try {
        return await baseClient("/messages", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("SendMessage error:", error);
        throw error;
    }
};

export const markMessagesAsRead = async (messageIds: string[]) => {
    try {
        return await baseClient("/messages/read", {
            method: "PATCH",
            body: JSON.stringify({ messageIds }),
        });
    } catch (error) {
        console.error("MarkMessagesAsRead error:", error);
        return null;
    }
};

export const deleteMessage = async (messageId: string) => {
    try {
        return await baseClient(`/messages/${messageId}`, {
            method: "DELETE",
        });
    } catch (error) {
        console.error("DeleteMessage error:", error);
        throw error;
    }
};
