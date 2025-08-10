import React, { useState } from 'react';
import { MapPin, Loader2, RefreshCw, Satellite } from 'lucide-react';
import useMapboxGeolocation, { MapboxGeolocationPosition } from '../../hooks/useMapboxGeolocation';
import { toast } from 'react-hot-toast';

interface MapboxGeolocationButtonProps {
  onLocationReceived?: (position: MapboxGeolocationPosition) => void;
  onError?: (error: any) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showAccuracy?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MapboxGeolocationButton: React.FC<MapboxGeolocationButtonProps> = ({
  onLocationReceived,
  onError,
  variant = 'primary',
  size = 'md',
  showAccuracy = false,
  disabled = false,
  className = '',
  children
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  
  const {
    position,
    error,
    isLoading,
    isSupported,
    permissionStatus,
    requestPosition,
    clearPosition
  } = useMapboxGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes de cache
    fallbackToIP: true,
    autoRequest: false
  });

  // Styles selon les variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'outline':
        return 'bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-50';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  // Styles selon les tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Fonction pour déterminer le quartier d'Abidjan
  const getAbidjanNeighborhood = (lat: number, lng: number): string => {
    // Coordonnées approximatives des quartiers d'Abidjan
    const neighborhoods = [
      { name: 'Yopougon', bounds: { latMin: 5.32, latMax: 5.36, lngMin: -4.12, lngMax: -4.08 } },
      { name: 'Cocody', bounds: { latMin: 5.35, latMax: 5.38, lngMin: -4.02, lngMax: -3.98 } },
      { name: 'Plateau', bounds: { latMin: 5.31, latMax: 5.33, lngMin: -4.04, lngMax: -4.02 } },
      { name: 'Adjamé', bounds: { latMin: 5.34, latMax: 5.36, lngMin: -4.05, lngMax: -4.03 } },
      { name: 'Treichville', bounds: { latMin: 5.29, latMax: 5.31, lngMin: -4.03, lngMax: -4.01 } },
      { name: 'Marcory', bounds: { latMin: 5.29, latMax: 5.31, lngMin: -4.01, lngMax: -3.99 } }
    ];

    for (const neighborhood of neighborhoods) {
      const { bounds } = neighborhood;
      if (lat >= bounds.latMin && lat <= bounds.latMax && 
          lng >= bounds.lngMin && lng <= bounds.lngMax) {
        return neighborhood.name;
      }
    }

    return 'Abidjan';
  };

  const handleLocationRequest = async () => {
    if (!isSupported) {
      toast.error('🚫 Géolocalisation non supportée par ce navigateur');
      onError?.({ message: 'Géolocalisation non supportée' });
      return;
    }

    setIsRequesting(true);

    try {
      const newPosition = await requestPosition();
      
      // Déterminer le quartier
      const neighborhood = getAbidjanNeighborhood(newPosition.latitude, newPosition.longitude);
      
      // Toast de succès avec informations détaillées
      const sourceText = newPosition.source === 'native' ? '📍 GPS' : '🗺️ Mapbox';
      const precisionText = newPosition.accuracy < 100 ? 'Précise' : 'Approximative';
      
      toast.success(
        `${sourceText} • ${precisionText} (±${Math.round(newPosition.accuracy)}m) • ${neighborhood}`,
        {
          duration: 4000,
          id: 'mapbox-location-success'
        }
      );

      // Callback avec la nouvelle position
      onLocationReceived?.(newPosition);
      
    } catch (err: any) {
      console.error('Erreur de géolocalisation Mapbox:', err);
      
      // Toast d'erreur contextuel
      if (err.code === 1) {
        toast.error('🚫 Autorisation refusée. Activez la géolocalisation dans votre navigateur.', {
          duration: 5000,
          id: 'mapbox-location-error'
        });
      } else if (err.code === 2) {
        toast.error('📡 Signal GPS faible. Sortez à l\'extérieur pour une meilleure précision.', {
          duration: 5000,
          id: 'mapbox-location-error'
        });
      } else if (err.code === 3) {
        toast.error('⏱️ Délai dépassé. Réessayez ou vérifiez votre connexion.', {
          duration: 5000,
          id: 'mapbox-location-error'
        });
      } else {
        toast.error(`❌ ${err.message}`, {
          duration: 5000,
          id: 'mapbox-location-error'
        });
      }

      onError?.(err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClearLocation = () => {
    clearPosition();
    toast.success('📍 Position effacée', { duration: 2000 });
  };

  const isButtonLoading = isLoading || isRequesting;
  const isButtonDisabled = disabled || isButtonLoading;

  return (
    <div className="flex flex-col items-start space-y-2">
      <div className="flex items-center space-x-2">
 
        {/* Bouton d'effacement si position détectée */}
        {position && (
          <button
            onClick={handleClearLocation}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Effacer la position"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Affichage des informations de position */}
      {position && (
        <div className="flex flex-col space-y-1 text-sm">
          {/* Coordonnées et précision */}
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Position détectée</span>
            {showAccuracy && (
              <span className="text-xs text-green-500">
                (±{Math.round(position.accuracy)}m)
              </span>
            )}
          </div>

          {/* Coordonnées détaillées */}
          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded">
            <div>📍 {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span>
                🎯 Source: {position.source === 'native' ? 'GPS natif' : 'Mapbox'}
              </span>
              <span>
                🎯 Quartier: {getAbidjanNeighborhood(position.latitude, position.longitude)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded border border-red-200">
          <div className="flex items-center space-x-1">
            <span>❌</span>
            <span>{error.message}</span>
          </div>
          <div className="text-red-500 mt-1">
            Source: {error.source === 'native' ? 'GPS natif' : 'Mapbox'}
          </div>
        </div>
      )}

      {/* Statut de permission */}
      {permissionStatus && (
        <div className="text-xs text-gray-500">
          Permission: {permissionStatus === 'granted' ? '✅ Accordée' : 
                      permissionStatus === 'denied' ? '❌ Refusée' : 
                      '⏳ En attente'}
        </div>
      )}
    </div>
  );
};

export default MapboxGeolocationButton;
