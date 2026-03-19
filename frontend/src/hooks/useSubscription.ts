import { useState, useEffect } from "react";
import { getMySubscription } from "@/lib/api";

export const useSubscription = () => {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const sub = await getMySubscription();
            setSubscription(sub || {
                plan_name: "gratuit",
                status: "active",
                properties_count: 0,
                properties_limit: 2,
                receipts_this_month: 0,
                receipts_limit: 3,
                limits: {
                    max_properties: 2,
                    max_receipts_per_month: 3,
                    ai_descriptions_per_month: 0,
                    custom_branding: false,
                    excel_reports: false,
                    inventory_contract: false
                }
            });
        } catch (error) {
            console.error("Failed to load subscription in hook", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscription();
    }, []);

    const hasFeature = (feature: string) => {
        if (!subscription || !subscription.limits) return false;
        
        switch (feature) {
            case 'ai':
                return subscription.limits.ai_descriptions_per_month !== 0;
            case 'branding':
                return subscription.limits.custom_branding;
            case 'excel':
                return subscription.limits.excel_reports;
            case 'multi_user':
                return subscription.limits.multi_user;
            case 'inventory_contract':
                return subscription.limits.inventory_contract;
            case 'unlimited_receipts':
                return subscription.limits.max_receipts_per_month === -1 || subscription.limits.max_receipts_per_month === Infinity;
            default:
                return false; // Safely return false for unknown features
        }
    };

    const isAtPropertyLimit = () => {
        if (!subscription) return false;
        return subscription.properties_count >= subscription.properties_limit;
    };

    return {
        subscription,
        loading,
        hasFeature,
        isAtPropertyLimit,
        refreshSubscription: loadSubscription
    };
};
