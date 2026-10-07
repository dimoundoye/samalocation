import { Share, SquarePlus, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

// Étapes pour ajouter l'app à l'écran d'accueil sur iPhone/iPad (installation impossible par un bouton sur iOS)
export const IOSInstallSteps = () => {
  const { t } = useTranslation();
  const steps = [
    { icon: Share, text: t("settings.push.ios_step_share") },
    { icon: SquarePlus, text: t("settings.push.ios_step_add") },
    { icon: Smartphone, text: t("settings.push.ios_step_open") },
  ];

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {steps.map(({ icon: Icon, text }, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="flex-1 pt-0.5">{text}</span>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">{t("settings.push.ios_relogin_note")}</p>
    </div>
  );
};
