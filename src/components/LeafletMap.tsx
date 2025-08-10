import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader, AlertCircle } from 'lucide-react';

interface LeafletMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  onLocationChange?: (location: { lat: number; lng: number; address?: string }) => void;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    info?: string;
  }>;
  draggableMarker?: boolean;
  className?: string;
}

// Import Leaflet
import * as L from 'leaflet';
const divIcon = L.divIcon;
import 'leaflet/dist/leaflet.css';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 15,
  height = '300px',
  onLocationChange,
  markers = [],
  draggableMarker = false,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Vérifier si Leaflet est déjà chargé
  useEffect(() => {
    // Vérifier si Leaflet est déjà chargé
    if (typeof window !== 'undefined' && (window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Charger le CSS de Leaflet
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);

    // Charger le JS de Leaflet
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    script.onerror = () => {
      setError('Erreur lors du chargement de la carte');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage
      if (cssLink.parentNode) {
        cssLink.parentNode.removeChild(cssLink);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialiser la carte quand Leaflet est chargé
  useEffect(() => {
    if (!isLeafletLoaded || !mapRef.current || !(window as any).L) return;
    
    // Éviter la double initialisation
    if (mapInstanceRef.current) {
      return;
    }

    try {
      // Créer la carte
      const map = new L.Map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
      });

      // Ajouter les tuiles OpenStreetMap
      new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      // Créer une icône personnalisée pour le pressing
      const pressingIcon = divIcon({
        html: `
          <div style="
            background: #10B981;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: white;
              font-size: 16px;
              transform: rotate(45deg);
              font-weight: bold;
            ">🏪</div>
          </div>
        `,
        className: 'custom-pressing-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Ajouter le marqueur principal
      const marker = new L.Marker([center.lat, center.lng], {
        icon: pressingIcon,
        draggable: draggableMarker
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong>🏪 Votre Pressing</strong><br/>
          <small>Lat: ${center.lat.toFixed(6)}<br/>Lng: ${center.lng.toFixed(6)}</small>
        </div>
      `);

      markerRef.current = marker;

      // Gérer le déplacement du marqueur
      if (draggableMarker && onLocationChange) {
        marker.on('dragend', async (e: any) => {
          const position = e.target.getLatLng();
          const lat = position.lat;
          const lng = position.lng;

          // Géocodage inverse simple (optionnel)
          try {
            // Utiliser Nominatim pour le géocodage inverse (gratuit)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name;
            
            onLocationChange({ lat, lng, address });
          } catch (error) {
            console.error('Erreur géocodage:', error);
            onLocationChange({ lat, lng });
          }
        });
      }

      // Ajouter les marqueurs supplémentaires (zones de livraison)
      markers.forEach((markerData, index) => {
        const zoneIcon = divIcon({
          html: `
            <div style="
              background: #3B82F6;
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                color: white;
                font-size: 12px;
                transform: rotate(45deg);
                font-weight: bold;
              ">🚚</div>
            </div>
          `,
          className: 'custom-zone-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24]
        });

        const zoneMarker = new L.Marker([markerData.lat, markerData.lng], {
          icon: zoneIcon
        }).addTo(map);

        if (markerData.info) {
          zoneMarker.bindPopup(`
            <div style="padding: 8px;">
              <strong>🚚 ${markerData.title}</strong><br/>
              ${markerData.info}
            </div>
          `);
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      setError('Erreur lors de l\'initialisation de la carte');
      setIsLoading(false);
    }

    // Fonction de nettoyage
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        } catch (error) {
          console.warn('Erreur lors du nettoyage de la carte:', error);
        }
      }
    };
  }, [isLeafletLoaded, center, zoom, markers, draggableMarker, onLocationChange]);

  // Mettre à jour la position du marqueur quand le centre change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && (window as any).L) {
      const newLatLng = new L.LatLng(center.lat, center.lng);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, zoom);
    }
  }, [center, zoom]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Vérifiez votre connexion internet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center text-gray-500">
            <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Chargement de la carte...</p>
            <p className="text-xs mt-1">Powered by OpenStreetMap</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: height }}
      />
      
      {draggableMarker && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md text-sm text-gray-600 border">
          💡 Déplacez le marqueur pour ajuster votre position
        </div>
      )}

      {!isLoading && (
        <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-xs text-gray-500 shadow-sm border">
          🗺️ OpenStreetMap
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
