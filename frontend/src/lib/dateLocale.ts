import { useTranslation } from "react-i18next";
import { fr, enUS, type Locale } from "date-fns/locale";

const DATE_LOCALES: Record<string, Locale> = { fr, en: enUS };

/** Locale date-fns correspondant à une langue de l'application (français par défaut). */
export const getDateLocale = (language?: string): Locale =>
    DATE_LOCALES[(language || "fr").split("-")[0]] ?? fr;

/** Locale date-fns de la langue active : format(date, "dd MMMM yyyy", { locale: useDateLocale() }). */
export const useDateLocale = (): Locale => {
    const { i18n } = useTranslation();
    return getDateLocale(i18n.resolvedLanguage || i18n.language);
};
