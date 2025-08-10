// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { getRoute } from '../../services/maps';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteDisplayProps {
  start: [number, number];
  end: [number, number];
  onRouteLoad?: (distance: string, duration: string) => void;
}

const RouteDisplay: React.FC<RouteDisplayProps> = ({ start, end, onRouteLoad }) => {
  const map = useMap();
  const polylineRef = useRef<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Vérifier que la carte est complètement initialisée
    if (!map.getContainer() || !map._loaded) {
      console.warn('Carte non initialisée, report du routage');
      return;
    }

    let isMounted = true;

    const fetchRoute = async () => {
      // Réinitialiser l'état pour la nouvelle recherche
      setError(null);
      setRouteInfo(null);

      try {
        console.log('Fetching route from:', start, 'to:', end);
        
        const route = await getRoute(
          { lat: start[0], lng: start[1] },
          { lat: end[0], lng: end[1] },
          'driving'
        );

        if (!isMounted) return; // Ne rien faire si le composant est démonté

        if (!route || !route.points || route.points.length === 0) {
          console.warn('Route vide ou points manquants:', route);
          setError('Aucun itinéraire trouvé entre ces deux points');
          return;
        }

        console.log('Route trouvée avec', route.points.length, 'points');
        console.log('Distance:', route.distance?.text, 'Durée:', route.duration?.text);

        const routeInfo = {
          distance: route.distance?.text || 'Inconnue',
          duration: route.duration?.text || 'Inconnue'
        };
        setRouteInfo(routeInfo);
        if (onRouteLoad) {
          onRouteLoad(routeInfo.distance, routeInfo.duration);
        }

        // Créer la polyline avec L.polyline de Leaflet
        const polyline = L.polyline(
          route.points.map(p => [p.lat, p.lng] as [number, number]),
          {
            color: '#4285F4',
            weight: 5,
            opacity: 0.8,
            lineJoin: 'round',
          }
        );

        // Ajouter la polyline à la carte avec vérification de sécurité
        try {
          if (map && map.getContainer() && isMounted) {
            polyline.addTo(map);
            
            // Ajuster la vue avec un délai pour éviter les erreurs de timing
            setTimeout(() => {
              if (isMounted && map && polyline.getBounds && polyline.getBounds().isValid()) {
                try {
                  map.fitBounds(polyline.getBounds(), { 
                    padding: [50, 50],
                    maxZoom: 16
                  });
                } catch (fitBoundsError) {
                  console.warn('Erreur lors de l\'ajustement de la vue:', fitBoundsError);
                }
              }
            }, 100);
          }
        } catch (addToMapError) {
          console.error('Erreur lors de l\'ajout de la polyline:', addToMapError);
          return;
        }

        polylineRef.current = polyline;
        
      } catch (err) {
        if (isMounted) {
          console.error('Erreur lors du chargement de l\'itinéraire:', err);
          setError('Erreur lors du chargement de l\'itinéraire');
        }
      }
    };

    fetchRoute();

    // Fonction de nettoyage
    return () => {
      isMounted = false;
      if (polylineRef.current && map) {
        try {
          // Vérifier que la carte et la couche existent avant suppression
          if (map.hasLayer && map.hasLayer(polylineRef.current)) {
            map.removeLayer(polylineRef.current);
          }
        } catch (removeError) {
          console.warn('Erreur lors de la suppression de la polyline:', removeError);
        } finally {
          polylineRef.current = null;
        }
      }
    };
  }, [map, start, end, onRouteLoad]);

  // Afficher un message d'erreur s'il y en a un
  if (error) {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[1000] max-w-md">
        <p className="font-bold">Erreur d'itinéraire</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Afficher les informations de l'itinéraire si disponibles
  if (routeInfo) {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-[1000] max-w-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-blue-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="font-medium">Distance:</span>
            <span className="ml-1">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center ml-4">
            <span className="text-blue-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="font-medium">Durée:</span>
            <span className="ml-1">{routeInfo.duration}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RouteDisplay;
