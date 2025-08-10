import React, { useState, useEffect } from 'react';
import { MapPin, Target, Edit, Check, AlertCircle, Navigation2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ManualLocationSelector from '../geolocation/ManualLocationSelector';

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

interface AddressLocationManagerProps {
  address: AddressData;
  onAddressChange: (address: AddressData) => void;
  isLoading?: boolean;
  className?: string;
}

const AddressLocationManager: React.FC<AddressLocationManagerProps> = ({
  address,
  onAddressChange,
  isLoading = false,
  className = ''
}) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [hasValidCoordinates, setHasValidCoordinates] = useState(false);

  // Vérifier si les coordonnées sont valides (dans la zone d'Abidjan)
  useEffect(() => {
    const { lat, lng } = address.coordinates;
    const isValid = lat >= 5.2 && lat <= 5.5 && lng >= -4.2 && lng <= -3.8;
    setHasValidCoordinates(isValid);
  }, [address.coordinates]);

  // Gérer les changements de champs d'adresse
  const handleFieldChange = (field: keyof AddressData, value: string) => {
    onAddressChange({
      ...address,
      [field]: value
    });
  };

  // Gérer la sélection de position sur la carte
  const handleLocationSelected = (location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
  }) => {
    // Mettre à jour les coordonnées et le quartier
    const updatedAddress: AddressData = {
      ...address,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      district: location.district,
      // Optionnel : mettre à jour l'adresse complète si elle n'est pas déjà renseignée
      street: address.street || location.address
    };

    onAddressChange(updatedAddress);
    setShowLocationSelector(false);
    
    toast.success(`📍 Position mise à jour : ${location.district}`, {
      duration: 4000,
      icon: '🎯'
    });
  };

  // Obtenir le statut de la position
  const getPositionStatus = () => {
    if (!hasValidCoordinates) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertCircle,
        text: 'Position non définie',
        description: 'Cliquez pour définir votre position sur la carte'
      };
    }
    
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Check,
      text: 'Position définie',
      description: `${address.coordinates.lat.toFixed(4)}, ${address.coordinates.lng.toFixed(4)}`
    };
  };

  const positionStatus = getPositionStatus();
  const StatusIcon = positionStatus.icon;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Section Adresse */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Adresse du pressing
          </h3>
          
          {/* Adresse principale */}
          <div className="space-y-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <input
                id="street"
                type="text"
                value={address.street}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                placeholder="Ex: 123 Boulevard de la République"
                required
                className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-describedby="street-help"
              />
              <p id="street-help" className="mt-1 text-sm text-gray-500">
                Numéro et nom de rue, avenue ou boulevard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                  Quartier *
                </label>
                <input
                  id="district"
                  type="text"
                  value={address.district}
                  onChange={(e) => handleFieldChange('district', e.target.value)}
                  placeholder="Ex: Cocody, Yopougon..."
                  required
                  className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  id="city"
                  type="text"
                  value={address.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="Abidjan"
                  required
                  className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  placeholder="Ex: 00225"
                  className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Pays *
                </label>
                <input
                  id="country"
                  type="text"
                  value={address.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  placeholder="Côte d'Ivoire"
                  required
                  className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Position GPS */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Position GPS
          </h3>
          
          {/* Statut de la position */}
          <div className={`p-4 rounded-xl border ${positionStatus.bgColor} ${positionStatus.borderColor} mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-5 h-5 ${positionStatus.color}`} />
                <div>
                  <p className={`font-medium ${positionStatus.color}`}>
                    {positionStatus.text}
                  </p>
                  <p className="text-sm text-gray-600">
                    {positionStatus.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowLocationSelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Navigation2 className="w-4 h-4" />
                {hasValidCoordinates ? 'Modifier' : 'Définir'}
              </button>
            </div>
          </div>

          {/* Coordonnées actuelles */}
          {hasValidCoordinates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <p className="text-sm font-mono text-gray-900">
                  {address.coordinates.lat.toFixed(6)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <p className="text-sm font-mono text-gray-900">
                  {address.coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Message d'aide */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Pourquoi définir votre position GPS ?</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Permet aux clients de vous trouver facilement</li>
                  <li>• Améliore votre visibilité dans les recherches locales</li>
                  <li>• Calcul précis des distances et temps de trajet</li>
                  <li>• Affichage correct sur la carte des pressings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection de position */}
      <ManualLocationSelector
        isOpen={showLocationSelector}
        initialPosition={address.coordinates}
        onLocationSelected={handleLocationSelected}
        onCancel={() => setShowLocationSelector(false)}
      />
    </>
  );
};

export default AddressLocationManager;
