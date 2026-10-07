import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BravePushDisabledError, enablePush, getPushAvailability } from "@/lib/push";
import { IOSInstallSteps } from "./IOSInstallSteps";

// Invitation à activer les notifications, réservée aux utilisateurs connectés, sur les tableaux de bord.
// La demande d'autorisation du navigateur n'est affichée qu'après un clic sur « Activer » :
// un refus dans le navigateur est définitif, on ne la montre donc qu'aux utilisateurs intéressés.
// « Plus tard » : l'invitation revient 14 jours après, 3 fois au maximum (par compte et par appareil).

const REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_SHOWS = 3;
const SHOW_DELAY_MS = 4000;

type InviteState = { count: number; last: number };

const storageKey = (userId: string) => `push_invite_${userId}`;

const readState = (userId: string): InviteState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) || "null");
    if (parsed && typeof parsed.count === "number" && typeof parsed.last === "number") return parsed;
  } catch { /* stockage indisponible ou valeur invalide */ }
  return { count: 0, last: 0 };
};

const recordShown = (userId: string) => {
  const state = readState(userId);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ count: state.count + 1, last: Date.now() }));
  } catch { /* stockage indisponible */ }
};

const isDue = (userId: string) => {
  const { count, last } = readState(userId);
  return count < MAX_SHOWS && Date.now() - last >= REMIND_AFTER_MS;
};

const isDashboardPage = (pathname: string) =>
  /^\/(owner|tenant|admin)-dashboard(\/|$)/.test(pathname) && !pathname.includes("/contract-editor");

/** Invitation utile sur cet appareil : iPhone à installer, ou autorisation jamais demandée */
const getInviteKind = () => {
  const availability = getPushAvailability();
  if (availability === "ios-needs-install") return "ios" as const;
  if (availability === "supported" && Notification.permission === "default") return "enable" as const;
  return null;
};

export const PushInvitePrompt = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const kind = getInviteKind();
  const onDashboard = isDashboardPage(pathname);

  // Apparition quelques secondes après l'arrivée sur un tableau de bord
  useEffect(() => {
    if (!user?.id || !kind || !onDashboard || visible || !isDue(user.id)) return;
    const timer = setTimeout(() => {
      recordShown(user.id);
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user?.id, kind, onDashboard, visible, pathname]);

  // Déconnexion ou sortie des tableaux de bord : on retire l'invitation
  useEffect(() => {
    if (!user || !onDashboard) setVisible(false);
  }, [user, onDashboard]);

  if (!visible || !user) return null;

  const handleEnable = async () => {
    setBusy(true);
    try {
      const permission = await enablePush(user.id);
      if (permission === "granted") {
        toast({ title: t("settings.push.enabled_toast") });
      }
      setVisible(false);
    } catch (error) {
      if (error instanceof BravePushDisabledError) {
        toast({ title: t("settings.push.brave_title"), description: t("settings.push.brave_disabled"), duration: 15000 });
      } else {
        console.error("Push invite error:", error);
        toast({ title: t("common.error"), description: t("settings.push.error"), variant: "destructive" });
      }
      setVisible(false);
    } finally {
      setBusy(false);
    }
  };

  const isIOS = kind === "ios";

  return (
    <>
      <div
        role="dialog"
        aria-labelledby="push-invite-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border bg-background p-4 shadow-lg animate-fade-in sm:left-auto sm:right-6 sm:mx-0"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p id="push-invite-title" className="text-sm font-semibold">
              {t(isIOS ? "settings.push.ios_banner_title" : "settings.push.invite_title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(isIOS ? "settings.push.ios_banner_text" : "settings.push.invite_text")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isIOS ? (
              <Button size="sm" onClick={() => setShowSteps(true)}>
                {t("settings.push.ios_banner_how")}
              </Button>
            ) : (
              <Button size="sm" onClick={handleEnable} disabled={busy}>
                {busy ? t("common.loading") : t("settings.push.invite_enable")}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)} disabled={busy}>
              {t("settings.push.invite_later")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isIOS && (
        <Dialog
          open={showSteps}
          onOpenChange={(open) => {
            setShowSteps(open);
            if (!open) setVisible(false);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("settings.push.ios_install_title")}</DialogTitle>
              <DialogDescription>{t("settings.push.ios_banner_text")}</DialogDescription>
            </DialogHeader>
            <IOSInstallSteps />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
