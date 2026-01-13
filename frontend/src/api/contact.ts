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
