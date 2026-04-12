
import { useState, useEffect } from "react";
import { WifiOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export const OfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 shadow-lg border-2">
        <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="font-bold mb-1">
          {t('common.offline_mode', 'Mode Hors-ligne')}
        </AlertTitle>
        <AlertDescription className="text-xs">
          {t('common.offline_message', 'Vous êtes actuellement déconnecté. Vous pouvez toujours consulter vos reçus et locataires précédemment chargés.')}
        </AlertDescription>
      </Alert>
    </div>
  );
};
