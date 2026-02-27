import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === "fr" ? "en" : "fr";
        i18n.changeLanguage(newLang);
        localStorage.setItem("i18nextLng", newLang);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="h-9 w-9 rounded-full"
            title={i18n.language === "fr" ? "Switch to English" : "Passer en français"}
        >
            <Globe className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Toggle language</span>
        </Button>
    );
}
