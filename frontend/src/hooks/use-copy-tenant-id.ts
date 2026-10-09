import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

/**
 * Copie l'identifiant du locataire (à transmettre au propriétaire pour l'affectation au logement)
 */
export const useCopyTenantId = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    return async (customId: string) => {
        try {
            await navigator.clipboard.writeText(customId);
            toast({ title: t('tenant.id_copied'), description: t('tenant.id_copied_desc') });
        } catch {
            toast({ title: t('common.error'), description: t('tenant.id_copy_error'), variant: "destructive" });
        }
    };
};
