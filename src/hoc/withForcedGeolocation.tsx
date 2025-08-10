import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import useForcedGeolocation, { GeolocationPosition } from '../hooks/useForcedGeolocation';

interface WithForcedGeolocationOptions {
  /**
   * Demander automatiquement la géolocalisation au montage
   */
  autoRequest?: boolean;
  
  /**
   * Forcer la demande de permission même si déjà accordée
   */
  forcePermission?: boolean;
  
  /**
   * Afficher un dialog d'explication avant la demande
   */
  showExplanationDialog?: boolean;
  
  /**
   * Bloquer le rendu du composant tant que la géolocalisation n'est pas obtenue
   */
  blockUntilLocation?: boolean;
  
  /**
   * Permettre de continuer sans géolocalisation
   */
  allowSkip?: boolean;
  
  /**
   * Message personnalisé pour l'explication
   */
  explanationMessage?: string;
  
  /**
   * Timeout pour la géolocalisation (ms)
   */
  timeout?: number;
  
  /**
   * Haute précision GPS
   */
  enableHighAccuracy?: boolean;
}

interface WithForcedGeolocationProps {
  position?: GeolocationPosition | null;
  geolocationError?: any;
  isLoadingLocation?: boolean;
  requestLocation?: () => Promise<void>;
  clearLocation?: () => void;
}

const DEFAULT_OPTIONS: Required<WithForcedGeolocationOptions> = {
  autoRequest: true,
  forcePermission: true,
  showExplanationDialog: true,
  blockUntilLocation: false,
  allowSkip: true,
  explanationMessage: 'Cette page nécessite votre position pour fonctionner correctement.',
  timeout: 15000,
  enableHighAccuracy: true,
};

/**
 * HOC qui ajoute la géolocalisation forcée à n'importe quel composant
 */
export function withForcedGeolocation<P extends object>(
  WrappedComponent: React.ComponentType<P & WithForcedGeolocationProps>,
  options: WithForcedGeolocationOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return function WithForcedGeolocationComponent(props: P) {
    const [hasUserDecision, setHasUserDecision] = useState(false);
    const [userSkipped, setUserSkipped] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    const {
      position,
      error,
      isLoading,
      isSupported,
      permissionStatus,
      requestPosition,
      clearPosition,
      forcePermissionRequest,
    } = useForcedGeolocation({
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: 0,
      forcePermission: opts.forcePermission,
    });

    // Fonction pour demander la géolocalisation
    const handleRequestLocation = async () => {
      try {
        if (opts.forcePermission || permissionStatus === 'denied') {
          await forcePermissionRequest();
        } else {
          await requestPosition();
        }
      } catch (err) {
        console.error('Failed to get location:', err);
      }
    };

    // Gérer la demande automatique
    useEffect(() => {
      if (!isSupported) {
        toast.error('🚫 Géolocalisation non supportée par ce navigateur');
        setHasUserDecision(true);
        return;
      }

      if (opts.autoRequest && !hasUserDecision && !position) {
        const timer = setTimeout(() => {
          if (opts.showExplanationDialog) {
            setShowDialog(true);
          } else {
            handleRequestLocation();
            setHasUserDecision(true);
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }, [opts.autoRequest, opts.showExplanationDialog, hasUserDecision, position, isSupported]);

    // Gérer la réponse du dialog
    const handleDialogResponse = async (accept: boolean) => {
      setShowDialog(false);
      setHasUserDecision(true);

      if (accept) {
        await handleRequestLocation();
      } else {
        setUserSkipped(true);
        if (opts.allowSkip) {
          toast('ℹ️ Vous pouvez activer la géolocalisation à tout moment', {
            duration: 4000,
          });
        }
      }
    };

    // Dialog d'explication personnalisé
    if (showDialog) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Géolocalisation requise
              </h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              {opts.explanationMessage}
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Pourquoi nous en avons besoin :</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Trouver les pressings les plus proches de vous</li>
                <li>• Calculer les distances et temps de trajet</li>
                <li>• Améliorer la précision des services</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDialogResponse(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Autoriser la géolocalisation
              </button>
              
              {opts.allowSkip && (
                <button
                  onClick={() => handleDialogResponse(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Continuer sans
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Écran de chargement si bloquant
    if (opts.blockUntilLocation && !position && !userSkipped && !error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center">
            {isLoading ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Détection de votre position...
                </h2>
                <p className="text-gray-600 mb-6">
                  Veuillez autoriser la géolocalisation pour continuer
                </p>
              </>
            ) : (
              <>
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Géolocalisation requise
                </h2>
                <p className="text-gray-600 mb-6">
                  {opts.explanationMessage}
                </p>
              </>
            )}

            <button
              onClick={handleRequestLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Localisation...' : 'Activer la géolocalisation'}
            </button>

            {opts.allowSkip && !isLoading && (
              <button
                onClick={() => setUserSkipped(true)}
                className="block mt-4 text-gray-500 hover:text-gray-700 underline"
              >
                Continuer sans géolocalisation
              </button>
            )}
          </div>
        </div>
      );
    }

    // Rendu du composant avec les props de géolocalisation
    return (
      <WrappedComponent
        {...props}
        position={position}
        geolocationError={error}
        isLoadingLocation={isLoading}
        requestLocation={handleRequestLocation}
        clearLocation={clearPosition}
      />
    );
  };
}

export default withForcedGeolocation;
