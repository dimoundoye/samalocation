import { useSyncExternalStore } from "react";

/** true tant que la media query correspond (ex. "(max-width: 1023px)"), mis à jour au redimensionnement. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

/** Tablette et petits écrans d'ordinateur (< 1024 px, sous le point de rupture lg de Tailwind) */
export const COMPACT_LAYOUT_QUERY = "(max-width: 1023px)";
