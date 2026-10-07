import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IOSInstallSteps } from "./IOSInstallSteps";
import { BravePushDisabledError, disablePush, enablePush, getCurrentSubscription, getPushAvailability, isPushOptedIn } from "@/lib/push";
import { promptInstall, useCanInstall } from "@/lib/installPrompt";

export const PushNotificationSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const canInstall = useCanInstall();
  const availability = getPushAvailability();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [braveBlocked, setBraveBlocked] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    availability === "supported" ? Notification.permission : null
  );

  useEffect(() => {
    if (availability !== "supported" || !user?.id) return;
    getCurrentSubscription()
      .then((subscription) => setEnabled(Boolean(subscription) && isPushOptedIn(user.id)))
      .catch(() => setEnabled(false));
  }, [availability, user?.id]);

  const handleToggle = async (checked: boolean) => {
    if (!user?.id) return;
    setBusy(true);
    setBraveBlocked(false);
    try {
      if (checked) {
        const result = await enablePush(user.id);
        setPermission(result);
        setEnabled(result === "granted");
        if (result === "granted") {
          toast({ title: t("settings.push.enabled_toast") });
        }
      } else {
        await disablePush();
        setEnabled(false);
        toast({ title: t("settings.push.disabled_toast") });
      }
    } catch (error) {
      if (error instanceof BravePushDisabledError) {
        setBraveBlocked(true);
        return;
      }
      console.error("Push toggle error:", error);
      toast({ title: t("common.error"), description: t("settings.push.error"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const renderBody = () => {
    switch (availability) {
      case "ios-needs-install":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("settings.push.ios_install_title")}</p>
            <IOSInstallSteps />
          </div>
        );
      case "ios-too-old":
        return <p className="text-sm text-muted-foreground">{t("settings.push.ios_too_old")}</p>;
      case "unsupported":
        return <p className="text-sm text-muted-foreground">{t("settings.push.unsupported")}</p>;
      default:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="push-toggle" className="flex-1 cursor-pointer">
                {t("settings.push.toggle_label")}
                <span className="block text-xs font-normal text-muted-foreground">
                  {t("settings.push.toggle_hint")}
                </span>
              </Label>
              <Switch
                id="push-toggle"
                checked={enabled}
                disabled={busy || permission === "denied"}
                onCheckedChange={handleToggle}
              />
            </div>
            {braveBlocked && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{t("settings.push.brave_disabled")}</p>
            )}
            {permission === "denied" && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{t("settings.push.blocked")}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("settings.push.title")}
        </CardTitle>
        <CardDescription>{t("settings.push.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderBody()}
        {canInstall && (
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("settings.push.install_hint")}</p>
            <Button variant="outline" size="sm" onClick={() => promptInstall()}>
              <Download className="mr-2 h-4 w-4" />
              {t("settings.push.install_button")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
