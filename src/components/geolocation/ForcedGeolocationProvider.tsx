import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useForcedGeolocation, { GeolocationPosition } from '../../hooks/useForcedGeolocation';

export interface ForcedGeolocationContextType {
  position: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  requestLocation: () => Promise<GeolocationPosition | null>;
  clearLocation: () => void;
  hasPermission: boolean;
}

const ForcedGeolocationContext = createContext<ForcedGeolocationContextType | null>(null);

interface ForcedGeolocationProviderProps {
  children: React.ReactNode;
  autoRequest?: boolean;
  showExplanationDialog?: boolean;
  explanationTitle?: string;
  explanationMessage?: string;
}

export const ForcedGeolocationProvider: React.FC<ForcedGeolocationProviderProps> = ({
  children,
  autoRequest = false,
  showExplanationDialog = true,
  explanationTitle = "Autorisation de géolocalisation",
  explanationMessage = "Cette application a besoin d'accéder à votre position pour vous proposer les pressings les plus proches de vous.",
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [explanationShown, setExplanationShown] = useState(false);

  const {
    position,
    error,
    isLoading,
    isSupported,
    requestPosition,
    clearPosition,
    permissionStatus,
  } = useForcedGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    forcePermission: true,
    autoRequest: false,
  });

  // Surveiller le statut des permissions
  useEffect(() => {
    setHasPermission(permissionStatus === 'granted');
  }, [permissionStatus]);

  // Demande automatique au montage si activée
  useEffect(() => {
    if (autoRequest && isSupported && !position && !isLoading) {
      handleRequestLocation();
    }
  }, [autoRequest, isSupported, position, isLoading]);

  const showExplanationIfNeeded = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!showExplanationDialog || explanationShown) {
        resolve(true);
        return;
      }

      const userAccepted = window.confirm(
        `${explanationTitle}\n\n${explanationMessage}\n\nVoulez-vous autoriser l'accès à votre position ?`
      );

      setExplanationShown(true);
      resolve(userAccepted);
    });
  }, [showExplanationDialog, explanationShown, explanationTitle, explanationMessage]);

  const handleRequestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!isSupported) {
      toast.error('🚫 Géolocalisation non supportée par votre navigateur');
      return null;
    }

    try {
      // Afficher l'explication si nécessaire
      const userAccepted = await showExplanationIfNeeded();
      if (!userAccepted) {
        toast('ℹ️ Géolocalisation annulée par l\'utilisateur', {
          icon: 'ℹ️',
          duration: 3000,
        });
        return null;
      }

      // Demander la position
      const newPosition = await requestPosition();
      
      if (newPosition) {
        setHasPermission(true);
        
        // Message de succès avec précision
        const { accuracy } = newPosition;
        let message = '';
        
        if (accuracy <= 50) {
          message = `🎯 Position détectée avec haute précision (±${accuracy.toFixed(0)}m)`;
        } else if (accuracy <= 100) {
          message = `📍 Position détectée (±${accuracy.toFixed(0)}m)`;
        } else if (accuracy <= 1000) {
          message = `📍 Position détectée (±${accuracy.toFixed(0)}m) - Précision moyenne`;
        } else {
          message = `⚠️ Position approximative (±${accuracy.toFixed(0)}m) - Sortez à l'extérieur pour plus de précision`;
        }

        toast.success(message, {
          id: 'geolocation-success',
          duration: 5000,
        });

        return newPosition;
      }

      return null;
    } catch (err: any) {
      console.error('❌ Erreur lors de la demande de géolocalisation:', err);
      
      let errorMessage = '';
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = '🚫 Autorisation de géolocalisation refusée. Vous pouvez l\'activer dans les paramètres de votre navigateur.';
          setHasPermission(false);
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = '📡 Position indisponible. Vérifiez votre connexion GPS et sortez à l\'extérieur si possible.';
          break;
        case 3: // TIMEOUT
          errorMessage = '⏱️ Délai d\'attente dépassé. Réessayez en vous plaçant dans un endroit avec un bon signal GPS.';
          break;
        default:
          errorMessage = '❌ Erreur de géolocalisation. Vous pouvez saisir votre adresse manuellement.';
      }

      toast.error(errorMessage, {
        id: 'geolocation-error',
        duration: 8000,
      });

      return null;
    }
  }, [isSupported, requestPosition, showExplanationIfNeeded]);

  const handleClearLocation = useCallback(() => {
    clearPosition();
    setHasPermission(false);
    setExplanationShown(false);
    
    toast('📍 Position effacée', {
      id: 'geolocation-cleared',
      icon: '📍',
      duration: 2000,
    });
  }, [clearPosition]);

  const contextValue: ForcedGeolocationContextType = {
    position,
    isLoading,
    error: error?.message || null,
    isSupported,
    requestLocation: handleRequestLocation,
    clearLocation: handleClearLocation,
    hasPermission,
  };

  return (
    <ForcedGeolocationContext.Provider value={contextValue}>
      {children}
    </ForcedGeolocationContext.Provider>
  );
};

export const useForcedGeolocationContext = (): ForcedGeolocationContextType => {
  const context = useContext(ForcedGeolocationContext);
  
  if (!context) {
    throw new Error(
      'useForcedGeolocationContext must be used within a ForcedGeolocationProvider'
    );
  }
  
  return context;
};

export default ForcedGeolocationProvider;
