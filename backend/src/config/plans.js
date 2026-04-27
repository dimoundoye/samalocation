/**
 * Configuration des plans d'abonnement pour Samalocation
 */
const PLANS = {
    FREE: {
        id: 'free',
        name: 'Gratuit',
        price_monthly: 0,
        price_annual: 0,
        limits: {
            max_properties: Infinity,
            max_tenants: 5,
            max_receipts_per_month: 5,
            ai_descriptions_per_month: 0,
            custom_branding: false,
            excel_reports: false,
            inventory_contract: false,
            electronic_signature: false
        }
    },
    PREMIUM: {
        id: 'premium',
        name: 'Premium',
        price_monthly: 5000,
        price_annual: 54000, // ~10% de réduction (5000 * 12 * 0.9)
        limits: {
            max_properties: Infinity,
            max_tenants: 15,
            max_receipts_per_month: Infinity,
            ai_descriptions_per_month: 15, // Augmenté à 15 selon les détails
            custom_branding: false,
            excel_reports: false,
            inventory_contract: true,
            electronic_signature: true
        }
    },
    PROFESSIONAL: {
        id: 'professional',
        name: 'Professionnel',
        price_monthly: 15000,
        price_annual: 162000, // ~10% de réduction
        limits: {
            max_properties: Infinity,
            max_tenants: Infinity,
            max_receipts_per_month: Infinity,
            ai_descriptions_per_month: Infinity,
            custom_branding: true,
            excel_reports: true,
            multi_user: true,
            inventory_contract: true,
            electronic_signature: true
        }
    }
};

module.exports = PLANS;
