import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

// Indicatifs proposés : Sénégal par défaut, puis la sous-région et la diaspora.
// min/max = nombre de chiffres du numéro national (sans l'indicatif).
export const PHONE_COUNTRIES = [
    { iso: "SN", name: "Sénégal", dial: "+221", min: 9, max: 9, placeholder: "77 123 45 67" },
    { iso: "ML", name: "Mali", dial: "+223", min: 8, max: 8, placeholder: "70 12 34 56" },
    { iso: "MR", name: "Mauritanie", dial: "+222", min: 8, max: 8, placeholder: "22 12 34 56" },
    { iso: "GM", name: "Gambie", dial: "+220", min: 7, max: 7, placeholder: "301 2345" },
    { iso: "GN", name: "Guinée", dial: "+224", min: 9, max: 9, placeholder: "621 23 45 67" },
    { iso: "GW", name: "Guinée-Bissau", dial: "+245", min: 7, max: 9, placeholder: "955 123 456" },
    { iso: "CV", name: "Cap-Vert", dial: "+238", min: 7, max: 7, placeholder: "991 12 34" },
    { iso: "CI", name: "Côte d'Ivoire", dial: "+225", min: 10, max: 10, placeholder: "07 12 34 56 78" },
    { iso: "BF", name: "Burkina Faso", dial: "+226", min: 8, max: 8, placeholder: "70 12 34 56" },
    { iso: "NE", name: "Niger", dial: "+227", min: 8, max: 8, placeholder: "90 12 34 56" },
    { iso: "TG", name: "Togo", dial: "+228", min: 8, max: 8, placeholder: "90 12 34 56" },
    { iso: "BJ", name: "Bénin", dial: "+229", min: 8, max: 10, placeholder: "01 90 12 34 56" },
    { iso: "MA", name: "Maroc", dial: "+212", min: 9, max: 9, placeholder: "612 34 56 78" },
    { iso: "FR", name: "France", dial: "+33", min: 9, max: 9, placeholder: "6 12 34 56 78" },
    { iso: "BE", name: "Belgique", dial: "+32", min: 8, max: 9, placeholder: "470 12 34 56" },
    { iso: "ES", name: "Espagne", dial: "+34", min: 9, max: 9, placeholder: "612 34 56 78" },
    { iso: "IT", name: "Italie", dial: "+39", min: 9, max: 10, placeholder: "312 345 6789" },
    { iso: "GB", name: "Royaume-Uni", dial: "+44", min: 10, max: 10, placeholder: "7400 123456" },
    { iso: "US", name: "États-Unis / Canada", dial: "+1", min: 10, max: 10, placeholder: "201 555 0123" },
] as const;

/** Nom du pays dans la langue de l'app (ex. "Sénégal" / "Senegal"), fourni par le navigateur. */
export const getCountryName = (iso: string, language = "fr") => {
    const country = getPhoneCountry(iso);
    try {
        const names = new Intl.DisplayNames([language], { type: "region" });
        // +1 couvre les États-Unis et le Canada
        return iso === "US" ? `${names.of("US")} / ${names.of("CA")}` : names.of(iso) ?? country.name;
    } catch {
        return country.name;
    }
};

export type PhoneCountryIso = (typeof PHONE_COUNTRIES)[number]["iso"];
export const DEFAULT_PHONE_COUNTRY: PhoneCountryIso = "SN";

export const getPhoneCountry = (iso: string) =>
    PHONE_COUNTRIES.find(c => c.iso === iso) ?? PHONE_COUNTRIES[0];

/** Vérifie la longueur du numéro national pour le pays choisi. */
export const isValidNationalNumber = (iso: string, digits: string) => {
    const c = getPhoneCountry(iso);
    return /^\d+$/.test(digits) && digits.length >= c.min && digits.length <= c.max;
};

/** Numéro complet au format international E.164 : "+221771234567". */
export const formatInternationalPhone = (iso: string, digits: string) =>
    `${getPhoneCountry(iso).dial}${digits}`;

interface PhoneInputProps {
    id?: string;
    country: string;
    number: string;
    onCountryChange: (iso: PhoneCountryIso) => void;
    onNumberChange: (digits: string) => void;
    required?: boolean;
}

export const PhoneInput = ({ id, country, number, onCountryChange, onNumberChange, required }: PhoneInputProps) => {
    const selected = getPhoneCountry(country);
    const { t, i18n } = useTranslation();

    return (
        <div className="flex gap-2">
            <Select value={selected.iso} onValueChange={(v) => onCountryChange(v as PhoneCountryIso)}>
                <SelectTrigger className="w-[112px] shrink-0" aria-label={t('phone.country_code')}>
                    <SelectValue>
                        <span className="font-medium">{selected.iso}</span>{" "}
                        <span className="text-muted-foreground">{selected.dial}</span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {PHONE_COUNTRIES.map(c => (
                        <SelectItem key={c.iso} value={c.iso}>
                            <span className="inline-block w-8 font-medium">{c.iso}</span>
                            <span className="inline-block w-12 text-muted-foreground">{c.dial}</span>
                            {getCountryName(c.iso, i18n.resolvedLanguage)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={selected.placeholder}
                value={number}
                // Chiffres uniquement, dans la limite de longueur du pays.
                // Pas d'attribut maxLength : il couperait un numéro collé avec espaces ("77 123 45 67")
                // avant ce filtrage.
                onChange={(e) => onNumberChange(e.target.value.replace(/\D/g, "").slice(0, selected.max))}
                required={required}
                className="flex-1"
            />
        </div>
    );
};
