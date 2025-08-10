import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Target, Check, X, Crosshair, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ManualLocationSelectorProps {
  initialPosition?: {
    lat: number;
    lng: number;
  };
  onLocationSelected: (location: {
    lat: number;
    lng: number;
    address: string;
    district: string;
  }) => void;
  onCancel: () => void;
  isOpen: boolean;
  className?: string;
}

// Quartiers d'Abidjan avec leurs limites géographiques
const ABIDJAN_DISTRICTS = [
  { name: 'Yopougon', bounds: { north: 5.36, south: 5.32, east: -4.08, west: -4.12 } },
  { name: 'Cocody', bounds: { north: 5.38, south: 5.35, east: -3.98, west: -4.02 } },
  { name: 'Plateau', bounds: { north: 5.33, south: 5.31, east: -4.02, west: -4.04 } },
  { name: 'Adjamé', bounds: { north: 5.36, south: 5.34, east: -4.02, west: -4.06 } },
  { name: 'Treichville', bounds: { north: 5.30, south: 5.29, east: -4.02, west: -4.03 } },
  { name: 'Marcory', bounds: { north: 5.30, south: 5.29, east: -3.99, west: -4.00 } },
  { name: 'Koumassi', bounds: { north: 5.29, south: 5.27, east: -3.94, west: -3.97 } },
  { name: 'Port-Bouët', bounds: { north: 5.27, south: 5.23, east: -3.92, west: -3.96 } },
  { name: 'Abobo', bounds: { north: 5.42, south: 5.38, east: -4.00, west: -4.05 } },
  { name: 'Attécoubé', bounds: { north: 5.35, south: 5.33, east: -4.05, west: -4.08 } }
];

// Centre d'Abidjan par défaut
const ABIDJAN_CENTER = { lat: 5.3364, lng: -4.0267 };

const ManualLocationSelector: React.FC<ManualLocationSelectorProps> = ({
  initialPosition = ABIDJAN_CENTER,
  onLocationSelected,
  onCancel,
  isOpen,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Valider et corriger les coordonnées initiales
  const getValidPosition = (position: { lat: number; lng: number }) => {
    const isValidLat = typeof position?.lat === 'number' && !isNaN(position.lat) && position.lat >= -90 && position.lat <= 90;
    const isValidLng = typeof position?.lng === 'number' && !isNaN(position.lng) && position.lng >= -180 && position.lng <= 180;
    
    if (isValidLat && isValidLng) {
      return position;
    }
    
    // Coordonnées par défaut pour Abidjan centre
    return { lat: 5.3600, lng: -4.0083 };
  };
  
  const [selectedPosition, setSelectedPosition] = useState(getValidPosition(initialPosition));
  const [detectedDistrict, setDetectedDistrict] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Token Mapbox
  const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  // Fonction pour détecter le quartier à partir des coordonnées
  const detectDistrict = (lat: number, lng: number): string => {
    for (const district of ABIDJAN_DISTRICTS) {
      const { bounds } = district;
      if (lat >= bounds.south && lat <= bounds.north && 
          lng >= bounds.west && lng <= bounds.east) {
        return district.name;
      }
    }
    return 'Autre quartier d\'Abidjan';
  };

  // Fonction pour obtenir l'adresse via géocodage inverse Mapbox
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&country=CI`
      );
      
      if (!response.ok) throw new Error('Erreur géocodage');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.warn('Erreur géocodage inverse:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!isOpen || !mapRef.current || !MAPBOX_ACCESS_TOKEN || isMapLoaded) return;

    // Charger Mapbox GL JS si pas déjà chargé
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.async = true;
      
      const cssLink = document.createElement('link');
      cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      cssLink.rel = 'stylesheet';
      
      document.head.appendChild(cssLink);
      document.head.appendChild(script);
      
      script.onload = () => initializeMap();
      return;
    }
    
    initializeMap();
  }, [isOpen, MAPBOX_ACCESS_TOKEN]);

  const initializeMap = () => {
    if (!mapRef.current || !window.mapboxgl) return;

    try {
      // Nettoyer le conteneur
      mapRef.current.innerHTML = '';
      
      // Configurer le token
      window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      // Créer la carte
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [selectedPosition.lng, selectedPosition.lat],
        zoom: 14,
        language: 'fr'
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        setIsMapLoaded(true);
        
        // Créer le marqueur draggable
        const marker = new window.mapboxgl.Marker({
          draggable: true,
          color: '#3B82F6'
        })
        .setLngLat([selectedPosition.lng, selectedPosition.lat])
        .addTo(map);

        markerRef.current = marker;

        // Écouter les déplacements du marqueur
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const newPosition = { lat: lngLat.lat, lng: lngLat.lng };
          setSelectedPosition(newPosition);
          
          // Détecter le quartier
          const district = detectDistrict(newPosition.lat, newPosition.lng);
          setDetectedDistrict(district);
        });

        // Détecter le quartier initial
        const initialDistrict = detectDistrict(selectedPosition.lat, selectedPosition.lng);
        setDetectedDistrict(initialDistrict);
      });

      // Écouter les clics sur la carte
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        const newPosition = { lat, lng };
        
        setSelectedPosition(newPosition);
        
        // Déplacer le marqueur
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
        
        // Détecter le quartier
        const district = detectDistrict(lat, lng);
        setDetectedDistrict(district);
      });

    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      toast.error('Erreur lors du chargement de la carte');
    }
  };

  // Confirmer la sélection
  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      // Obtenir l'adresse complète
      const address = await getAddressFromCoordinates(selectedPosition.lat, selectedPosition.lng);
      
      // Appeler le callback avec les données
      onLocationSelected({
        lat: selectedPosition.lat,
        lng: selectedPosition.lng,
        address,
        district: detectedDistrict
      });
      
      toast.success(`📍 Position confirmée : ${detectedDistrict}`, {
        duration: 3000
      });
      
    } catch (error) {
      console.error('Erreur confirmation position:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setIsConfirming(false);
    }
  };

  // Nettoyer la carte à la fermeture
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Choisir la position de votre pressing
                </h2>
                <p className="text-sm text-gray-600">
                  Cliquez sur la carte ou déplacez le marqueur pour définir votre adresse
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Carte */}
        <div className="relative h-96">
          <div
            ref={mapRef}
            className="w-full h-full"
          />
          
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Chargement de la carte...</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isMapLoaded && (
            <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
              <div className="flex items-start gap-2">
                <Crosshair className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-700">
                  <p className="font-medium mb-1">Instructions :</p>
                  <p>• Cliquez sur la carte pour placer le marqueur</p>
                  <p>• Ou déplacez le marqueur bleu directement</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations de position */}
        {isMapLoaded && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Coordonnées</span>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Quartier détecté</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {detectedDistrict || 'Détection en cours...'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmer cette position
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualLocationSelector;
