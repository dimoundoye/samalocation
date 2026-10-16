import L from 'leaflet';
import i18n from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';

// Bouton « Ma position » : demande la géolocalisation du navigateur (HTTPS + Permissions-Policy geolocation=(self)).
const CROSSHAIR_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';

const errorMessageKey = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) return 'map.locate_denied';
    return 'map.locate_unavailable';
};

/**
 * Ajoute le bouton de localisation. `onLocate` reçoit la position trouvée ;
 * le point bleu et le cercle de précision sont dessinés ici. Retourne la fonction de nettoyage.
 */
export const addLocateControl = (
    map: L.Map,
    onLocate?: (latlng: L.LatLng) => void
): (() => void) => {
    const positionLayer = L.layerGroup().addTo(map);
    let button: HTMLAnchorElement | null = null;
    let disposed = false;

    const setLoading = (loading: boolean) => {
        if (!button) return;
        button.style.opacity = loading ? '0.5' : '';
        button.setAttribute('aria-busy', String(loading));
    };

    const locate = () => {
        if (!('geolocation' in navigator)) {
            toast({ variant: 'destructive', title: i18n.t('map.locate_unavailable') });
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                if (disposed) return;
                setLoading(false);
                const latlng = L.latLng(coords.latitude, coords.longitude);
                positionLayer.clearLayers();
                L.circle(latlng, {
                    radius: coords.accuracy,
                    color: '#2563eb',
                    weight: 1,
                    fillOpacity: 0.12,
                    interactive: false,
                }).addTo(positionLayer);
                L.circleMarker(latlng, {
                    radius: 7,
                    color: '#ffffff',
                    weight: 2,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                })
                    .bindTooltip(i18n.t('map.my_position'))
                    .addTo(positionLayer);
                map.setView(latlng, Math.max(map.getZoom(), 16));
                onLocate?.(latlng);
            },
            (error) => {
                if (disposed) return;
                setLoading(false);
                toast({ variant: 'destructive', title: i18n.t(errorMessageKey(error)) });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };

    const LocateControl = L.Control.extend({
        onAdd() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            button = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
            button.href = '#';
            button.role = 'button';
            button.innerHTML = CROSSHAIR_SVG;
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            const label = i18n.t('map.locate_me');
            button.title = label;
            button.setAttribute('aria-label', label);
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(button, 'click', (event) => {
                L.DomEvent.preventDefault(event);
                locate();
            });
            return container;
        },
    });

    const control = new LocateControl({ position: 'topleft' }).addTo(map);

    const updateLabel = () => {
        if (!button) return;
        const label = i18n.t('map.locate_me');
        button.title = label;
        button.setAttribute('aria-label', label);
    };
    i18n.on('languageChanged', updateLabel);

    return () => {
        disposed = true;
        i18n.off('languageChanged', updateLabel);
        control.remove();
        positionLayer.remove();
    };
};
