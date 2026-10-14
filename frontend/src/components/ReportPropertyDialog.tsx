import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reportProperty, type PropertyReportCategory } from "@/api/reports";
import { getVisitorId } from "@/lib/analytics";

const CATEGORIES: PropertyReportCategory[] = ["scam", "unavailable", "misleading", "price", "broker", "inappropriate", "other"];

interface ReportPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName?: string;
}

// Signalement d'une annonce publiée, avec ou sans compte : motif prédéfini + précisions (obligatoires pour « Autre »).
// Sans compte : coordonnées facultatives pour être recontacté.
export const ReportPropertyDialog = ({ open, onOpenChange, propertyId, propertyName }: ReportPropertyDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [category, setCategory] = useState<PropertyReportCategory | "">("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  // Champ invisible : seul un robot le remplit
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory("");
      setDetails("");
      setContact("");
      setWebsite("");
    }
  }, [open]);

  const detailsRequired = category === "other";
  const contactValue = contact.trim();
  const contactValid = !contactValue || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue) || /^\+?[\d\s.-]{8,20}$/.test(contactValue);
  const canSubmit = !!category && (!detailsRequired || details.trim().length >= 10) && (!!user || contactValid) && !submitting;

  const handleSubmit = async () => {
    if (!category) return;
    setSubmitting(true);
    try {
      await reportProperty(
        propertyId,
        category,
        details.trim(),
        user ? {} : { contact: contactValue || undefined, visitorId: getVisitorId(), website: website || undefined }
      );
      toast({ title: t("report_property.sent_title"), description: t("report_property.sent_desc") });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: (error instanceof Error && error.message) || t("report_property.error"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive shrink-0" />
            {t("report_property.title")}
          </DialogTitle>
          <DialogDescription>
            {propertyName ? t("report_property.desc_named", { name: propertyName }) : t("report_property.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={category} onValueChange={(v) => setCategory(v as PropertyReportCategory)} className="space-y-1">
            {CATEGORIES.map((key) => (
              <Label
                key={key}
                htmlFor={`report-${key}`}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer font-normal transition-colors ${category === key ? "border-primary bg-primary/5" : "hover:bg-secondary"}`}
              >
                <RadioGroupItem value={key} id={`report-${key}`} />
                <span className="text-sm">{t(`report_property.categories.${key}`)}</span>
              </Label>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="report-details" className="text-sm">
              {detailsRequired ? t("report_property.details_required") : t("report_property.details_optional")}
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
              placeholder={t("report_property.details_placeholder")}
              rows={3}
            />
            {detailsRequired && details.trim().length < 10 && (
              <p className="text-xs text-muted-foreground">{t("report_property.details_min")}</p>
            )}
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="report-contact" className="text-sm">{t("report_property.contact_label")}</Label>
              <Input
                id="report-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 255))}
                placeholder={t("report_property.contact_placeholder")}
                autoComplete="email"
              />
              {!contactValid && <p className="text-xs text-destructive">{t("report_property.contact_invalid")}</p>}
            </div>
          )}

          {/* Piège à robots : invisible et ignoré par les personnes */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <p className="text-xs text-muted-foreground">{t("report_property.confidential")}</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            {t("report_property.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
