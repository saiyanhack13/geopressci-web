import React, { useState, useCallback } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useForcedGeolocation, { GeolocationPosition } from '../../hooks/useForcedGeolocation';

export interface ForcedGeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface ForcedGeolocationButtonProps {
  onLocationReceived?: (position: ForcedGeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showAccuracy?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const ForcedGeolocationButton: React.FC<ForcedGeolocationButtonProps> = ({
  onLocationReceived,
  onError,
  variant = 'primary',
  size = 'md',
  showAccuracy = false,
  disabled = false,
  children,
  className = '',
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastPosition, setLastPosition] = useState<ForcedGeolocationPosition | null>(null);
  
  const { requestPosition, isSupported } = useForcedGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    forcePermission: true,
  });

  // Détection des quartiers d'Abidjan
  const getNeighborhoodFromCoordinates = useCallback((lat: number, lng: number): string => {
    // Yopougon
    if (lat >= 5.32 && lat <= 5.36 && lng >= -4.12 && lng <= -4.08) return 'Yopougon';
    // Cocody
    if (lat >= 5.35 && lat <= 5.38 && lng >= -4.02 && lng <= -3.98) return 'Cocody';
    // Plateau
    if (lat >= 5.31 && lat <= 5.33 && lng >= -4.04 && lng <= -4.02) return 'Plateau';
    // Adjamé
    if (lat >= 5.34 && lat <= 5.36 && lng >= -4.05 && lng <= -4.03) return 'Adjamé';
    // Treichville
    if (lat >= 5.28 && lat <= 5.31 && lng >= -4.04 && lng <= -4.01) return 'Treichville';
    // Marcory
    if (lat >= 5.28 && lat <= 5.31 && lng >= -4.01 && lng <= -3.98) return 'Marcory';
    // Koumassi
    if (lat >= 5.29 && lat <= 5.32 && lng >= -3.98 && lng <= -3.95) return 'Koumassi';
    // Port-Bouët
    if (lat >= 5.23 && lat <= 5.27 && lng >= -3.98 && lng <= -3.94) return 'Port-Bouët';
    // Attécoubé
    if (lat >= 5.33 && lat <= 5.36 && lng >= -4.08 && lng <= -4.05) return 'Attécoubé';
    // Abobo
    if (lat >= 5.40 && lat <= 5.44 && lng >= -4.05 && lng <= -4.01) return 'Abobo';
    
    return 'Autre';
  }, []);

  const handleDetectLocation = useCallback(async () => {
    if (!isSupported) {
      toast.error('🚫 Géolocalisation non supportée par votre navigateur');
      return;
    }

    if (isDetecting) return;

    setIsDetecting(true);
    
    try {
      // Toast de chargement
      toast.loading('📍 Détection de votre position...', {
        id: 'geolocation-loading',
        duration: 15000,
      });

      const position = await requestPosition();
      
      const { latitude, longitude, accuracy, timestamp } = position;
      
      // Créer l'objet position compatible
      const locationData: ForcedGeolocationPosition = {
        latitude,
        longitude,
        accuracy,
        timestamp,
      };

      setLastPosition(locationData);

      // Détecter le quartier
      const neighborhood = getNeighborhoodFromCoordinates(latitude, longitude);
      
      // Vérifier si c'est dans Abidjan
      const isInAbidjan = neighborhood !== 'Autre';
      
      // Messages de succès selon la précision
      let successMessage = '';
      if (accuracy <= 50) {
        successMessage = `🎯 Position détectée avec précision (±${accuracy.toFixed(0)}m)`;
      } else if (accuracy <= 100) {
        successMessage = `📍 Position détectée (±${accuracy.toFixed(0)}m)`;
      } else {
        successMessage = `⚠️ Position approximative (±${accuracy.toFixed(0)}m)`;
      }

      if (isInAbidjan) {
        successMessage += ` - ${neighborhood}`;
      }

      toast.success(successMessage, {
        id: 'geolocation-success',
        duration: 5000,
      });

      // Alerte si hors d'Abidjan
      if (!isInAbidjan) {
        toast.error('⚠️ Position détectée hors d\'Abidjan. Vérifiez votre GPS ou VPN.', {
          id: 'geolocation-warning',
          duration: 8000,
        });
      }

      // Callback de succès
      if (onLocationReceived) {
        onLocationReceived(locationData);
      }

    } catch (error: any) {
      console.error('❌ Erreur de géolocalisation:', error);
      
      // Messages d'erreur contextuels
      let errorMessage = '';
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = '🚫 Autorisation de géolocalisation refusée. Vérifiez les paramètres de votre navigateur.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = '📡 Position indisponible. Vérifiez votre connexion GPS et sortez à l\'extérieur si possible.';
          break;
        case 3: // TIMEOUT
          errorMessage = '⏱️ Délai d\'attente dépassé. Réessayez en vous plaçant à l\'extérieur.';
          break;
        default:
          errorMessage = '❌ Erreur de géolocalisation. Utilisez la saisie manuelle d\'adresse.';
      }

      toast.error(errorMessage, {
        id: 'geolocation-error',
        duration: 8000,
      });

      // Callback d'erreur
      if (onError) {
        onError(error);
      }
    } finally {
      setIsDetecting(false);
    }
  }, [isSupported, isDetecting, requestPosition, onLocationReceived, onError, getNeighborhoodFromCoordinates]);

  // Classes CSS selon les variants
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const renderIcon = () => {
    if (isDetecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (lastPosition) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return <Target className="w-4 h-4" />;
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (isDetecting) {
      return 'Détection...';
    }

    if (lastPosition && showAccuracy) {
      return `Position (±${lastPosition.accuracy.toFixed(0)}m)`;
    }

    return 'Détecter ma position';
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={disabled || isDetecting || !isSupported}
        className={getButtonClasses()}
      >
        {renderIcon()}
        {renderContent()}
      </button>

      {/* Affichage des coordonnées si demandé */}
      {showAccuracy && lastPosition && (
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>
              {lastPosition.latitude.toFixed(6)}, {lastPosition.longitude.toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3" />
            <span>Précision: ±{lastPosition.accuracy.toFixed(0)}m</span>
          </div>
        </div>
      )}

      {/* Message d'aide si géolocalisation non supportée */}
      {!isSupported && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Géolocalisation non supportée</span>
        </div>
      )}
    </div>
  );
};

export default ForcedGeolocationButton;
