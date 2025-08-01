import React, { useState, useMemo } from 'react';
import { MapPin, ArrowLeft, Edit, Save, PlusCircle, Trash2, Truck, CheckCircle, XCircle } from 'lucide-react';
import { 
  useGetPressingProfileQuery,
  useUpdatePressingProfileMutation,
  useGetDeliveryZonesQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  useReverseGeocodeMutation,
  type DeliveryZone
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import LeafletMap from '../../components/LeafletMap';

// Types pour les coordonnées
type SimpleCoordinates = {
  lat: number;
  lng: number;
};

type GeoJSONCoordinates = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

type Coordinates = SimpleCoordinates | GeoJSONCoordinates;

interface Address {
  street: string;
  city: string;
  district: string;
  postalCode: string;
  details: string;
  coordinates?: SimpleCoordinates;
}



export const LocationPage: React.FC = () => {
  // API Hooks pour récupérer les vraies données
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch } = useGetPressingProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePressingProfileMutation();
  
  // API Hooks pour les zones de livraison
  const { data: zones = [], isLoading: zonesLoading, error: zonesError, refetch: refetchZones } = useGetDeliveryZonesQuery({ activeOnly: false });
  const [createZone, { isLoading: isCreatingZone }] = useCreateDeliveryZoneMutation();
  const [updateZone, { isLoading: isUpdatingZone }] = useUpdateDeliveryZoneMutation();
  const [deleteZone, { isLoading: isDeletingZone }] = useDeleteDeliveryZoneMutation();
  
  // API Hook pour le géocodage inverse
  const [reverseGeocode, { isLoading: isReverseGeocoding }] = useReverseGeocodeMutation();
  
  // États locaux
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState<Address>({
    street: '',
    city: 'Abidjan',
    district: '',
    postalCode: '00225',
    details: ''
  });
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDeliveryFee, setNewZoneDeliveryFee] = useState(1500);
  const [newZoneMinOrder, setNewZoneMinOrder] = useState(5000);
  
  // État pour la carte - initialisé avec les coordonnées par défaut d'Abidjan
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 5.3599517, lng: -3.9665738 });
  
  // Coordonnées par défaut d'Abidjan
  const defaultCoordinates = { lat: 5.3599517, lng: -3.9665738 };

  // État pour la géolocalisation
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Transformer les données du profil en format local
  const address = useMemo(() => {
    if (!profileData?.address) {
      return {
        street: '',
        city: 'Abidjan',
        district: '',
        postalCode: '00225',
        details: ''
      };
    }
    
    return {
      street: profileData.address.street || '',
      city: profileData.address.city || 'Abidjan',
      district: profileData.address.district || '',
      postalCode: profileData.address.postalCode || '00225',
      details: '' // Le backend n'a pas de champ details, on peut l'ajouter plus tard
    };
  }, [profileData]);



  // Initialiser tempAddress quand les données sont chargées
  React.useEffect(() => {
    if (profileData?.address && !isEditingAddress) {
      setTempAddress(address);
    }
  }, [profileData, address, isEditingAddress]);
  
  // Mettre à jour le centre de la carte depuis le profil
  React.useEffect(() => {
    if (profileData?.address?.coordinates) {
      const coords = profileData.address.coordinates as Coordinates;
      
      // Gérer le format GeoJSON {type: 'Point', coordinates: [lng, lat]}
      if ('type' in coords && coords.type === 'Point' && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
        const [lng, lat] = coords.coordinates;
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          console.log('🗺️ Coordonnées profil GeoJSON valides:', { lat, lng });
          setMapCenter({ lat, lng });
        } else {
          console.warn('⚠️ Coordonnées GeoJSON invalides:', coords);
          setMapCenter(defaultCoordinates);
        }
      }
      // Gérer le format simple {lat, lng}
      else if ('lat' in coords && 'lng' in coords && 
               typeof coords.lat === 'number' && typeof coords.lng === 'number' && 
               !isNaN(coords.lat) && !isNaN(coords.lng)) {
        console.log('🗺️ Coordonnées profil simples valides:', coords);
        setMapCenter({
          lat: coords.lat,
          lng: coords.lng
        });
      } else {
        console.warn('⚠️ Coordonnées profil format inconnu:', coords);
        setMapCenter(defaultCoordinates);
      }
    } else {
      console.log('🗺️ Aucune coordonnée profil, utilisation des coordonnées par défaut');
      setMapCenter(defaultCoordinates);
    }
  }, [profileData?.address?.coordinates]);

  // S'assurer que mapCenter est toujours valide
  React.useEffect(() => {
    if (!mapCenter || typeof mapCenter.lat !== 'number' || typeof mapCenter.lng !== 'number') {
      console.warn('mapCenter invalide, réinitialisation:', mapCenter);
      setMapCenter({ lat: 5.3599517, lng: -3.9665738 });
    }
  }, [mapCenter]);

  const handleSaveAddress = async () => {
    // Validation plus souple : au moins un champ d'adresse ou des coordonnées GPS
    const hasAddressInfo = tempAddress.street.trim() || tempAddress.district.trim();
    const hasCoordinates = tempAddress.coordinates?.lat && tempAddress.coordinates?.lng;
    
    if (!hasAddressInfo && !hasCoordinates) {
      toast.error('Veuillez remplir au moins une information d\'adresse ou détecter votre position GPS');
      return;
    }

    try {
      console.log('💾 Sauvegarde adresse:', tempAddress);
      
      const addressData = {
        address: {
          street: tempAddress.street.trim(),
          city: tempAddress.city.trim(),
          district: tempAddress.district.trim(),
          postalCode: tempAddress.postalCode.trim(),
          country: 'Côte d\'Ivoire',
          coordinates: {
            lat: tempAddress.coordinates?.lat || mapCenter?.lat || 5.3599517,
            lng: tempAddress.coordinates?.lng || mapCenter?.lng || -3.9665738
          }
        }
      };
      
      console.log('📤 Données envoyées:', addressData);
      
      await updateProfile(addressData).unwrap();
      
      toast.success('✅ Adresse sauvegardée avec succès!');
      setIsEditingAddress(false);
      refetch();
      
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error.status === 401) {
        errorMessage = 'Session expirée. Reconnectez-vous.';
      } else if (error.status === 400) {
        errorMessage = 'Données invalides. Vérifiez les informations.';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleAddZone = async () => {
    if (!newZoneName.trim()) {
      toast.error('Veuillez saisir le nom de la zone');
      return;
    }
    
    // Vérifier si la zone existe déjà
    if (zones.some(zone => zone.name.toLowerCase() === newZoneName.trim().toLowerCase())) {
      toast.error('Cette zone existe déjà');
      return;
    }

    try {
      await createZone({
        name: newZoneName.trim(),
        deliveryFee: newZoneDeliveryFee,
        minOrder: newZoneMinOrder,
        estimatedDeliveryTime: 45
      }).unwrap();
      
      // Réinitialiser le formulaire
      setNewZoneName('');
      setNewZoneDeliveryFee(1500);
      setNewZoneMinOrder(5000);
      
      toast.success('🎉 Zone ajoutée avec succès!');
      refetchZones(); // Recharger la liste des zones
      
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la zone:', error);
      const errorMessage = error?.data?.message || 'Erreur lors de l\'ajout de la zone';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteZone = async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;
    
    if (window.confirm(`Supprimer la zone "${zone.name}" ?\nCette action est irréversible.`)) {
      try {
        await deleteZone(id).unwrap();
        toast.success(`🗑️ Zone "${zone.name}" supprimée avec succès!`);
        refetchZones(); // Recharger la liste des zones
        
      } catch (error: any) {
        console.error('Erreur suppression zone:', error);
        const errorMessage = error?.data?.message || 'Erreur lors de la suppression de la zone';
        toast.error(`❌ ${errorMessage}`);
      }
    }
  };

  const handleMapLocationChange = async (location: { lat: number; lng: number; address?: string }) => {
    console.log('📍 Nouvelle position sur la carte:', location);
    
    // Mettre à jour le centre de la carte
    setMapCenter({ lat: location.lat, lng: location.lng });
    
    // Optionnel: Mettre à jour automatiquement l'adresse du profil
    if (location.address) {
      // Extraire les composants de l'adresse si possible
      const addressParts = location.address.split(',');
      const street = addressParts[0]?.trim() || '';
      const district = addressParts[1]?.trim() || '';
      
      if (street && district) {
        setTempAddress(prev => ({
          ...prev,
          street,
          district
        }));
        
        toast.success('📍 Position mise à jour! Vous pouvez modifier l\'adresse si nécessaire.');
      }
    }
  };

  const handleGetCurrentLocation = async () => {
    console.log('🎯 Début de la géolocalisation...');
    
    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non supportée');
      toast.error('📍 Géolocalisation non supportée par votre navigateur');
      return;
    }

    console.log('✅ Géolocalisation supportée, démarrage...');
    setIsGeolocating(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('🗺️ Position obtenue:', { latitude, longitude });
      
      // Mettre à jour la position sur la carte
      setMapCenter({ lat: latitude, lng: longitude });
      console.log('🗺️ MapCenter mis à jour:', { lat: latitude, lng: longitude });
      
      // Géocodage inverse via RTK Query
      try {
        console.log('🌍 Appel API géocodage inverse...', { lat: latitude, lng: longitude });
        
        const geocodeResult = await reverseGeocode({ lat: latitude, lng: longitude }).unwrap();
        
        console.log('🌍 Réponse API géocodage:', geocodeResult);
        
        if (geocodeResult.success && geocodeResult.data) {
          const addressData = geocodeResult.data;
          
          console.log('🌍 Données géocodage reçues:', addressData);
          
          // Mapping intelligent pour la Côte d'Ivoire
          const street = addressData.street || addressData.displayName || '';
          const district = addressData.district || addressData.city || ''; // district peut être dans city
          const city = addressData.country === 'Côte d\'Ivoire' ? 'Abidjan' : (addressData.city || 'Abidjan');
          const postalCode = addressData.postalCode || '00225';
          
          // Mettre à jour le formulaire d'adresse
          setTempAddress(prev => ({
            ...prev,
            street: street,
            district: district,
            city: city,
            postalCode: postalCode,
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          }));
          
          console.log('📝 Adresse mise à jour:', {
            street,
            district,
            city,
            postalCode
          });
          
          toast.success(`📍 Position détectée avec succès!\n${addressData.displayName}`);
          
          // Activer le mode édition pour que l'utilisateur voie les changements
          setIsEditingAddress(true);
        } else {
          // Même si le géocodage échoue, sauvegarder les coordonnées
          setTempAddress(prev => ({
            ...prev,
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          }));
          toast.success('📍 Position détectée! Veuillez compléter l\'adresse manuellement.');
        }
      } catch (error: any) {
        console.error('Erreur API géocodage:', error);
        
        // Gestion des erreurs spécifiques
        if (error.status === 404) {
          console.error('❌ Backend non disponible - Route /api/v1/pressing/reverse-geocode non trouvée');
          toast.error('❌ Backend non disponible. Veuillez démarrer le serveur backend.');
        } else if (error.status === 401) {
          console.error('❌ Token d\'authentification invalide ou expiré');
          toast.error('❌ Session expirée. Veuillez vous reconnecter.');
        } else {
          toast.error('❌ Erreur lors du géocodage. Coordonnées GPS sauvegardées.');
        }
        
        // Même si le géocodage échoue, sauvegarder les coordonnées
        setTempAddress(prev => ({
          ...prev,
          coordinates: {
            lat: latitude,
            lng: longitude
          }
        }));
        toast.success('📍 Position détectée! Coordonnées GPS sauvegardées.');
        
        // Activer le mode édition pour que l'utilisateur puisse compléter l'adresse
        setIsEditingAddress(true);
      }
      
    } catch (error: any) {
      console.error('Erreur géolocalisation:', error);
      
      let errorMessage = '📍 Impossible de détecter votre position';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '🚫 Accès à la géolocalisation refusé. Veuillez autoriser l\'accès dans votre navigateur.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '📍 Position non disponible. Vérifiez votre connexion et vos paramètres de localisation.';
          break;
        case error.TIMEOUT:
          errorMessage = '⏱️ Délai d\'attente dépassé. Veuillez réessayer.';
          break;
        default:
          errorMessage = `📍 Erreur de géolocalisation: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGeolocating(false);
    }
  };

  // États de chargement et d'erreur
  const isLoading = profileLoading || zonesLoading;
  const hasError = profileError || zonesError;

  // Gestion des états de chargement - UI/UX 2025
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          
          {/* Header Skeleton */}
          <header className="mb-6 sm:mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </header>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Colonne gauche */}
            <div className="space-y-4 sm:space-y-6">
              {/* Adresse Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                </div>
              </div>
              
              {/* Zones Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Carte Skeleton */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-64 sm:h-80 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button onClick={() => window.history.back()} className="p-2 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <MapPin className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Localisation & Zones</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-red-600 mb-4">
              Impossible de charger vos informations de localisation. Veuillez réessayer.
            </p>
            <button
              onClick={() => {
                refetch();
                refetchZones();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 text-gray-500 hover:text-gray-700 touch-target"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900">Localisation</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Colonne de gauche : Adresse et Zones - Mobile Optimized */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {/* Adresse du Pressing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Adresse Principale</h3>
              <button 
                onClick={() => {
                  setIsEditingAddress(!isEditingAddress);
                  setTempAddress(address);
                }}
                className="flex items-center gap-1 sm:gap-2 text-sm text-blue-600 hover:text-blue-800 touch-target"
              >
                {isEditingAddress ? <XCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span className="hidden sm:inline">{isEditingAddress ? 'Annuler' : 'Modifier'}</span>
                <span className="sm:hidden">{isEditingAddress ? 'Annuler' : 'Edit'}</span>
              </button>
            </div>
            {isEditingAddress ? (
              <div className="space-y-4">
                <input type="text" placeholder="Rue" value={tempAddress.street} onChange={e => setTempAddress({...tempAddress, street: e.target.value})} className="w-full border-gray-300 rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Ville" value={tempAddress.city} onChange={e => setTempAddress({...tempAddress, city: e.target.value})} className="w-full border-gray-300 rounded-md" />
                  <input type="text" placeholder="Quartier" value={tempAddress.district} onChange={e => setTempAddress({...tempAddress, district: e.target.value})} className="w-full border-gray-300 rounded-md" />
                </div>
                <input type="text" placeholder="Détails (étage, etc.)" value={tempAddress.details} onChange={e => setTempAddress({...tempAddress, details: e.target.value})} className="w-full border-gray-300 rounded-md" />
                
                {/* Bouton de géolocalisation */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isGeolocating}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    title="Détecter automatiquement ma position actuelle"
                  >
                    {isGeolocating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Détection en cours...</span>
                      </>
                    ) : (
                      <>
                        📍 <span>Détecter ma position</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Indicateur de coordonnées GPS */}
                {tempAddress.coordinates && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">🗺️ Position GPS détectée</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {tempAddress.coordinates.lat.toFixed(6)}, {tempAddress.coordinates.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveAddress} 
                  disabled={isUpdating} 
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Sauvegarder l'adresse</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-gray-700">
                <p>{address.street}, {address.district}</p>
                <p>{address.city}, {address.postalCode}</p>
                <p className="text-sm text-gray-500 mt-1">{address.details}</p>
              </div>
            )}
          </div>

          {/* Zones de livraison */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zones de Livraison Desservies</h3>
            {zones.length > 0 ? (
              <div className="space-y-3 mb-6">
                {zones.map(zone => (
                  <div key={zone.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Truck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{zone.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-green-600">{zone.deliveryFee.toLocaleString()}</span>
                              <span>FCFA de livraison</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Commande min:</span>
                              <span className="font-medium text-blue-600">{zone.minOrder.toLocaleString()}</span>
                              <span>FCFA</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteZone(zone.id)} 
                        disabled={isDeletingZone}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Supprimer la zone ${zone.name}`}
                      >
                        {isDeletingZone ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <div className="text-gray-400 text-5xl mb-3">🚚</div>
                <h4 className="font-medium text-gray-900 mb-2">Aucune zone de livraison</h4>
                <p className="text-sm text-gray-600">
                  Ajoutez des zones de livraison pour étendre votre service aux clients de différents quartiers.
                </p>
              </div>
            )}
            {/* Formulaire d'ajout de zone */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">➕ Ajouter une nouvelle zone</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  placeholder="Nom du quartier (ex: Treichville)" 
                  className="border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onKeyPress={e => e.key === 'Enter' && handleAddZone()}
                />
                
                <div className="relative">
                  <input 
                    type="number" 
                    value={newZoneDeliveryFee}
                    onChange={e => setNewZoneDeliveryFee(Number(e.target.value))}
                    placeholder="Frais de livraison" 
                    min="0"
                    step="100"
                    className="border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">FCFA</span>
                </div>
                
                <div className="relative">
                  <input 
                    type="number" 
                    value={newZoneMinOrder}
                    onChange={e => setNewZoneMinOrder(Number(e.target.value))}
                    placeholder="Commande minimum" 
                    min="0"
                    step="500"
                    className="border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              
              <button 
                onClick={handleAddZone} 
                disabled={isCreatingZone || !newZoneName.trim()} 
                className="w-full flex justify-center items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingZone ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Ajout...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Ajouter la zone</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Colonne de droite : Carte et Aide */}
        <div className="space-y-8">
          {/* Carte */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Votre Emplacement sur la Carte</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>
                  {mapCenter?.lat?.toFixed(6) || '5.359952'}, {mapCenter?.lng?.toFixed(6) || '-3.966574'}
                </span>
              </div>
            </div>
            
            {/* Carte interactive avec Leaflet */}
            <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200">
              <LeafletMap
                center={mapCenter || { lat: 5.3599517, lng: -3.9665738 }}
                zoom={13}
                height="300px"
                draggableMarker={isEditingAddress}
                onLocationChange={(location) => {
                  if (isEditingAddress) {
                    setMapCenter({ lat: location.lat, lng: location.lng });
                    setTempAddress(prev => ({
                      ...prev,
                      coordinates: {
                        lat: location.lat,
                        lng: location.lng
                      }
                    }));
                  }
                }}
                markers={[
                  // Marqueur principal du pressing
                  {
                    lat: mapCenter?.lat || 5.3599517,
                    lng: mapCenter?.lng || -3.9665738,
                    title: 'Votre Pressing',
                    info: `${address.street}, ${address.district}, ${address.city}`
                  },
                  // Marqueurs des zones de livraison (positions approximatives)
                  ...zones.map((zone, index) => {
                    const offsets = [
                      { lat: 0.01, lng: 0.01 },
                      { lat: -0.01, lng: 0.01 },
                      { lat: 0.01, lng: -0.01 },
                      { lat: -0.01, lng: -0.01 },
                      { lat: 0.005, lng: 0.015 }
                    ];
                    const offset = offsets[index % offsets.length];
                    
                    return {
                      lat: (mapCenter?.lat || 5.3599517) + offset.lat,
                      lng: (mapCenter?.lng || -3.9665738) + offset.lng,
                      title: zone.name,
                      info: `Livraison: ${zone.deliveryFee.toLocaleString()} FCFA\nMin: ${zone.minOrder.toLocaleString()} FCFA`
                    };
                  })
                ]}
                className="w-full h-full"
              />
            </div>
            
            {/* Informations de la carte */}
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Abidjan, Côte d'Ivoire</span>
                </div>
                <div className="text-gray-500">
                  {mapCenter?.lat && mapCenter?.lng ? 
                    `${mapCenter.lat.toFixed(4)}°N, ${Math.abs(mapCenter.lng).toFixed(4)}°W` : 
                    'Coordonnées par défaut'
                  }
                </div>
              </div>
            </div>
            
            {isEditingAddress && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      📍 Mode édition activé
                    </p>
                    <p className="text-blue-700">
                      Déplacez le marqueur vert pour ajuster votre position exacte. 
                      L'adresse sera automatiquement mise à jour.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Comment ça marche ?</h3>
            <div className="text-sm text-blue-800 space-y-3">
              <div>
                <p className="font-medium mb-1">🏠 Adresse Principale</p>
                <p>C'est ici que les clients déposeront ou récupéreront leurs vêtements. Assurez-vous qu'elle soit complète et précise.</p>
              </div>
              
              <div>
                <p className="font-medium mb-1">🚚 Zones de Livraison</p>
                <p>Définissez les quartiers où vous livrez avec :</p>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                  <li><strong>Frais de livraison</strong> : Coût du transport</li>
                  <li><strong>Commande minimum</strong> : Montant minimum pour livrer</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-1">🗺️ Carte de Localisation</p>
                <p>Votre position aide les clients à vous localiser. La carte affiche votre pressing (marqueur vert) et vos zones de livraison (marqueurs bleus). Survolez les zones pour voir les détails.</p>
              </div>
              
              <div>
                <p className="font-medium mb-1">📍 Géolocalisation Automatique</p>
                <p>Utilisez le bouton "Détecter ma position" pour localiser automatiquement votre pressing. Votre navigateur vous demandera l'autorisation d'accéder à votre position GPS.</p>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-xs">
                  <li>Activez la localisation dans votre navigateur</li>
                  <li>L'adresse sera automatiquement remplie</li>
                  <li>La carte sera centrée sur votre position exacte</li>
                </ul>
              </div>
              
              <div className="bg-blue-100 p-3 rounded-md mt-4">
                <p className="font-medium text-blue-900 mb-1">✨ Conseil Pro</p>
                <p className="text-blue-700">Des frais de livraison compétitifs et des zones bien définies augmentent vos commandes en ligne !</p>
              </div>
            </div>
          </div>
          
          {/* Statistiques des zones */}
          {zones.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">📈 Vos Zones en Chiffres</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{zones.length}</p>
                  <p className="text-green-700">Zone{zones.length > 1 ? 's' : ''} active{zones.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(zones.reduce((sum, zone) => sum + zone.deliveryFee, 0) / zones.length).toLocaleString()}
                  </p>
                  <p className="text-green-700">FCFA moyen</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-xs text-green-600">
                  📝 Zone la moins chère : <strong>{Math.min(...zones.map(z => z.deliveryFee)).toLocaleString()} FCFA</strong> • 
                  Zone la plus chère : <strong>{Math.max(...zones.map(z => z.deliveryFee)).toLocaleString()} FCFA</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
