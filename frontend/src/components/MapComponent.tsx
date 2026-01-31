import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FormattedProperty } from '@/lib/property';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    properties: FormattedProperty[];
    center?: [number, number];
    zoom?: number;
}

const MapComponent = ({ properties, center = [14.7167, -17.4677], zoom = 12 }: MapComponentProps) => {
    const navigate = useNavigate();
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.LayerGroup>(L.layerGroup());

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map if not already done
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            markersRef.current.addTo(mapRef.current);
        } else {
            // Update view if center changes
            mapRef.current.setView(center, zoom);
        }

        // Trigger resize to fix issues when map was initialized in a hidden container
        setTimeout(() => {
            if (mapRef.current) mapRef.current.invalidateSize();
        }, 300);

        return () => {
            // Cleanup on unmount handled by useRef/useEffect check
        };
    }, [center, zoom]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        markersRef.current.clearLayers();

        // Add new markers
        console.log("MapComponent: updating markers for", properties.length, "properties");

        properties.forEach((property) => {
            console.log(`Checking markers for ${property.name}: lat=${property.latitude}, lng=${property.longitude}`);
            if (property.latitude != null && property.longitude != null) {
                console.log("Adding marker at:", property.latitude, property.longitude, "for", property.name);
                const marker = L.marker([Number(property.latitude), Number(property.longitude)]);

                const popupContent = document.createElement('div');
                popupContent.className = 'p-1 max-w-[200px]';

                let imgHtml = '';
                if (property.cover_photo) {
                    imgHtml = `<img src="${property.cover_photo}" alt="${property.name}" class="w-full h-24 object-cover rounded-md mb-2" />`;
                }

                popupContent.innerHTML = `
          ${imgHtml}
          <h3 class="font-bold text-sm mb-1">${property.name}</h3>
          <p class="text-xs text-muted-foreground mb-2 line-clamp-2">${property.address}</p>
          <p class="font-bold text-primary mb-2 text-sm">
            ${property.rent_amount?.toLocaleString()} FCFA / ${property.primary_rent_period || 'mois'}
          </p>
          <button id="view-details-${property.id}" class="w-full py-1.5 bg-primary text-white text-xs rounded-md font-medium hover:bg-primary/90 transition-colors">
            Voir détails
          </button>
        `;

                marker.bindPopup(popupContent);

                marker.on('popupopen', () => {
                    const btn = document.getElementById(`view-details-${property.id}`);
                    if (btn) {
                        btn.onclick = () => {
                            navigate(`/property/${property.id}`);
                        };
                    }
                });

                markersRef.current.addLayer(marker);
            }
        });

        // Auto-fit map to show all markers
        if (properties.length > 0 && mapRef.current) {
            const markersWithCoords = properties.filter(p => p.latitude != null && p.longitude != null);
            if (markersWithCoords.length > 0) {
                const bounds = L.latLngBounds(markersWithCoords.map(p => [Number(p.latitude), Number(p.longitude)]));
                mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                console.log("MapComponent: Auto-fitted map to", markersWithCoords.length, "markers");
            } else {
                console.log("MapComponent: No properties with valid coordinates found.");
            }
        }
    }, [properties, navigate]);

    return (
        <div
            ref={mapContainerRef}
            className="h-full w-full rounded-xl overflow-hidden shadow-soft border border-border/50 bg-secondary/20"
            style={{ minHeight: '400px' }}
        />
    );
};

export default MapComponent;
