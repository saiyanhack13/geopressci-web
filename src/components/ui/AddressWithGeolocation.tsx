import React, { useState } from 'react';
import { useField, useFormikContext } from 'formik';
import FormField from './FormField';
import SubmitButton from './SubmitButton';

interface AddressWithGeolocationProps {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  coordinatesFieldName?: string;
  showCoordinates?: boolean;
}

// Quartiers populaires d'Abidjan avec leurs coordonnées approximatives
const ABIDJAN_DISTRICTS = [
  { 
    name: 'Cocody', 
    emoji: '🏢', 
    description: 'Zone résidentielle haut standing',
    bounds: { lat: [5.35, 5.38], lng: [-4.02, -3.98] }
  },
  { 
    name: 'Plateau', 
    emoji: '🏛️', 
    description: 'Centre des affaires',
    bounds: { lat: [5.31, 5.33], lng: [-4.04, -4.02] }
  },
  { 
    name: 'Yopougon', 
    emoji: '🏘️', 
    description: 'Commune populaire',
    bounds: { lat: [5.32, 5.36], lng: [-4.12, -4.08] }
  },
  { 
    name: 'Adjamé', 
    emoji: '🛒', 
    description: 'Centre commercial',
    bounds: { lat: [5.34, 5.36], lng: [-4.05, -4.03] }
  },
  { 
    name: 'Treichville', 
    emoji: '🌊', 
    description: 'Zone portuaire',
    bounds: { lat: [5.28, 5.31], lng: [-4.04, -4.01] }
  },
  { 
    name: 'Marcory', 
    emoji: '🏭', 
    description: 'Zone industrielle',
    bounds: { lat: [5.28, 5.31], lng: [-4.01, -3.98] }
  },
  { 
    name: 'Koumassi', 
    emoji: '🏠', 
    description: 'Zone résidentielle',
    bounds: { lat: [5.29, 5.32], lng: [-3.98, -3.95] }
  },
  { 
    name: 'Port-Bouët', 
    emoji: '✈️', 
    description: 'Près de l\'aéroport',
    bounds: { lat: [5.23, 5.27], lng: [-3.98, -3.94] }
  },
  { 
    name: 'Attécoubé', 
    emoji: '🌳', 
    description: 'Zone verte',
    bounds: { lat: [5.33, 5.36], lng: [-4.08, -4.05] }
  },
  { 
    name: 'Abobo', 
    emoji: '👥', 
    description: 'Commune populaire',
    bounds: { lat: [5.40, 5.44], lng: [-4.05, -4.01] }
  },
  { 
    name: 'Bingerville', 
    emoji: '🎓', 
    description: 'Ville universitaire',
    bounds: { lat: [5.35, 5.38], lng: [-3.95, -3.91] }
  },
  { 
    name: 'Anyama', 
    emoji: '🌿', 
    description: 'Périphérie nord',
    bounds: { lat: [5.48, 5.52], lng: [-4.08, -4.04] }
  },
  { 
    name: 'Songon', 
    emoji: '🏞️', 
    description: 'Zone rurale',
    bounds: { lat: [5.25, 5.29], lng: [-4.15, -4.11] }
  },
];

// Fonction pour déterminer le quartier basé sur les coordonnées
const getDistrictFromCoordinates = (lat: number, lng: number): string | null => {
  for (const district of ABIDJAN_DISTRICTS) {
    const { bounds } = district;
    if (
      lat >= bounds.lat[0] && lat <= bounds.lat[1] &&
      lng >= bounds.lng[0] && lng <= bounds.lng[1]
    ) {
      return district.name;
    }
  }
  return null;
};

const AddressWithGeolocation: React.FC<AddressWithGeolocationProps> = ({ 
  name, 
  label,
  required = false,
  helpText,
  coordinatesFieldName,
  showCoordinates = false
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext<any>();
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDistricts, setShowDistricts] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [currentCoordinates, setCurrentCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('📍 La géolocalisation n\'est pas disponible sur votre appareil.');
      return;
    }

    setIsFetching(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Enregistrer les coordonnées exactes
        const exactCoordinates = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        };
        
        setCurrentCoordinates({ lat: latitude, lng: longitude });
        
        // Enregistrer les coordonnées dans le champ dédié si spécifié
        if (coordinatesFieldName) {
          setFieldValue(coordinatesFieldName, exactCoordinates);
        }
        
        try {
          // Vérifier si on est à Abidjan (approximativement)
          const isInAbidjan = latitude >= 5.2 && latitude <= 5.55 && 
                            longitude >= -4.2 && longitude <= -3.9;
          
          if (isInAbidjan) {
            // Déterminer le quartier basé sur les coordonnées
            const detectedDistrict = getDistrictFromCoordinates(latitude, longitude);
            
            if (detectedDistrict) {
              setSelectedDistrict(detectedDistrict);
              // Format d'adresse avec coordonnées précises pour les pressings
              const preciseAddress = `${detectedDistrict}, Abidjan, Côte d'Ivoire`;
              setFieldValue(name, preciseAddress);
              setError(null);
              
              // Message de confirmation avec précision
              if (accuracy <= 10) {
                setError(`✅ Position exacte détectée avec ${Math.round(accuracy)}m de précision`);
              } else if (accuracy <= 50) {
                setError(`✅ Position détectée avec ${Math.round(accuracy)}m de précision`);
              } else {
                setError(`⚠️ Position détectée mais précision limitée (${Math.round(accuracy)}m). Essayez de vous rapprocher d'une fenêtre.`);
              }
            } else {
              // Si le quartier n'est pas détecté précisément, mais on garde les coordonnées exactes
              setError('📍 Coordonnées GPS enregistrées. Veuillez sélectionner manuellement votre quartier pour compléter l\'adresse.');
              setShowDistricts(true);
              setFieldValue(name, `Abidjan, Côte d'Ivoire`);
            }
          } else {
            setError('📍 Vous semblez être en dehors d\'Abidjan. Les coordonnées sont enregistrées mais veuillez vérifier votre localisation.');
            setShowDistricts(true);
          }
        } catch (err) {
          setError('🌐 Coordonnées GPS enregistrées. Erreur lors de la détection du quartier.');
          console.error(err);
          setShowDistricts(true);
        } finally {
          setIsFetching(false);
        }
      },
      (err) => {
        setError(`📍 ${err.message}`);
        setIsFetching(false);
        setShowDistricts(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Augmenté pour plus de précision
        maximumAge: 0 // Toujours obtenir une position fraîche
      }
    );
  };

  const handleDistrictSelect = (district: typeof ABIDJAN_DISTRICTS[0]) => {
    setSelectedDistrict(district.name);
    setFieldValue(name, `${district.name}, Abidjan, Côte d'Ivoire`);
    setShowDistricts(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Champ d'adresse principal */}
      <FormField 
        label={label} 
        name={name} 
        type="text" 
        icon="📍"
        placeholder="Ex: Cocody, Abidjan"
        helpText={helpText || "Votre adresse à Abidjan"}
        required={required}
      />

      {/* Boutons d'action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SubmitButton
          type="button"
          onClick={handleGeolocate}
          isSubmitting={isFetching}
          text="📍 Ma position"
          loadingText="Localisation..."
          variant="secondary"
          size="sm"
          fullWidth={false}
        />
        
        <SubmitButton
          type="button"
          onClick={() => setShowDistricts(!showDistricts)}
          isSubmitting={false}
          text="🏘️ Choisir quartier"
          variant="secondary"
          size="sm"
          fullWidth={false}
        />
      </div>

      {/* Sélecteur de quartiers */}
      {showDistricts && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <span className="mr-2">🏘️</span>
            Quartiers d'Abidjan
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {ABIDJAN_DISTRICTS.map((district) => (
              <button
                key={district.name}
                type="button"
                onClick={() => handleDistrictSelect(district)}
                className={`
                  p-3 rounded-lg border text-left transition-all duration-200
                  hover:shadow-md transform hover:scale-105
                  ${
                    selectedDistrict === district.name
                      ? 'border-orange-500 bg-orange-100 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span>{district.emoji}</span>
                  <span className="font-medium text-sm">{district.name}</span>
                </div>
                <p className="text-xs text-gray-500">{district.description}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowDistricts(false)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Affichage des coordonnées si demandé */}
      {showCoordinates && currentCoordinates && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center space-x-2 text-gray-700">
            <span>🎯</span>
            <div className="text-sm">
              <p className="font-medium">Coordonnées GPS exactes:</p>
              <p className="text-xs text-gray-600 font-mono">
                Latitude: {currentCoordinates.lat.toFixed(6)}°<br/>
                Longitude: {currentCoordinates.lng.toFixed(6)}°
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className={`border rounded-xl p-3 ${
          error.startsWith('✅') 
            ? 'bg-green-50 border-green-200' 
            : error.startsWith('⚠️')
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center space-x-2 ${
            error.startsWith('✅') 
              ? 'text-green-700' 
              : error.startsWith('⚠️')
              ? 'text-yellow-700'
              : 'text-red-700'
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Indicateur de quartier sélectionné */}
      {selectedDistrict && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex items-center space-x-2 text-green-700">
            <span>✅</span>
            <p className="text-sm">
              Quartier sélectionné: <strong>{selectedDistrict}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-start space-x-2 text-blue-700">
          <span className="mt-0.5">💡</span>
          <div className="text-xs">
            <p className="font-medium mb-1">Conseils:</p>
            <ul className="space-y-1 text-blue-600">
              <li>• Activez la géolocalisation pour une détection automatique</li>
              <li>• Sélectionnez votre quartier dans la liste</li>
              <li>• Ou tapez manuellement votre adresse</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Aide contextuelle pour pressings */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-start space-x-2 text-blue-700">
          <span className="mt-0.5">💡</span>
          <div className="text-xs">
            <p className="font-medium mb-1">Pour les pressings:</p>
            <ul className="space-y-1 text-blue-600">
              <li>• Utilisez "Ma position" depuis votre local commercial</li>
              <li>• Les coordonnées GPS exactes seront enregistrées</li>
              <li>• Cela permet aux clients de vous localiser précisément</li>
              <li>• Assurez-vous d'être à l'intérieur de votre pressing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressWithGeolocation;
