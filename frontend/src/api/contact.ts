import { baseClient } from "./baseClient";

export const getContactMessages = async () => {
    return await baseClient("/contact");
};

export const updateContactMessageStatus = async (id: string, status: 'new' | 'replied' | 'archived') => {
    return await baseClient(`/contact/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });
};

export const replyContactMessage = async (id: string, data: { replyMessage: string; replySubject?: string }) => {
    return await baseClient(`/contact/${id}/reply`, {
        method: "POST",
        body: JSON.stringify(data)
    });
};

