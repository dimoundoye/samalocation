import { baseClient } from "./baseClient";

export const getProperties = async (params: { limit?: number; page?: number; search?: string; type?: string } = {}) => {
    try {
        return await baseClient("/properties", { params });
    } catch (error) {
        console.error("Failed to fetch properties:", error);
        return { properties: [], pagination: { total: 0, pages: 0, current_page: 1, limit: 20 } };
    }
};

export const getPropertyById = async (id: string) => {
    try {
        return await baseClient(`/properties/${id}`);
    } catch (error) {
        console.error(`Failed to fetch property ${id}:`, error);
        return null;
    }
};

export const getSimilarProperties = async (id: string) => {
    try {
        return await baseClient(`/properties/${id}/similar`);
    } catch (error) {
        console.error(`Failed to fetch similar properties for ${id}:`, error);
        return [];
    }
};

export const getOwnerProperties = async () => {
    try {
        return await baseClient("/properties/owner");
    } catch (error) {
        console.error("GetOwnerProperties error:", error);
        return [];
    }
};

export const createProperty = async (data: any) => {
    try {
        return await baseClient("/properties", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("CreateProperty error:", error);
        return null;
    }
};

export const createPropertyUnits = async (propertyId: string, units: any[]) => {
    try {
        return await baseClient("/properties/units", {
            method: "POST",
            body: JSON.stringify({ property_id: propertyId, units }),
        });
    } catch (error) {
        console.error("CreatePropertyUnits error:", error);
        return null;
    }
};

export const togglePropertyPublication = async (id: string) => {
    try {
        return await baseClient(`/properties/${id}/publish`, {
            method: "PATCH",
        });
    } catch (error) {
        console.error("TogglePropertyPublication error:", error);
        return null;
    }
};

export const deleteProperty = async (id: string) => {
    try {
        return await baseClient(`/properties/${id}`, {
            method: "DELETE",
        });
    } catch (error) {
        console.error("DeleteProperty error:", error);
        throw error;
    }
};

export const updateProperty = async (id: string, data: any) => {
    try {
        return await baseClient(`/properties/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("UpdateProperty error:", error);
        return null;
    }
};
