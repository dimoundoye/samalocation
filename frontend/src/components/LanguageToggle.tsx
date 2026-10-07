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
        className="h-9 px-3 rounded-full text-sm font-medium flex items-center gap-1.5"
    >
    <Globe className="h-4 w-4" />
    <span className="uppercase">{current}</span>
    </Button>
    );
}
