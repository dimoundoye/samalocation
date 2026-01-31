import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Fix pour les icônes Leaflet par défaut
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    initialLat?: number | null;
    initialLng?: number | null;
    onChange: (lat: number, lng: number) => void;
}

const LocationPicker = ({ initialLat, initialLng, onChange }: LocationPickerProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Dakar par défaut
        const defaultLat = initialLat || 14.7167;
        const defaultLng = initialLng || -17.4677;

        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            markerRef.current = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(mapRef.current);

            markerRef.current.on('dragend', (event) => {
                const marker = event.target;
                const position = marker.getLatLng();
                onChangeRef.current(position.lat, position.lng);
            });

            mapRef.current.on('click', (event) => {
                const { lat, lng } = event.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                    onChangeRef.current(lat, lng);
                }
            });

            // Forcer le redimensionnement après un court délai pour gérer les problèmes d'affichage dans les modales
            setTimeout(() => {
                if (mapRef.current) mapRef.current.invalidateSize();
            }, 100);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Mettre à jour le marqueur si les props initiales changent (cas d'édition)
    useEffect(() => {
        if (mapRef.current && markerRef.current && initialLat && initialLng) {
            const currentPos = markerRef.current.getLatLng();
            if (currentPos.lat !== initialLat || currentPos.lng !== initialLng) {
                markerRef.current.setLatLng([initialLat, initialLng]);
                mapRef.current.setView([initialLat, initialLng], mapRef.current.getZoom());
            }
        }
    }, [initialLat, initialLng]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);

                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView([newLat, newLng], 15);
                    markerRef.current.setLatLng([newLat, newLng]);
                    onChange(newLat, newLng);
                }
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une adresse (quartier, ville...)"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    />
                </div>
                <Button type="button" variant="secondary" onClick={handleSearch} disabled={isSearching} size="sm">
                    {isSearching ? "..." : "Rechercher"}
                </Button>
            </div>
            <div
                ref={mapContainerRef}
                className="h-[300px] w-full rounded-md border shadow-inner overflow-hidden z-0"
                style={{ minHeight: '300px' }}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Cliquez sur la carte ou déplacez le marqueur pour définir l'emplacement précis.</span>
            </div>
        </div>
    );
};

export default LocationPicker;
