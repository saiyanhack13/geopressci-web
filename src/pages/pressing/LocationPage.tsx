import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapPin, Target, Navigation2, CheckCircle, XCircle, Satellite, Loader, Crosshair, Clock, Save, RefreshCw } from 'lucide-react';
import { 
  useGetPressingProfileQuery,
  useUpdatePressingProfileMutation
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import PressingLayout from '../../components/pressing/PressingLayout';
import MapboxMap from '../../components/MapboxMap';
import AddressLocationManager from '../../components/pressing/AddressLocationManager';
import ManualLocationSelector from '../../components/geolocation/ManualLocationSelector';

// Import des composants de géolocalisation Mapbox
import MapboxGeolocationButton from '../../components/geolocation/MapboxGeolocationButton';
import { MapboxGeolocationPosition } from '../../hooks/useMapboxGeolocation';
import RealTimeLocationTracker from '../../components/geolocation/RealTimeLocationTracker';
import LocationHelpGuide from '../../components/pressing/LocationHelpGuide';

// Types pour les coordonnées
interface AddressData {
  street: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const LocationPage: React.FC = () => {
  // API Hooks pour récupérer les vraies données
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch } = useGetPressingProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePressingProfileMutation();
  
  // États locaux pour la sélection manuelle de position
  const [showManualSelector, setShowManualSelector] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // États pour la géolocalisation
  const [geolocationStatus, setGeolocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // États pour la position en temps réel
  const [realTimePosition, setRealTimePosition] = useState<{lat: number, lng: number} | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  
  // Coordonnées par défaut d'Abidjan
  const defaultCoordinates = { lat: 5.3364, lng: -4.0267 };

  // Fonction pour valider et extraire les coordonnées
  const extractValidCoordinates = (coords: any) => {
    // Si c'est déjà au bon format
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && 
        !isNaN(coords.lat) && !isNaN(coords.lng)) {
      return coords;
    }
    
    // Si c'est un format GeoJSON (coordinates: [lng, lat])
    if (coords && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
      const [lng, lat] = coords.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Si c'est un tableau direct [lng, lat]
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Retourner les coordonnées par défaut si rien ne fonctionne
    return defaultCoordinates;
  };

  // Transformer les données du profil en format local
  const currentAddress = useMemo(() => {
    if (!profileData?.address) {
      return {
        street: '',
        city: 'Abidjan',
        district: '',
        postalCode: '00225',
        country: 'Côte d\'Ivoire',
        coordinates: defaultCoordinates
      };
    }
    
    return {
      street: profileData.address.street || '',
      city: profileData.address.city || 'Abidjan',
      district: profileData.address.district || '',
      postalCode: profileData.address.postalCode || '00225',
      country: profileData.address.country || 'Côte d\'Ivoire',
      coordinates: extractValidCoordinates(profileData.address.coordinates)
    };
  }, [profileData]);

  // Gérer les changements d'adresse
  const handleAddressChange = (newAddress: AddressData) => {
    setHasUnsavedChanges(true);
    // L'adresse sera mise à jour via le composant AddressLocationManager
  };

  // Gérer la sélection manuelle de position
  const handleManualLocationSelected = (location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
  }) => {
    const updatedAddress = {
      ...currentAddress,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      district: location.district,
      street: currentAddress.street || location.address
    };
    
    handleSaveAddress(updatedAddress);
    setShowManualSelector(false);
  };

  // Sauvegarder l'adresse
  const handleSaveAddress = async (addressToSave: AddressData) => {
    try {
      const updateData = {
        address: {
          street: addressToSave.street,
          city: addressToSave.city,
          district: addressToSave.district,
          postalCode: addressToSave.postalCode,
          country: addressToSave.country,
          coordinates: {
            lat: addressToSave.coordinates.lat,
            lng: addressToSave.coordinates.lng
          }
        }
      };

      await updateProfile(updateData).unwrap();
      setHasUnsavedChanges(false);
      setRealTimePosition(addressToSave.coordinates);
      setLastLocationUpdate(new Date());
      
      toast.success('📍 Position sauvegardée comme localisation en temps réel !', {
        duration: 4000,
        icon: '🎯'
      });
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'adresse:', error);
      toast.error('❌ Erreur lors de la mise à jour de l\'adresse');
    }
  };

  // Démarrer le suivi de position en temps réel
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur');
      return;
    }

    setIsTrackingLocation(true);
    setGeolocationStatus('loading');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setRealTimePosition(newPosition);
        setLastLocationUpdate(new Date());
        setLocationAccuracy(position.coords.accuracy);
        setGeolocationStatus('success');
        
        // Auto-sauvegarder la position si elle a changé significativement
        if (currentAddress.coordinates) {
          const distance = calculateDistance(
            currentAddress.coordinates.lat,
            currentAddress.coordinates.lng,
            newPosition.lat,
            newPosition.lng
          );
          
          // Si la distance est supérieure à 50 mètres, proposer de mettre à jour
          if (distance > 0.05) {
            toast('📍 Nouvelle position détectée. Voulez-vous la sauvegarder ?', {
              duration: 8000,
              icon: '🎯'
            });
          }
        }
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        setGeolocationStatus('error');
        toast.error('Impossible d\'obtenir votre position');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Nettoyer le watcher après 5 minutes
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      setIsTrackingLocation(false);
    }, 300000);
  }, [currentAddress.coordinates]);

  // Arrêter le suivi de position
  const stopLocationTracking = useCallback(() => {
    setIsTrackingLocation(false);
    setGeolocationStatus('idle');
    toast.success('Suivi de position arrêté');
  }, []);

  // Calculer la distance entre deux points (en km)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sauvegarder la position en temps réel actuelle
  const saveCurrentRealTimePosition = async () => {
    if (!realTimePosition) {
      toast.error('Aucune position en temps réel disponible');
      return;
    }

    const updatedAddress = {
      ...currentAddress,
      coordinates: realTimePosition
    };

    await handleSaveAddress(updatedAddress);
  };

  // Initialiser la position en temps réel depuis le profil (utiliser les coordonnees de l'adresse)
  useEffect(() => {
    if (profileData?.address?.coordinates) {
      const coords = extractValidCoordinates(profileData.address.coordinates);
      setRealTimePosition(coords);
      setLastLocationUpdate(new Date()); // Utiliser la date actuelle
    }
  }, [profileData]);

  // Fonction pour détecter le quartier depuis les coordonnées
  const getNeighborhoodFromCoordinates = useCallback((lat: number, lng: number): string => {
    const neighborhoods = [
      { name: 'Cocody', bounds: { north: 5.37, south: 5.32, east: -3.95, west: -4.02 } },
      { name: 'Plateau', bounds: { north: 5.33, south: 5.31, east: -4.00, west: -4.02 } },
      { name: 'Yopougon', bounds: { north: 5.36, south: 5.32, east: -4.08, west: -4.12 } },
      { name: 'Marcory', bounds: { north: 5.31, south: 5.28, east: -3.99, west: -4.02 } },
      { name: 'Treichville', bounds: { north: 5.31, south: 5.28, east: -4.00, west: -4.03 } },
      { name: 'Adjamé', bounds: { north: 5.37, south: 5.34, east: -4.02, west: -4.05 } }
    ];
    
    for (const neighborhood of neighborhoods) {
      const { bounds } = neighborhood;
      if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
        return neighborhood.name;
      }
    }
    return 'Autre';
  }, []);

  // Gestionnaire de réception de position Mapbox
  const handleLocationReceived = useCallback((position: MapboxGeolocationPosition) => {
    const { latitude, longitude, accuracy, source } = position;
    
    // Créer la nouvelle adresse avec les coordonnées détectées
    const detectedNeighborhood = getNeighborhoodFromCoordinates(latitude, longitude);
    const updatedAddress: AddressData = {
      ...currentAddress,
      coordinates: {
        lat: latitude,
        lng: longitude
      },
      district: detectedNeighborhood !== 'Autre' ? detectedNeighborhood : currentAddress.district
    };
    
    setGeolocationStatus('success');
    
    // Sauvegarder automatiquement la nouvelle position
    handleSaveAddress(updatedAddress);
    
    // Toast de succès avec informations détaillées
    const sourceText = source === 'native' ? 'GPS natif' : source === 'mapbox' ? 'Mapbox' : 'IP';
    const precisionText = accuracy <= 100 ? 'Précise' : 'Approximative';
    
    toast.success(
      `📍 Position détectée via ${sourceText} • ${precisionText} (±${Math.round(accuracy)}m)${detectedNeighborhood !== 'Autre' ? ` • ${detectedNeighborhood}` : ''}`,
      {
        duration: 4000,
        id: 'geolocation-success'
      }
    );
  }, [currentAddress, handleSaveAddress, getNeighborhoodFromCoordinates]);

  // Gestionnaire d'erreur de géolocalisation
  const handleLocationError = useCallback((error: any) => {
    setGeolocationStatus('error');
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        toast.error('🚫 Autorisation de géolocalisation refusée.', { id: 'geolocation-error' });
        break;
      case 2: // POSITION_UNAVAILABLE
        toast.error('📡 Position indisponible. Vérifiez votre connexion GPS.', { id: 'geolocation-error' });
        break;
      case 3: // TIMEOUT
        toast.error('⏱️ Délai d\'attente dépassé. Réessayez.', { id: 'geolocation-error' });
        break;
      default:
        toast.error('❌ Erreur de géolocalisation. Utilisez la sélection manuelle.', { id: 'geolocation-error' });
    }
  }, []);

  // Vérifier si les coordonnées sont valides (dans la zone d'Abidjan)
  const hasValidCoordinates = useMemo(() => {
    if (!currentAddress.coordinates || typeof currentAddress.coordinates.lat !== 'number' || typeof currentAddress.coordinates.lng !== 'number') {
      return false;
    }
    const { lat, lng } = currentAddress.coordinates;
    return lat >= 5.2 && lat <= 5.5 && lng >= -4.2 && lng <= -3.8;
  }, [currentAddress.coordinates]);

  if (profileLoading) {
    return (
      <PressingLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="bg-white rounded-2xl p-8 space-y-6">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-96 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PressingLayout>
    );
  }

  return (
    <PressingLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  📍 Localisation de votre pressing
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Définissez précisément l'adresse et la position GPS de votre pressing
                </p>
              </div>
            </div>
            
            {/* Statut de la position */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              hasValidCoordinates 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {hasValidCoordinates ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Position GPS définie
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Position GPS non définie
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Section Adresse et Position */}
            <div className="lg:col-span-2 space-y-6">
              {/* Adresse et Géolocalisation */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        🏠 Adresse principale
                      </h2>
                      <p className="text-gray-600">
                        L'adresse où les clients peuvent vous trouver
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Bouton de géolocalisation automatique */}
                      <MapboxGeolocationButton
                        onLocationReceived={handleLocationReceived}
                        onError={handleLocationError}
                        variant="primary"
                        size="sm"
                        showAccuracy={true}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Satellite className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Détecter ma position</span>
                      </MapboxGeolocationButton>
                      
                      <button
                        onClick={() => setShowManualSelector(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Sélectionner sur carte</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicateur de géolocalisation */}
                  {geolocationStatus === 'success' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Position GPS détectée avec succès</span>
                      </div>
                    </div>
                  )}
                  
                  {geolocationStatus === 'loading' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Détection de votre position en cours...</span>
                      </div>
                    </div>
                  )}
                  
                  <AddressLocationManager
                    address={currentAddress}
                    onAddressChange={(newAddress) => {
                      handleAddressChange(newAddress);
                      handleSaveAddress(newAddress);
                    }}
                    isLoading={isUpdating}
                  />
                </div>
              </div>

              {/* Carte de visualisation */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    🗺️ Visualisation sur carte
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Votre position actuelle sur la carte d'Abidjan
                  </p>
                  
                  <div className="relative">
                    <MapboxMap
                      center={currentAddress.coordinates}
                      zoom={15}
                      height="400px"
                      markers={[{
                        lat: currentAddress.coordinates.lat,
                        lng: currentAddress.coordinates.lng,
                        title: profileData?.businessName || 'Mon Pressing',
                        info: currentAddress.street || 'Adresse non définie',
                        isValidated: hasValidCoordinates
                      }]}
                      className="rounded-xl overflow-hidden"
                    />
                    
                    {!hasValidCoordinates && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
                        <div className="bg-white rounded-lg p-6 text-center max-w-sm">
                          <Target className="w-12 h-12 text-red-500 mx-auto mb-3" />
                          <h3 className="font-bold text-gray-900 mb-2">
                            Position non définie
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Utilisez le bouton "Sélectionner sur carte" pour définir votre position exacte.
                          </p>
                          <button
                            onClick={() => setShowManualSelector(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Définir maintenant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Informations et Conseils */}
            <div className="space-y-6">
              {/* Informations actuelles */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-blue-600" />
                  Position actuelle
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Quartier :</span>
                    <p className="font-medium text-gray-900">
                      {currentAddress.district || 'Non défini'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Coordonnées :</span>
                    <p className="font-mono text-xs text-gray-700">
                      {currentAddress.coordinates?.lat?.toFixed(6) || 'N/A'}, {currentAddress.coordinates?.lng?.toFixed(6) || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Précision :</span>
                    <p className={`font-medium ${
                      hasValidCoordinates ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {hasValidCoordinates ? 'Position valide' : 'Position à définir'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guide d'utilisation */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-900 mb-4">
                  💡 Comment ça marche ?
                </h3>
                
                <div className="space-y-4 text-sm text-blue-800">
                  <div>
                    <p className="font-medium mb-1">1. Sélection manuelle</p>
                    <p className="text-blue-700">
                      Cliquez sur "Sélectionner sur carte" pour ouvrir la carte interactive et choisir votre position exacte.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">2. Positionnement précis</p>
                    <p className="text-blue-700">
                      Cliquez sur la carte ou déplacez le marqueur pour définir l'emplacement exact de votre pressing.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">3. Validation automatique</p>
                    <p className="text-blue-700">
                      Le quartier est détecté automatiquement et l'adresse est mise à jour en temps réel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Composant de suivi en temps réel avancé */}
              <RealTimeLocationTracker
                onLocationUpdate={(location) => {
                  setRealTimePosition({ lat: location.lat, lng: location.lng });
                  setLastLocationUpdate(location.timestamp);
                  setLocationAccuracy(location.accuracy);
                }}
                onLocationSave={async (location) => {
                  const updatedAddress = {
                    ...currentAddress,
                    coordinates: { lat: location.lat, lng: location.lng },
                    district: location.district || currentAddress.district
                  };
                  await handleSaveAddress(updatedAddress);
                }}
                isTracking={isTrackingLocation}
                onTrackingChange={setIsTrackingLocation}
                currentLocation={realTimePosition ? {
                  lat: realTimePosition.lat,
                  lng: realTimePosition.lng,
                  accuracy: locationAccuracy || 10,
                  timestamp: lastLocationUpdate || new Date()
                } : null}
                autoSaveThreshold={50}
              />

              {/* Avantages */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="font-bold text-green-900 mb-4">
                  ✨ Avantages d'une position précise
                </h3>
                
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Meilleure visibilité dans les recherches locales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Calcul précis des distances de livraison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Facilite la navigation pour les clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Améliore la confiance des clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Position en temps réel pour plus de précision</span>
                  </li>
                </ul>
              </div>

              {/* Guide d'aide pour la géolocalisation */}
              <LocationHelpGuide />

              {/* Statistiques de position */}
              {hasValidCoordinates && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">
                    📊 Détails techniques
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latitude :</span>
                      <span className="font-mono text-gray-900">
                        {currentAddress.coordinates?.lat?.toFixed(6) || 'N/A'}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longitude :</span>
                      <span className="font-mono text-gray-900">
                        {currentAddress.coordinates?.lng?.toFixed(6) || 'N/A'}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zone :</span>
                      <span className="text-gray-900">Abidjan, Côte d'Ivoire</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Système :</span>
                      <span className="text-gray-900">WGS84 (GPS)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection manuelle */}
      <ManualLocationSelector
        isOpen={showManualSelector}
        initialPosition={currentAddress.coordinates}
        onLocationSelected={handleManualLocationSelected}
        onCancel={() => setShowManualSelector(false)}
      />
    </PressingLayout>
  );
};

export default LocationPage;
