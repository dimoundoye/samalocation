import { baseClient } from "./baseClient";
import type { PaymentMethod } from "@/lib/paymentMethods";

// Propriétaire : coordonnées de paiement du loyer
export const getMyPaymentMethods = async (): Promise<{ methods: PaymentMethod[]; updated_at: string | null }> => {
    return await baseClient("/payment-methods/methods");
};

export const updateMyPaymentMethods = async (methods: PaymentMethod[]) => {
    return await baseClient("/payment-methods/methods", {
        method: "PUT",
        body: JSON.stringify({ methods })
    });
};

// Locataire : coordonnées de son bailleur pour un bail actif
export const getLeasePaymentMethods = async (leaseId: string): Promise<{ methods: PaymentMethod[] }> => {
    return await baseClient(`/payment-methods/lease/${leaseId}`);
};
