import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const current = i18n.resolvedLanguage || "fr";

    const toggleLanguage = () => {
        const newLang = current === "fr" ? "en" : "fr";
        i18n.changeLanguage(newLang);
        localStorage.setItem("i18nextLng", newLang);
    };

    return (
    <Button 
        variant="ghost" 
        onClick={toggleLanguage}
        title={current === "fr" ? "Switch to English" : "Passer en français"}
        aria-label={current === "fr" ? "Switch to English" : "Passer en français"} 
        className="h-8 px-2 sm:h-9 sm:px-3 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 shrink-0"
    >
    <Globe className="hidden sm:block h-4 w-4" />
    <span className="uppercase">{current}</span>
    </Button>
    );
}
