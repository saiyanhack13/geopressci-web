import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface MapboxGeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source: 'native' | 'mapbox' | 'ip';
}

export interface MapboxGeolocationError {
  code: number;
  message: string;
  source: 'native' | 'mapbox';
}

export interface UseMapboxGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  autoRequest?: boolean;
}

export interface UseMapboxGeolocationReturn {
  position: MapboxGeolocationPosition | null;
  error: MapboxGeolocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  permissionStatus: PermissionState | null;
  requestPosition: () => Promise<MapboxGeolocationPosition>;
  clearPosition: () => void;
  watchPosition: () => void;
  clearWatch: () => void;
  forcePermissionRequest: () => Promise<boolean>;
}

const DEFAULT_OPTIONS: Required<UseMapboxGeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 300000, // 5 minutes de cache
  fallbackToIP: true,
  autoRequest: false,
};

// Récupérer le token Mapbox depuis les variables d'environnement
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWUzOTVnc2wwNTVsMmxzZTF1Zm13ZWVjIn0.o48XqkHK-s4jF4qLzLKRQ';

export const useMapboxGeolocation = (
  options: UseMapboxGeolocationOptions = {}
): UseMapboxGeolocationReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [position, setPosition] = useState<MapboxGeolocationPosition | null>(null);
  const [error, setError] = useState<MapboxGeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const isSupported = 'geolocation' in navigator;

  // Vérifier le statut de permission
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        permission.onchange = () => {
          setPermissionStatus(permission.state);
        };
        
        return permission.state;
      } catch (err) {
        console.warn('Permission API not supported:', err);
        return null;
      }
    }
    return null;
  }, []);

  // Géolocalisation via l'API Mapbox avec méthodes multiples pour précision optimale
  const getMapboxGeolocation = useCallback(async (): Promise<MapboxGeolocationPosition> => {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Token Mapbox manquant');
    }

    try {
      // Méthode 1: Géolocalisation IP précise avec contexte Abidjan
      const ipGeolocationUrl = `https://api.mapbox.com/search/geocode/v6/forward?q=ip&access_token=${MAPBOX_ACCESS_TOKEN}&proximity=-4.0319,5.3364&country=CI&limit=1`;
      
      const ipResponse = await fetch(ipGeolocationUrl);
      
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        if (ipData.features && ipData.features.length > 0) {
          const feature = ipData.features[0];
          const [longitude, latitude] = feature.geometry.coordinates;
          
          // Vérifier si la position est dans la région d'Abidjan
          const isInAbidjan = latitude >= 5.2 && latitude <= 5.5 && longitude >= -4.3 && longitude <= -3.8;
          
          if (isInAbidjan) {
            return {
              latitude,
              longitude,
              accuracy: 500, // Précision améliorée avec contexte géographique
              timestamp: Date.now(),
              source: 'mapbox'
            };
          }
        }
      }

      // Méthode 2: Utiliser l'API de géolocalisation HTML5 avec amélioration Mapbox
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 300000
              }
            );
          });

          // Améliorer la précision avec le géocodage inverse Mapbox
          const reverseUrl = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}&access_token=${MAPBOX_ACCESS_TOKEN}&types=address,poi&country=CI&limit=1`;
          
          const reverseResponse = await fetch(reverseUrl);
          if (reverseResponse.ok) {
            const reverseData = await reverseResponse.json();
            if (reverseData.features && reverseData.features.length > 0) {
              const feature = reverseData.features[0];
              const [refinedLng, refinedLat] = feature.geometry.coordinates;
              
              return {
                latitude: refinedLat,
                longitude: refinedLng,
                accuracy: Math.min(position.coords.accuracy, 50), // Précision améliorée
                timestamp: Date.now(),
                source: 'mapbox'
              };
            }
          }

          // Fallback sur la position GPS native
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            source: 'mapbox'
          };
        } catch (gpsError) {
          console.warn('GPS natif échoué, utilisation IP fallback:', gpsError);
        }
      }

      // Méthode 3: Fallback sur géolocalisation IP basique
      const basicIpUrl = `https://api.mapbox.com/search/geocode/v6/forward?q=Abidjan,Côte d'Ivoire&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
      const basicResponse = await fetch(basicIpUrl);
      
      if (basicResponse.ok) {
        const basicData = await basicResponse.json();
        if (basicData.features && basicData.features.length > 0) {
          const feature = basicData.features[0];
          const [longitude, latitude] = feature.geometry.coordinates;
          
          return {
            latitude,
            longitude,
            accuracy: 2000, // Précision approximative pour centre d'Abidjan
            timestamp: Date.now(),
            source: 'mapbox'
          };
        }
      }

      throw new Error('Toutes les méthodes de géolocalisation Mapbox ont échoué');
    } catch (err: any) {
      throw {
        code: 2,
        message: `Erreur Mapbox: ${err.message}`,
        source: 'mapbox' as const
      };
    }
  }, []);

  // Géolocalisation native avec fallback Mapbox
  const getNativeGeolocation = useCallback(async (): Promise<MapboxGeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject({
          code: 0,
          message: 'Géolocalisation non supportée par ce navigateur',
          source: 'native' as const
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            source: 'native'
          });
        },
        async (err) => {
          // En cas d'erreur native, essayer Mapbox si activé
          if (opts.fallbackToIP && MAPBOX_ACCESS_TOKEN) {
            try {
              const mapboxPosition = await getMapboxGeolocation();
              resolve(mapboxPosition);
            } catch (mapboxErr: any) {
              reject({
                code: err.code,
                message: `GPS natif échoué, Mapbox aussi: ${mapboxErr.message}`,
                source: 'native' as const
              });
            }
          } else {
            reject({
              code: err.code,
              message: getErrorMessage(err.code),
              source: 'native' as const
            });
          }
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge,
        }
      );
    });
  }, [isSupported, opts, getMapboxGeolocation]);

  // Forcer la demande d'autorisation
  const forcePermissionRequest = useCallback(async (): Promise<boolean> => {
    if (!isSupported && !MAPBOX_ACCESS_TOKEN) {
      toast.error('🚫 Géolocalisation non supportée et pas de token Mapbox');
      return false;
    }

    try {
      toast.loading('📍 Demande d\'autorisation de géolocalisation...', {
        id: 'permission-request',
        duration: 3000,
      });

      const position = await getNativeGeolocation();
      
      toast.success(`✅ Position obtenue via ${position.source === 'native' ? 'GPS' : 'Mapbox'} !`, { 
        id: 'permission-request' 
      });
      
      setPosition(position);
      setError(null);
      await checkPermissionStatus();
      return true;
    } catch (err: any) {
      toast.error(`❌ ${err.message}`, { id: 'permission-request' });
      setError(err);
      
      if (err.code === 1) {
        toast.error('💡 Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur', {
          duration: 5000,
        });
      }
      
      await checkPermissionStatus();
      return false;
    }
  }, [isSupported, getNativeGeolocation, checkPermissionStatus]);

  // Demander la position
  const requestPosition = useCallback(async (): Promise<MapboxGeolocationPosition> => {
    if (permissionStatus === 'denied' && !MAPBOX_ACCESS_TOKEN) {
      const error = {
        code: 1,
        message: 'Autorisation refusée et pas de fallback Mapbox',
        source: 'native' as const
      };
      setError(error);
      throw error;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await getNativeGeolocation();
      setPosition(position);
      setError(null);
      
      // Toast de succès avec informations sur la source et précision
      const sourceText = position.source === 'native' ? 'GPS natif' : 'Mapbox';
      const precisionText = position.accuracy < 100 ? 'précise' : 'approximative';
      
      toast.success(
        `📍 Position détectée via ${sourceText} (${precisionText}: ±${Math.round(position.accuracy)}m)`,
        { duration: 3000 }
      );

      return position;
    } catch (err: any) {
      setError(err);
      toast.error(`❌ ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permissionStatus, getNativeGeolocation]);

  // Surveiller la position en continu
  const watchPosition = useCallback(() => {
    if (!isSupported) {
      toast.error('🚫 Géolocalisation non supportée');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: MapboxGeolocationPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          source: 'native'
        };
        
        setPosition(newPosition);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        const error: MapboxGeolocationError = {
          code: err.code,
          message: getErrorMessage(err.code),
          source: 'native'
        };
        setError(error);
        setIsLoading(false);
        toast.error(`❌ ${error.message}`);
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );

    toast.success('🔄 Suivi de position activé');
  }, [isSupported, opts]);

  // Arrêter la surveillance
  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      toast.success('⏹️ Suivi de position arrêté');
    }
  }, []);

  // Effacer la position
  const clearPosition = useCallback(() => {
    setPosition(null);
    setError(null);
    clearWatch();
  }, [clearWatch]);

  // Auto-request au montage si activé
  useEffect(() => {
    if (opts.autoRequest) {
      requestPosition().catch(() => {
        // Erreur déjà gérée dans requestPosition
      });
    }
  }, [opts.autoRequest, requestPosition]);

  // Vérifier le statut de permission au montage
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      clearWatch();
    };
  }, [clearWatch]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    permissionStatus,
    requestPosition,
    clearPosition,
    watchPosition,
    clearWatch,
    forcePermissionRequest,
  };
};

// Messages d'erreur personnalisés
const getErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return 'Autorisation de géolocalisation refusée. Veuillez l\'activer dans les paramètres.';
    case 2:
      return 'Position indisponible. Vérifiez votre connexion GPS et sortez à l\'extérieur.';
    case 3:
      return 'Délai d\'attente dépassé. Réessayez ou sortez à l\'extérieur pour un meilleur signal.';
    default:
      return 'Erreur de géolocalisation inconnue.';
  }
};

export default useMapboxGeolocation;
