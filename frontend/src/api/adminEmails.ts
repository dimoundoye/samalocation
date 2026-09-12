import { baseClient } from "./baseClient";

export interface EmailLog {
    id: string;
    template_id: string;
    subject: string;
    target_audience: string;
    recipient_count: number;
    recipient_emails: string;
    sent_by: string;
    status: 'sent' | 'partial' | 'failed';
    error_message?: string;
    created_at: string;
}

export interface EmailPropertyOption {
    id: string;
    title: string;
    address: string;
    city: string;
    property_type: string;
    price: number;
    bedrooms: number;
    images?: string[];
}

export const getPropertiesForEmail = async (): Promise<EmailPropertyOption[]> => {
    return await baseClient("/admin/emails/properties");
};

export const previewAdminEmail = async (data: { templateId: string; templateData?: any }) => {
    return await baseClient("/admin/emails/preview", {
        method: "POST",
        body: JSON.stringify(data)
    });
};

export const sendAdminEmail = async (data: {
    templateId: string;
    targetAudience: 'all' | 'tenants' | 'owners' | 'custom';
    customRecipientEmail?: string;
    customRecipientName?: string;
    customSubject?: string;
    templateData?: any;
}) => {
    return await baseClient("/admin/emails/send", {
        method: "POST",
        body: JSON.stringify(data)
    });
};

export const getEmailLogs = async (): Promise<EmailLog[]> => {
    return await baseClient("/admin/emails/logs");
};
