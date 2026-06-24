import { baseClient } from "./baseClient";

export const getOwnerProfile = async () => {
    try {
        return await baseClient("/owner/profile");
    } catch (error) {
        console.error("GetOwnerProfile error:", error);
        return null;
    }
};

export const getPublicOwnerProfile = async (id: string) => {
    try {
        return await baseClient(`/owner/${id}/public-profile`);
    } catch (error) {
        console.error("GetPublicOwnerProfile error:", error);
        return null;
    }
};

export const updateOwnerProfile = async (data: any) => {
    try {
        return await baseClient("/owner/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("UpdateOwnerProfile error:", error);
        return null;
    }
};

export const getCollaborators = async () => {
    try {
        const response = await baseClient("/owner/collaborators");
        return response;
    } catch (error) {
        console.error("GetCollaborators error:", error);
        return [];
    }
};

export const addCollaborator = async (data) => {
    try {
        return await baseClient("/owner/collaborators", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("AddCollaborator error:", error);
        throw error;
    }
};

export const updateCollaboratorPermissions = async (id: string, permissions: any) => {
    try {
        return await baseClient(`/owner/collaborators/${id}/permissions`, {
            method: "PATCH",
            body: JSON.stringify({ permissions }),
        });
    } catch (error) {
        console.error("UpdateCollaboratorPermissions error:", error);
        throw error;
    }
};

export const removeCollaborator = async (id: string) => {
    try {
        return await baseClient(`/owner/collaborators/${id}`, {
            method: "DELETE",
        });
    } catch (error) {
        console.error("RemoveCollaborator error:", error);
        throw error;
    }
};

export const getInvitationDetails = async (token: string) => {
    try {
        return await baseClient(`/owner/invitations/${token}`);
    } catch (error) {
        console.error("GetInvitationDetails error:", error);
        throw error;
    }
};

export const acceptInvitation = async (token: string) => {
    try {
        return await baseClient(`/owner/invitations/${token}/accept`, {
            method: "POST",
        });
    } catch (error) {
        console.error("AcceptInvitation error:", error);
        throw error;
    }
};

export const getActivityLog = async (params?: {
    page?: number;
    limit?: number;
    actor_id?: string;
    entity_type?: string;
    action?: string;
}) => {
    try {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.actor_id) query.set('actor_id', params.actor_id);
        if (params?.entity_type) query.set('entity_type', params.entity_type);
        if (params?.action) query.set('action', params.action);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return await baseClient(`/owner/activity-log${qs}`);
    } catch (error) {
        console.error("GetActivityLog error:", error);
        return null;
    }
};

export const logFrontendActivity = async (data: {
    action: string;
    entityType: string;
    entityId?: string;
    entityLabel: string;
    metadata?: Record<string, any>;
}) => {
    try {
        await baseClient("/owner/activity-log", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        // Silencieux — ne jamais bloquer l'action principale
        console.warn("[logFrontendActivity] Failed silently:", error);
    }
};

