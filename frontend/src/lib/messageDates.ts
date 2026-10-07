import { format, isSameDay, isSameYear, isToday, isYesterday, type Locale } from "date-fns";
import type { TFunction } from "i18next";

// Dates des messageries : séparateurs par jour et date du dernier message dans la liste des conversations.

/** Séparateur de jour : « Aujourd'hui », « Hier », « Lundi 28 septembre » (année ajoutée si différente). */
export const formatMessageDay = (date: Date, locale: Locale, t: TFunction) => {
  if (isToday(date)) return t("dashboard.common.today");
  if (isYesterday(date)) return t("dashboard.common.yesterday");
  const label = format(date, isSameYear(date, new Date()) ? "EEEE d MMMM" : "EEEE d MMMM yyyy", { locale });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Liste des conversations : l'heure si aujourd'hui, « Hier », sinon la date courte. */
export const formatConversationTime = (date: Date, locale: Locale, t: TFunction) => {
  if (isToday(date)) return format(date, "p", { locale });
  if (isYesterday(date)) return t("dashboard.common.yesterday");
  return format(date, isSameYear(date, new Date()) ? "d MMM" : "dd/MM/yyyy", { locale });
};

/** true si le message ouvre un nouveau jour par rapport au précédent (affichage d'un séparateur). */
export const startsNewDay = (current: string, previous?: string) =>
  !previous || !isSameDay(new Date(current), new Date(previous));
