import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader } from 'lucide-react';

interface GoogleMapProps {
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

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
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
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Clé API Google Maps (à remplacer par votre vraie clé)
  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

  // Charger l'API Google Maps
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // Fonction callback globale
    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true);
    };

    // Charger le script Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Erreur lors du chargement de Google Maps');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if ('initGoogleMaps' in window) {
        delete (window as any).initGoogleMaps;
      }
    };
  }, []);

  // Initialiser la carte quand Google Maps est chargé
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current) return;

    try {
      // Créer la carte
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Ajouter un marqueur principal (pressing)
      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        title: 'Votre Pressing',
        draggable: draggableMarker,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      });

      markerRef.current = marker;

      // Gérer le déplacement du marqueur
      if (draggableMarker && onLocationChange) {
        marker.addListener('dragend', async () => {
          const position = marker.getPosition();
          const lat = position.lat();
          const lng = position.lng();

          // Géocodage inverse pour obtenir l'adresse
          const geocoder = new window.google.maps.Geocoder();
          try {
            const results = await new Promise((resolve, reject) => {
              geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                if (status === 'OK' && results[0]) {
                  resolve(results);
                } else {
                  reject(status);
                }
              });
            });

            const address = (results as any)[0]?.formatted_address;
            onLocationChange({ lat, lng, address });
          } catch (error) {
            console.error('Erreur géocodage:', error);
            onLocationChange({ lat, lng });
          }
        });
      }

      // Ajouter les marqueurs supplémentaires
      markers.forEach((markerData, index) => {
        const additionalMarker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map,
          title: markerData.title || `Marqueur ${index + 1}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 24)
          }
        });

        // Ajouter une info bulle si spécifiée
        if (markerData.info) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="p-2"><strong>${markerData.title}</strong><br/>${markerData.info}</div>`
          });

          additionalMarker.addListener('click', () => {
            infoWindow.open(map, additionalMarker);
          });
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      setError('Erreur lors de l\'initialisation de la carte');
      setIsLoading(false);
    }
  }, [isGoogleMapsLoaded, center, zoom, markers, draggableMarker, onLocationChange]);

  // Mettre à jour la position du marqueur quand le centre change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newPosition = new window.google.maps.LatLng(center.lat, center.lng);
      markerRef.current.setPosition(newPosition);
      mapInstanceRef.current.setCenter(newPosition);
    }
  }, [center]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center text-gray-500">
            <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: height }}
      />
      
      {draggableMarker && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md text-sm text-gray-600">
          💡 Déplacez le marqueur pour ajuster votre position
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
