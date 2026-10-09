import { Button } from "@/components/ui/button";
import { Copy, IdCard, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCopyTenantId } from "@/hooks/use-copy-tenant-id";

interface TenantIdCardProps {
    customId: string;
    /** hero : grande carte de l'accueil (locataire sans logement) ; compact : bloc des paramètres */
    variant?: "hero" | "compact";
}

/**
 * Identifiant Samalocation du locataire, bien visible, avec copie et partage
 */
export const TenantIdCard = ({ customId, variant = "hero" }: TenantIdCardProps) => {
    const { t } = useTranslation();
    const copyId = useCopyTenantId();

    const shareId = async () => {
        const text = t('tenant.id_share_text', { id: customId });
        if (navigator.share) {
            try {
                await navigator.share({ title: t('tenant.id_card_title'), text });
                return;
            } catch {
                // Partage annulé ou indisponible : repli sur WhatsApp
            }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    if (variant === "compact") {
        return (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('tenant.id_label')}</p>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xl font-bold text-primary tracking-wider break-all">{customId}</span>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => copyId(customId)}>
                        <Copy className="h-3.5 w-3.5" />
                        {t('tenant.copy')}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('tenant.id_card_desc')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-primary shrink-0" />
                        {t('tenant.id_card_title')}
                    </p>
                    <p className="font-mono text-2xl sm:text-3xl font-bold text-primary tracking-wider break-all">{customId}</p>
                    <p className="text-sm text-muted-foreground">{t('tenant.id_card_desc')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button type="button" className="flex-1 sm:flex-initial gap-2" onClick={() => copyId(customId)}>
                        <Copy className="h-4 w-4" />
                        {t('tenant.copy')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 sm:flex-initial gap-2 text-[#128C7E] border-[#25D366]/40 hover:bg-[#25D366]/10"
                        onClick={shareId}
                    >
                        <Share2 className="h-4 w-4" />
                        {t('tenant.share_id')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
