import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Target, Clock, Satellite, AlertCircle, CheckCircle, Navigation, Crosshair, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
  district?: string;
}

interface RealTimeLocationTrackerProps {
  onLocationUpdate: (location: LocationData) => void;
  onLocationSave: (location: LocationData) => void;
  isTracking: boolean;
  onTrackingChange: (tracking: boolean) => void;
  currentLocation?: LocationData | null;
  autoSaveThreshold?: number; // Distance en mètres pour déclencher la sauvegarde auto
  className?: string;
}

const RealTimeLocationTracker: React.FC<RealTimeLocationTrackerProps> = ({
  onLocationUpdate,
  onLocationSave,
  isTracking,
  onTrackingChange,
  currentLocation,
  autoSaveThreshold = 50,
  className = ''
}) => {
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastSavedLocation, setLastSavedLocation] = useState<LocationData | null>(null);
  const [isHighAccuracy, setIsHighAccuracy] = useState(true);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Token Mapbox pour le géocodage inverse
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWU1eXZhOGoweWJ4MmpzY2Z5cmNxZ2N5In0.ju34YgThquClMpMP-HQwyA';

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Obtenir l'adresse via géocodage inverse
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<{address: string, district: string}> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&country=CI`
      );
      
      if (!response.ok) throw new Error('Erreur géocodage');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const address = feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        // Extraire le quartier depuis les contextes
        let district = 'Abidjan';
        if (feature.context) {
          const neighborhood = feature.context.find((ctx: any) => ctx.id.includes('neighborhood'));
          if (neighborhood) {
            district = neighborhood.text;
          }
        }
        
        return { address, district };
      }
      
      return { 
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, 
        district: 'Abidjan' 
      };
    } catch (error) {
      console.warn('Erreur géocodage inverse:', error);
      return { 
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, 
        district: 'Abidjan' 
      };
    }
  };

  // Démarrer le suivi de position
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur');
      return;
    }

    onTrackingChange(true);
    setTrackingDuration(0);

    // Démarrer le compteur de durée
    trackingIntervalRef.current = setInterval(() => {
      setTrackingDuration(prev => prev + 1);
    }, 1000);

    const options: PositionOptions = {
      enableHighAccuracy: isHighAccuracy,
      timeout: 15000,
      maximumAge: 10000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };

        // Obtenir l'adresse
        try {
          const { address, district } = await getAddressFromCoordinates(
            newLocation.lat, 
            newLocation.lng
          );
          newLocation.address = address;
          newLocation.district = district;
        } catch (error) {
          console.warn('Erreur lors du géocodage:', error);
        }

        setAccuracy(position.coords.accuracy);
        setLocationHistory(prev => [...prev.slice(-9), newLocation]);
        onLocationUpdate(newLocation);

        // Vérifier si une sauvegarde automatique est nécessaire
        if (lastSavedLocation && autoSaveThreshold > 0) {
          const distance = calculateDistance(
            lastSavedLocation.lat,
            lastSavedLocation.lng,
            newLocation.lat,
            newLocation.lng
          );

          if (distance > autoSaveThreshold) {
            toast.success(`📍 Position mise à jour automatiquement (déplacement: ${Math.round(distance)}m)`, {
              duration: 4000,
              icon: '🎯'
            });
            onLocationSave(newLocation);
            setLastSavedLocation(newLocation);
          }
        }
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        let errorMessage = 'Impossible d\'obtenir votre position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé';
            break;
        }
        
        toast.error(errorMessage);
        stopTracking();
      },
      options
    );
  }, [isHighAccuracy, autoSaveThreshold, lastSavedLocation, onLocationUpdate, onLocationSave, onTrackingChange]);

  // Arrêter le suivi
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    onTrackingChange(false);
    setTrackingDuration(0);
    toast.success('Suivi de position arrêté');
  }, [onTrackingChange]);

  // Sauvegarder manuellement la position actuelle
  const saveCurrentLocation = () => {
    if (currentLocation) {
      onLocationSave(currentLocation);
      setLastSavedLocation(currentLocation);
      toast.success('📍 Position sauvegardée avec succès !', {
        duration: 3000,
        icon: '💾'
      });
    }
  };

  // Nettoyer les watchers au démontage
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Formater la durée de suivi
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtenir le statut de précision
  const getAccuracyStatus = (acc: number | null) => {
    if (!acc) return { color: 'text-gray-500', text: 'Inconnue', icon: AlertCircle };
    if (acc <= 10) return { color: 'text-green-600', text: 'Excellente', icon: CheckCircle };
    if (acc <= 50) return { color: 'text-blue-600', text: 'Bonne', icon: CheckCircle };
    if (acc <= 100) return { color: 'text-yellow-600', text: 'Moyenne', icon: AlertCircle };
    return { color: 'text-red-600', text: 'Faible', icon: AlertCircle };
  };

  const accuracyStatus = getAccuracyStatus(accuracy);
  const AccuracyIcon = accuracyStatus.icon;

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-semibold text-gray-900">
            Suivi en temps réel
          </h3>
        </div>
        
        {isTracking && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(trackingDuration)}</span>
          </div>
        )}
      </div>

      {/* Position actuelle */}
      {currentLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Position actuelle</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-blue-600 mb-1">Coordonnées</div>
              <div className="font-mono text-sm text-blue-900">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-blue-600 mb-1">Précision</div>
              <div className="flex items-center gap-2">
                <AccuracyIcon className={`w-4 h-4 ${accuracyStatus.color}`} />
                <span className={`text-sm font-medium ${accuracyStatus.color}`}>
                  {accuracyStatus.text} (±{Math.round(currentLocation.accuracy)}m)
                </span>
              </div>
            </div>
          </div>
          
          {currentLocation.district && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Quartier détecté</div>
              <div className="text-sm font-medium text-blue-900">
                {currentLocation.district}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contrôles */}
      <div className="space-y-4">
        {/* Options de précision */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Haute précision GPS</span>
          </div>
          <button
            onClick={() => setIsHighAccuracy(!isHighAccuracy)}
            disabled={isTracking}
            className={`w-12 h-6 rounded-full transition-colors ${
              isHighAccuracy ? 'bg-blue-600' : 'bg-gray-300'
            } ${isTracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              isHighAccuracy ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Target className="w-4 h-4" />
              Démarrer le suivi
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <Crosshair className="w-4 h-4" />
              Arrêter le suivi
            </button>
          )}
          
          {currentLocation && (
            <button
              onClick={saveCurrentLocation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              <Zap className="w-4 h-4" />
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Historique des positions */}
      {locationHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Historique des positions ({locationHistory.length})
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {locationHistory.slice(-5).reverse().map((location, index) => (
              <div key={index} className="flex items-center justify-between text-xs text-gray-600 p-2 bg-gray-50 rounded">
                <span className="font-mono">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
                <span>
                  {location.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeLocationTracker;
