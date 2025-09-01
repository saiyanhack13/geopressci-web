import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MapboxMap from '../MapboxMap';
import RouteDisplay from './RouteDisplay';
import { ExtendedPressing } from '../../types/search';

interface MapboxMapViewProps {
  pressings: ExtendedPressing[];
  userPosition: [number, number] | null;
  onPressingSelect: (pressing: ExtendedPressing | null) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  selectedPressing?: ExtendedPressing | null;
}

const MapboxMapView: React.FC<MapboxMapViewProps> = ({
  pressings,
  userPosition,
  onPressingSelect,
  favorites,
  onToggleFavorite,
  selectedPressing
}) => {
  const navigate = useNavigate();

  // Calculer les marqueurs pour Mapbox avec informations détaillées
  const markers = useMemo(() => {
    const pressingMarkers = pressings
      .filter(pressing => {
        // Filtrer les pressings avec coordonnées valides
        const validatedCoords = (pressing as any).validatedCoordinates;
        const hasValidCoords = validatedCoords?.lat && validatedCoords?.lng;
        const isInAbidjan = (
          validatedCoords?.lat >= 5.0 && validatedCoords?.lat <= 5.6 &&
          validatedCoords?.lng >= -4.5 && validatedCoords?.lng <= -3.8
        );
        return hasValidCoords && isInAbidjan;
      })
      .map(pressing => {
        const validatedCoords = (pressing as any).validatedCoordinates;
        const coords = validatedCoords || {
          lat: pressing.location?.coordinates?.[1] || 0,
          lng: pressing.location?.coordinates?.[0] || 0
        };
        
        // Informations enrichies pour le marqueur
        const services = pressing.services || [];
        const ratingData = pressing.rating;
        const rating = typeof ratingData === 'object' && ratingData !== null ? ratingData.average : (ratingData as number) || 0;
        const distance = pressing.distance ? `${pressing.distance}km` : 'Distance inconnue';
        const locationMeta = (pressing as any).locationMetadata;
        const neighborhood = locationMeta?.detectedNeighborhood || 'Quartier non détecté';
        const isOpen = '🟢 Ouvert 6h-20h'; // Toujours ouvert
        
        // Prix moyen des services
        const avgPrice = services.length > 0 
          ? Math.round(services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length)
          : 0;
        
        return {
          lat: coords.lat,
          lng: coords.lng,
          title: pressing.name || pressing.businessName || 'Pressing',
          info: `
            <div class="pressing-marker-popup" style="max-width: 120px; font-size: 12px;">
              <div class="font-semibold text-sm mb-1" style="font-size: 13px;">${pressing.name || 'Pressing'}</div>
              <div class="space-y-1" style="font-size: 11px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>⭐</span>
                  <span>${rating.toFixed(1)}/5</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>${isOpen}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>📍</span>
                  <span>${distance}</span>
                </div>
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                <button 
                  onclick="window.location.href='/pressing-detail/${pressing.id}'" 
                  style="width: 100%; padding: 4px 6px; background-color: #f97316; color: white; border-radius: 4px; border: none; font-size: 11px; font-weight: 500; cursor: pointer;"
                >
                  Voir détails
                </button>
              </div>
            </div>
          `,
          // Métadonnées pour le clic
          pressing: pressing,
          type: 'pressing',
          isValidated: validatedCoords?.isOriginal || false,
          source: validatedCoords?.source || 'unknown'
        };
      });
    
    console.log(`🗺️ ${pressingMarkers.length} marqueurs de pressings générés pour la carte`);
    return pressingMarkers;
  }, [pressings]);
  
  // Gestionnaire de clic sur un marqueur
  const handleMarkerClick = useCallback((marker: any) => {
    if (marker.type === 'pressing') {
      onPressingSelect(marker.data);
    }
  }, [onPressingSelect]);
  
  // Calculer le centre et le zoom basés sur les pressings et la position utilisateur
  const getMapCenter = useCallback(() => {
    if (userPosition) {
      return { lat: userPosition[0], lng: userPosition[1] };
    }
    
    if (pressings.length > 0 && pressings[0].location?.coordinates) {
      return {
        lat: pressings[0].location.coordinates[1],
        lng: pressings[0].location.coordinates[0]
      };
    }
    
    // Centre d'Abidjan par défaut
    return { lat: 5.3364, lng: -4.0267 };
  }, [pressings, userPosition]);
  
  const center = getMapCenter();
  const zoom = userPosition ? 14 : 11;
  
  return (
    <div className="h-96 sm:h-[500px] relative">
      <MapboxMap
        center={center}
        zoom={zoom}
        height="100%"
        className="rounded-lg"
        markers={markers}
        onLocationChange={(location) => {
          console.log('Location changed:', location);
        }}
      />
      
      {/* Note: RouteDisplay sera intégré plus tard avec les bonnes props */}
      
      {/* Overlay compact pour mobile */}
      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 z-[1000] max-w-[140px] sm:max-w-sm">
        <div className="space-y-1 sm:space-y-2">
          <div className="font-semibold text-gray-800 text-xs sm:text-sm">
            📊 Pressings ({markers.length})
          </div>
          
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Total</span>
              </div>
              <span className="font-medium text-orange-600">{pressings.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Carte</span>
              </div>
              <span className="font-medium text-blue-600">{markers.length}</span>
            </div>
            
            {userPosition && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700">Position</span>
                </div>
                <span className="font-medium text-green-600">📍</span>
              </div>
            )}
          </div>
          
          {/* Instructions utilisateur - masquées sur mobile */}
          <div className="hidden sm:block text-xs text-gray-500 border-t border-gray-200 pt-1">
            💡 Cliquez sur un marqueur
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMapView;
