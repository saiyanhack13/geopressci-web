// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import RouteDisplay from './RouteDisplay';

interface SafeRouteDisplayProps {
  start: [number, number];
  end: [number, number];
  onRouteLoad?: (distance: string, duration: string) => void;
}

/**
 * Composant wrapper sécurisé pour RouteDisplay qui attend que la carte soit prête
 * Évite les erreurs Leaflet _leaflet_pos en vérifiant l'état de la carte
 */
const SafeRouteDisplay: React.FC<SafeRouteDisplayProps> = ({ start, end, onRouteLoad }) => {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!map) return;

    const checkMapReady = () => {
      // Vérifier que la carte est complètement initialisée
      const isReady = !!(
        map &&
        map.getContainer() &&
        map._loaded &&
        map.getSize() &&
        map.getSize().x > 0 &&
        map.getSize().y > 0
      );

      if (isReady) {
        setIsMapReady(true);
        console.log('✅ Carte prête pour le routage');
      } else {
        console.log('⏳ Carte en cours d\'initialisation...');
        // Réessayer après un court délai
        setTimeout(checkMapReady, 100);
      }
    };

    // Vérifier immédiatement
    checkMapReady();

    // Écouter les événements de la carte
    const onMapLoad = () => {
      console.log('🗺️ Événement map load détecté');
      setTimeout(checkMapReady, 50);
    };

    const onMapReady = () => {
      console.log('🗺️ Événement map ready détecté');
      setTimeout(checkMapReady, 50);
    };

    // Ajouter les listeners
    map.on('load', onMapLoad);
    map.on('ready', onMapReady);

    // Cleanup
    return () => {
      map.off('load', onMapLoad);
      map.off('ready', onMapReady);
    };
  }, [map]);

  // Ne rendre RouteDisplay que quand la carte est prête
  if (!isMapReady) {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded z-[1000]">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <span className="text-sm">Préparation de l'itinéraire...</span>
        </div>
      </div>
    );
  }

  return (
    <RouteDisplay
      start={start}
      end={end}
      onRouteLoad={onRouteLoad}
    />
  );
};

export default SafeRouteDisplay;
