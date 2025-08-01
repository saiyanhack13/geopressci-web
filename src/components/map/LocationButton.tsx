// @ts-nocheck
import { useMap, Marker, Popup } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import { LocateFixed, AlertCircle, RefreshCw } from 'lucide-react';
import * as L from 'leaflet';

type LocationButtonProps = {
  onLocationUpdate?: (position: [number, number]) => void;
};

// Créer une icône personnalisée pour le marqueur de position
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const LocationButton: React.FC<LocationButtonProps> = ({ onLocationUpdate }) => {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nettoyer le watch de géolocalisation lors du démontage du composant
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Mettre à jour la vue de la carte lorsque la position change
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [position, map]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    // Show loading state
    setIsLocating(true);
    setError(null);

    // Clear any existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    // First try with high accuracy (GPS) with a timeout
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 10000,  // 10 seconds for high accuracy
      maximumAge: 0
    };

    const lowAccuracyOptions = {
      enableHighAccuracy: false,  // Try with lower accuracy if high fails
      timeout: 15000,  // 15 seconds for low accuracy
      maximumAge: 5 * 60 * 1000  // Accept position up to 5 minutes old
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      setIsLocating(false);
      const { latitude, longitude } = pos.coords;
      const newPosition: [number, number] = [latitude, longitude];
      setPosition(newPosition);
      
      if (onLocationUpdate) {
        onLocationUpdate(newPosition);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Erreur de géolocalisation:', error);
      
      if (error.code === error.TIMEOUT) {
        // If high accuracy times out, try with lower accuracy
        if (error.message.includes('high accuracy')) {
          console.log('Tentative avec une précision réduite...');
          const id = navigator.geolocation.watchPosition(
            handleSuccess,
            (fallbackError) => {
              setIsLocating(false);
              setError('Impossible de déterminer votre position. Veuillez vérifier que la géolocalisation est activée.');
            },
            lowAccuracyOptions
          );
          setWatchId(id);
          return;
        }
      }
      
      setIsLocating(false);
      setError('Impossible d\'accéder à votre position. ' + 
        (error.code === error.PERMISSION_DENIED 
          ? 'Veuillez autoriser l\'accès à votre position.'
          : 'Veuillez vérifier votre connexion et réessayer.')
      );
    };

    // Start with high accuracy first
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      highAccuracyOptions
    );
    
    setWatchId(id);
    
      // Set a maximum timeout to avoid hanging
    setTimeout(() => {
      if (isLocating) {
        setIsLocating(false);
        setError('La localisation prend trop de temps. Vérifiez votre connexion et réessayez.');
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      }
    }, 20000); // 20 seconds max
  };

  return (
    <>
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={locateUser}
            disabled={isLocating}
            className="p-2 bg-white hover:bg-gray-100 text-gray-800 rounded-r-none border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            title="Localiser ma position"
            aria-label="Localiser ma position"
          >
            {isLocating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
          </button>
        </div>
        {error && (
          <div className="leaflet-control leaflet-bar bg-red-50 text-red-700 p-2 text-sm rounded shadow-lg max-w-xs">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
      {position && (
        <Marker 
          position={position} 
          icon={userIcon}
        >
          <Popup>Votre position actuelle</Popup>
        </Marker>
      )}
    </>
  );
};

export default LocationButton;
