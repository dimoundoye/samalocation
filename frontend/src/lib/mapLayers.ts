import L from 'leaflet';
import i18n from '@/lib/i18n';

// Fonds de carte partagés (recherche, choix d'emplacement) : plan OSM ou satellite Esri avec noms de lieux.
// L'hôte server.arcgisonline.com doit être autorisé dans la CSP (img-src).
const STORAGE_KEY = 'map-base-layer';
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

type BaseLayerId = 'plan' | 'satellite';

const readStoredLayer = (): BaseLayerId => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'plan' ? 'plan' : 'satellite';
    } catch {
        return 'satellite';
    }
};

const storeLayer = (id: BaseLayerId) => {
    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // stockage indisponible (navigation privée…) : le choix n'est simplement pas retenu
    }
};

/** Ajoute les fonds Plan / Satellite et le sélecteur à la carte. Retourne la fonction de nettoyage. */
export const addBaseLayers = (map: L.Map): (() => void) => {
    const layers: Record<BaseLayerId, L.Layer> = {
        plan: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }),
        satellite: L.layerGroup([
            L.tileLayer(`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, {
                attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
                maxZoom: 19,
            }),
            L.tileLayer(`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, {
                maxZoom: 19,
            }),
        ]),
    };

    layers[readStoredLayer()].addTo(map);

    let control: L.Control.Layers | null = null;
    const buildControl = () => {
        control?.remove();
        control = L.control.layers(
            {
                [i18n.t('map.plan')]: layers.plan,
                [i18n.t('map.satellite')]: layers.satellite,
            },
            undefined,
            { position: 'topright', collapsed: false }
        ).addTo(map);
    };
    buildControl();

    const onBaseLayerChange = (event: L.LayersControlEvent) => {
        storeLayer(event.layer === layers.satellite ? 'satellite' : 'plan');
    };
    map.on('baselayerchange', onBaseLayerChange);
    i18n.on('languageChanged', buildControl);

    return () => {
        i18n.off('languageChanged', buildControl);
        map.off('baselayerchange', onBaseLayerChange);
        control?.remove();
    };
};
