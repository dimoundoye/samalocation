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
                properties_limit: 5,
                receipts_this_month: 0,
                receipts_limit: 5,
                limits: {
                    max_properties: -1,
                    max_tenants: 5,
                    max_receipts_per_month: 5,
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
            case 'signature':
                return true; // Always available now
            case 'unlimited_receipts':
                return subscription.limits.max_receipts_per_month === -1 || subscription.limits.max_receipts_per_month === Infinity;
            default:
                return false; // Safely return false for unknown features
        }
    };

    const isAtPropertyLimit = () => {
        if (!subscription) return false;
        // As per new policy, property adding is free for everyone.
        // Also handling -1 as unlimited.
        if (subscription.properties_limit === -1) return false;
        return false; // Force false as it's now free for all
    };

    return {
        subscription,
        loading,
        hasFeature,
        isAtPropertyLimit,
        refreshSubscription: loadSubscription
    };
};
