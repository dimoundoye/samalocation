import { baseClient, API_BASE_URL } from "./baseClient";
import { CreateContractData, RentalContract } from "@/types";

export const createContract = async (data: CreateContractData): Promise<RentalContract> => {
    return await baseClient('/contracts', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const getOwnerContracts = async (): Promise<RentalContract[]> => {
    return await baseClient('/contracts/owner');
};

export const getTenantContracts = async (): Promise<RentalContract[]> => {
    return await baseClient('/contracts/tenant');
};

export const getContractDetails = async (id: string): Promise<RentalContract> => {
    return await baseClient(`/contracts/${id}`);
};

export const signContract = async (id: string): Promise<RentalContract> => {
    return await baseClient(`/contracts/${id}/sign`, {
        method: 'POST'
    });
};

export const downloadContract = async (id: string, contractNumber: string) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/contracts/${id}/download`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Contrat_${contractNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const verifyContract = async (id: string): Promise<any> => {
    return await baseClient(`/contracts/${id}/verify`);
};
