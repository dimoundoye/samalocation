import { baseClient } from "./baseClient";

export const getOwnerProfile = async () => {
    try {
        return await baseClient("/owner/profile");
    } catch (error) {
        console.error("GetOwnerProfile error:", error);
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
