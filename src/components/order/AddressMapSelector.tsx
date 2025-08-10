// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuration des icônes par défaut
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Configuration des icônes par défaut pour les marqueurs
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Quartiers d'Abidjan avec leurs coordonnées
const ABIDJAN_DISTRICTS = [
  { 
    name: 'Cocody', 
    description: 'Zone résidentielle haut standing',
    bounds: { lat: [5.35, 5.38], lng: [-4.02, -3.98] }
  },
  { 
    name: 'Plateau', 
    description: 'Centre des affaires',
    bounds: { lat: [5.31, 5.33], lng: [-4.04, -4.02] }
  },
  { 
    name: 'Yopougon', 
    description: 'Commune populaire',
    bounds: { lat: [5.32, 5.36], lng: [-4.12, -4.08] }
  },
  { 
    name: 'Adjamé', 
    description: 'Centre commercial',
    bounds: { lat: [5.34, 5.36], lng: [-4.05, -4.03] }
  },
  { 
    name: 'Treichville', 
    description: 'Zone portuaire',
    bounds: { lat: [5.28, 5.31], lng: [-4.04, -4.01] }
  },
  { 
    name: 'Marcory', 
    description: 'Zone industrielle',
    bounds: { lat: [5.28, 5.31], lng: [-4.01, -3.98] }
  },
  { 
    name: 'Koumassi', 
    description: 'Zone résidentielle',
    bounds: { lat: [5.29, 5.32], lng: [-3.98, -3.95] }
  },
  { 
    name: 'Port-Bouët', 
    description: 'Près de l\'aéroport',
    bounds: { lat: [5.23, 5.27], lng: [-3.98, -3.94] }
  },
  { 
    name: 'Attécoubé', 
    description: 'Zone verte',
    bounds: { lat: [5.33, 5.36], lng: [-4.08, -4.05] }
  },
  { 
    name: 'Abobo', 
    description: 'Commune populaire',
    bounds: { lat: [5.40, 5.44], lng: [-4.05, -4.01] }
  },
  { 
    name: 'Bingerville', 
    description: 'Ville universitaire',
    bounds: { lat: [5.35, 5.38], lng: [-3.95, -3.91] }
  },
  { 
    name: 'Anyama', 
    description: 'Périphérie nord',
    bounds: { lat: [5.48, 5.52], lng: [-4.08, -4.04] }
  },
  { 
    name: 'Songon', 
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

interface AddressMapSelectorProps {
  onSelect: (position: { lat: number; lng: number; address: string }) => void;
  initialPosition?: [number, number];
  initialAddress?: string;
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const map = useMapEvents({
    click(e: any) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e: any) {
      if (!position) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 16,
      timeout: 10000,
      enableHighAccuracy: true,
    });
  }, [map]);

  // @ts-ignore
  return position === null ? null : (
    <Marker position={position} icon={defaultIcon}>
      <Popup>Votre adresse de collecte</Popup>
    </Marker>
  );
};

const AddressMapSelector: React.FC<AddressMapSelectorProps> = ({
  onSelect,
  initialPosition,
  initialAddress = '',
}) => {
  // S'assurer que initialAddress est toujours une chaîne
  const safeInitialAddress = typeof initialAddress === 'string' ? initialAddress : '';
  const [address, setAddress] = useState<string>(safeInitialAddress);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>(safeInitialAddress);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true for geolocation
  const mapRef = useRef<any>(null);
  const geolocationWatchId = useRef<number | null>(null);

  // Use a separate effect to handle map initialization
  // Get user's current location on component mount
  useEffect(() => {
    setIsLoading(true);

    // Default to Abidjan coordinates if geolocation is not available
    const defaultPosition: [number, number] = [5.320357, -4.016107];

    if ('geolocation' in navigator) {
      // Try to get current position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          setPosition(userPosition);
          
          // Utiliser la même logique de détection que handlePositionChange
          const isInAbidjan = lat >= 5.2 && lat <= 5.55 && lng >= -4.2 && lng <= -3.9;
          
          if (isInAbidjan) {
            const detectedDistrict = getDistrictFromCoordinates(lat, lng);
            
            if (detectedDistrict) {
              const detectedAddress = `${detectedDistrict}, Abidjan, Côte d'Ivoire`;
              setCurrentAddress(detectedAddress);
              onSelect({
                lat: userPosition[0],
                lng: userPosition[1],
                address: detectedAddress
              });
              console.log(`🏠 Position initiale détectée: ${detectedDistrict}`);
            } else {
              const generalAddress = `Abidjan, Côte d'Ivoire`;
              setCurrentAddress(generalAddress);
              onSelect({
                lat: userPosition[0],
                lng: userPosition[1],
                address: generalAddress
              });
            }
          } else {
            const fallbackAddress = `Votre position actuelle (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            setCurrentAddress(fallbackAddress);
            onSelect({
              lat: userPosition[0],
              lng: userPosition[1],
              address: fallbackAddress
            });
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.warn('Erreur de géolocalisation:', error);
          setPosition(defaultPosition);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Watch for position changes
      geolocationWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const userPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(userPosition);
        },
        null,
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
    } else {
      // Fallback to default position if geolocation is not supported
      setPosition(defaultPosition);
      setIsLoading(false);
    }

    // Cleanup watch position on unmount
    return () => {
      if (geolocationWatchId.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId.current);
      }
    };
  }, []);

  // Handle map position updates with safe checks
  useEffect(() => {
    if (!mapRef.current || !position) return;

    const updateMapPosition = () => {
      try {
        if (mapRef.current && position) {
          // Use whenReady to ensure map is fully initialized
          mapRef.current.whenReady(() => {
            mapRef.current?.flyTo(position, 16, {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.5
            });
          });
        }
      } catch (error) {
        console.error('Error updating map position:', error);
      }
    };
    
    // Small delay to ensure map container is ready
    const timer = setTimeout(updateMapPosition, 300);
    return () => clearTimeout(timer);
  }, [position]);

  const handlePositionChange = async (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    setIsLoading(true);
    
    try {
      // Vérifier si on est à Abidjan
      const isInAbidjan = lat >= 5.2 && lat <= 5.55 && lng >= -4.2 && lng <= -3.9;
      
      if (isInAbidjan) {
        // Déterminer le quartier basé sur les coordonnées
        const detectedDistrict = getDistrictFromCoordinates(lat, lng);
        
        if (detectedDistrict) {
          // Format d'adresse avec quartier détecté
          const detectedAddress = `${detectedDistrict}, Abidjan, Côte d'Ivoire`;
          setAddress(detectedAddress);
          setCurrentAddress(detectedAddress);
          onSelect({ lat, lng, address: detectedAddress });
          console.log(`🏠 Quartier détecté: ${detectedDistrict}`);
        } else {
          // Si le quartier n'est pas détecté précisément, mais on est à Abidjan
          const generalAddress = `Abidjan, Côte d'Ivoire`;
          setAddress(generalAddress);
          setCurrentAddress(generalAddress);
          onSelect({ lat, lng, address: generalAddress });
          console.log('📍 Position à Abidjan mais quartier non identifié');
        }
      } else {
        // En dehors d'Abidjan, utiliser un format générique
        const fallbackAddress = `Position sélectionnée (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setAddress(fallbackAddress);
        setCurrentAddress(fallbackAddress);
        onSelect({ lat, lng, address: fallbackAddress });
        console.log('🌍 Position en dehors d\'Abidjan');
      }
    } catch (error) {
      console.warn('Erreur lors de la détection d\'adresse:', error);
      const fallbackAddress = `Position sélectionnée (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setAddress(fallbackAddress);
      setCurrentAddress(fallbackAddress);
      onSelect({ lat, lng, address: fallbackAddress });
    } finally {
      setIsLoading(false);
    }
  };

  const searchAddress = async (query: string): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    try {
      // For development, use a fallback location since we can't make direct CORS requests
      // In production, this should be handled by your backend
      console.warn('Using fallback location for development. In production, implement a backend geocoding service.');
      
      // Return a mock location in Abidjan
      return {
        lat: 5.320357,
        lng: -4.016107,
        display_name: 'Abidjan, Côte d\'Ivoire (Development Mode)'
      };
      
      /* Production code (uncomment when backend is ready)
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch address');
      return await response.json();
      */
    } catch (error) {
      console.error('Error in address search:', error);
      return null;
    }
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = address.trim();
    if (!query) return;
    
    setIsLoading(true);
    try {
      const result = await searchAddress(query);
      
      if (result) {
        const { lat, lng, display_name } = result;
        const newPosition: [number, number] = [lat, lng];
        
        setPosition(newPosition);
        setAddress(display_name);
        setCurrentAddress(display_name);
        onSelect({ lat, lng, address: display_name });
        
        if (mapRef.current) {
          // Small timeout to ensure map is ready
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.flyTo(newPosition, 16, {
                animate: true,
                duration: 1.5,
                easeLinearity: 0.5
              });
            }
          }, 100);
        }
      } else {
        // Fallback to coordinates if no address found
        const fallbackPosition: [number, number] = [5.320357, -4.016107]; // Default to Abidjan center
        const fallbackAddress = `Position: ${fallbackPosition[0].toFixed(6)}, ${fallbackPosition[1].toFixed(6)}`;
        setPosition(fallbackPosition);
        setCurrentAddress(fallbackAddress);
        onSelect({ 
          lat: fallbackPosition[0], 
          lng: fallbackPosition[1], 
          address: fallbackAddress 
        });
      }
    } catch (error) {
      console.error('Error during address search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rechercher une adresse..."
            className="w-full p-2 border rounded-md pr-10"
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e)}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        <button
          onClick={handleAddressSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 whitespace-nowrap"
          disabled={isLoading || !address || typeof address !== 'string' || !address.trim()}
        >
          {isLoading ? '...' : 'Rechercher'}
        </button>
      </div>
      
      <div className="h-64 md:h-80 rounded-md overflow-hidden border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Localisation en cours...</p>
            </div>
          </div>
        )}
        <div className="relative h-full w-full" key="map-container">
          {/* @ts-ignore */}
          <MapContainer
            center={[5.320357, -4.016107]} // Default to Abidjan
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            whenReady={() => {
              console.log('Map is ready');
              if (position && mapRef.current) {
                setTimeout(() => {
                  mapRef.current?.flyTo(position, 16, {
                    animate: true,
                    duration: 1.5,
                    easeLinearity: 0.5
                  });
                }, 300);
              }
            }}
            ref={(map) => {
              if (map) {
                mapRef.current = map;
              }
            }}
          >
            {/* @ts-ignore */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && (
              <LocationMarker 
                position={position} 
                onPositionChange={handlePositionChange} 
              />
            )}
          </MapContainer>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {position && currentAddress ? currentAddress : position ? `Position: ${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : 'Position non disponible'}
      </p>
    </div>
  );
};

export default AddressMapSelector;
