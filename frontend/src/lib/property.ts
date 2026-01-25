export interface RawProperty {
  id?: string;
  name?: string;
  address?: string;
  property_type?: string;
  rent_amount?: number | null;
  total_units?: number | null;
  status?: string | null;
  is_published?: boolean | null;
  photo_url?: string | null;
  photos?: string[] | null;
  property_units?: any[] | null;
  [key: string]: any;
}

export interface FormattedProperty extends RawProperty {
  rent_amount: number;
  total_units: number;
  display_status: "available" | "occupied";
  cover_photo: string | null;
  available_units: number;
  aggregated_bedrooms: number;
  aggregated_area: number;
  aggregated_bathrooms: number;
  property_units: any[];
  primary_rent_period: "jour" | "semaine" | "mois";
}

const getSafePhotosArray = (photos: RawProperty["photos"]) => {
  if (!photos) return [];

  if (Array.isArray(photos)) {
    return photos as string[];
  }

  try {
    const parsed = JSON.parse(photos as unknown as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const transformProperty = (property: RawProperty): FormattedProperty => {
  const units = property.property_units ? ([...property.property_units] as any[]) : [];
  const availableUnits = units.filter((unit) => unit?.is_available !== false);

  const rentCandidates: number[] = [];
  let primaryRentPeriod: "jour" | "semaine" | "mois" = "mois";
  let currentMinRent = Number.POSITIVE_INFINITY;

  // Vérifier d'abord si la propriété a un rent_amount direct
  if (typeof property.rent_amount === "number" && !Number.isNaN(property.rent_amount) && property.rent_amount > 0) {
    rentCandidates.push(property.rent_amount);
    currentMinRent = property.rent_amount;
    primaryRentPeriod = "mois";
  }

  // Ensuite, vérifier les unités
  units.forEach((unit) => {
    if (!unit) return;

    // Essayer de récupérer monthly_rent de différentes façons
    let rent: number = 0;
    if (typeof unit.monthly_rent === "number") {
      rent = unit.monthly_rent;
    } else if (typeof unit.monthly_rent === "string") {
      rent = parseInt(unit.monthly_rent, 10);
    } else if (unit.monthly_rent != null) {
      rent = Number(unit.monthly_rent);
    }

    if (!Number.isNaN(rent) && rent > 0) {
      rentCandidates.push(rent);
      if (rent < currentMinRent) {
        currentMinRent = rent;
        const period = typeof unit?.rent_period === "string" ? unit.rent_period : "mois";
        if (period === "jour" || period === "semaine" || period === "mois") {
          primaryRentPeriod = period;
        } else {
          primaryRentPeriod = "mois";
        }
      }
    }
  });

  const computedRent = rentCandidates.length > 0 ? Math.min(...rentCandidates) : 0;
  const totalUnits = property.total_units ?? units.length ?? 0;

  const aggregatedBedrooms = units.reduce((sum, unit) => {
    if (typeof unit?.bedrooms === "number") {
      return sum + unit.bedrooms;
    }

    if (unit?.unit_type === "chambre") {
      return sum + 1;
    }

    return sum;
  }, 0);

  const aggregatedArea = units.reduce((sum, unit) => {
    if (typeof unit?.area_sqm === "number") {
      return sum + unit.area_sqm;
    }
    if (typeof unit?.area_sqm === "string") {
      const parsed = parseInt(unit.area_sqm, 10);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }
    return sum;
  }, 0);

  const aggregatedBathrooms = units.reduce((sum, unit) => {
    if (typeof unit?.bathrooms === "number") {
      return sum + unit.bathrooms;
    }
    if (typeof unit?.bathrooms === "string") {
      const parsed = parseInt(unit.bathrooms, 10);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }
    return sum;
  }, 0);

  const isPublished = property.is_published ?? property.status === "published";
  const hasUnitsInfo = units.length > 0;
  const hasAvailability = availableUnits.length > 0 || !hasUnitsInfo;
  const displayStatus: "available" | "occupied" = isPublished && hasAvailability ? "available" : "occupied";

  const formatImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Prepend backend base URL for local uploads
    const baseUrl = API_BASE_URL.replace("/api", "");
    return `${baseUrl}${url}`;
  };

  const photosArray = getSafePhotosArray(property.photos).map(formatImageUrl).filter(Boolean) as string[];
  const coverPhoto = formatImageUrl(property.photo_url || photosArray[0] || null);

  return {
    ...property,
    rent_amount: computedRent,
    total_units: totalUnits,
    property_units: units,
    available_units: availableUnits.length,
    display_status: displayStatus,
    cover_photo: coverPhoto,
    aggregated_bedrooms: aggregatedBedrooms,
    aggregated_area: aggregatedArea,
    aggregated_bathrooms: aggregatedBathrooms,
    photos: photosArray,
    primary_rent_period: primaryRentPeriod,
  };
};

import { API_BASE_URL } from "@/api/baseClient";


