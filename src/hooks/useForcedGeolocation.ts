import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseForcedGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  forcePermission?: boolean;
  autoRequest?: boolean;
}

export interface UseForcedGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  permissionStatus: PermissionState | null;
  requestPosition: () => Promise<GeolocationPosition>;
  clearPosition: () => void;
  watchPosition: () => void;
  clearWatch: () => void;
  forcePermissionRequest: () => Promise<boolean>;
}

const DEFAULT_OPTIONS: Required<UseForcedGeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
  forcePermission: true,
  autoRequest: false,
};

export const useForcedGeolocation = (
  options: UseForcedGeolocationOptions = {}
): UseForcedGeolocationReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
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
        
        // Écouter les changements de permission
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

  // Forcer la demande d'autorisation
  const forcePermissionRequest = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('🚫 Géolocalisation non supportée par ce navigateur');
      return false;
    }

    try {
      // Afficher un toast informatif
      toast.loading('📍 Demande d\'autorisation de géolocalisation...', {
        id: 'permission-request',
        duration: 3000,
      });

      // Faire une demande de position pour déclencher la permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            reject({
              code: err.code,
              message: getErrorMessage(err.code),
            });
          },
          {
            enableHighAccuracy: opts.enableHighAccuracy,
            timeout: opts.timeout,
            maximumAge: 0, // Forcer une nouvelle demande
          }
        );
      });

      toast.success('✅ Autorisation accordée !', { id: 'permission-request' });
      setPosition(position);
      setError(null);
      await checkPermissionStatus();
      return true;
    } catch (err: any) {
      toast.error(`❌ ${err.message}`, { id: 'permission-request' });
      setError(err);
      
      // Afficher des conseils selon le type d'erreur
      if (err.code === 1) {
        toast.error('💡 Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur', {
          duration: 5000,
        });
      }
      
      await checkPermissionStatus();
      return false;
    }
  }, [isSupported, opts.enableHighAccuracy, opts.timeout, checkPermissionStatus]);

  // Obtenir la position actuelle
  const requestPosition = useCallback(async (): Promise<GeolocationPosition> => {
    if (!isSupported) {
      throw new Error('Géolocalisation non supportée');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Si la permission est refusée, forcer une nouvelle demande
      if (permissionStatus === 'denied' || opts.forcePermission) {
        const granted = await forcePermissionRequest();
        if (!granted) {
          throw new Error('Autorisation de géolocalisation refusée');
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            reject({
              code: err.code,
              message: getErrorMessage(err.code),
            });
          },
          {
            enableHighAccuracy: opts.enableHighAccuracy,
            timeout: opts.timeout,
            maximumAge: opts.maximumAge,
          }
        );
      });

      setPosition(position);
      setError(null);
      
      // Toast de succès avec précision
      const precision = position.accuracy < 100 ? 'précise' : 'approximative';
      toast.success(`📍 Position détectée (${precision}: ±${Math.round(position.accuracy)}m)`, {
        duration: 3000,
      });

      return position;
    } catch (err: any) {
      setError(err);
      toast.error(`❌ ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permissionStatus, opts, forcePermissionRequest]);

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
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        
        setPosition(newPosition);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        const error = {
          code: err.code,
          message: getErrorMessage(err.code),
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
    if (opts.autoRequest && isSupported) {
      requestPosition().catch(() => {
        // Erreur déjà gérée dans requestPosition
      });
    }
  }, [opts.autoRequest, isSupported, requestPosition]);

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

export default useForcedGeolocation;
