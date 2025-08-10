// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PressingMarker from './PressingMarker';
import FilterPanel from './FilterPanel';
import * as L from 'leaflet';
import { useGetNearbyPressingsQuery } from '../../services/api';
import { Pressing } from '../../types';

// Configuration des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new L.Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Configuration de l'icône par défaut pour les marqueurs
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  initialPosition?: [number, number];
  userPosition?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

const Map: React.FC<MapProps> = ({ 
  initialPosition, 
  userPosition, 
  zoom = 12,
  onLocationSelect
}) => {
  const defaultPosition: LatLngTuple = [5.3599517, -4.0082563]; // Abidjan par défaut
  const [position, setPosition] = useState<LatLngTuple>(initialPosition || defaultPosition);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  
  // État pour forcer le rafraîchissement
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Récupération des pressings à proximité depuis l'API
  const { data: pressings = [], isLoading, error, refetch } = useGetNearbyPressingsQuery({
    location: { lat: position[0], lng: position[1] },
    radius: 10000 // 10km de rayon
  });
  
  // Fonction pour rafraîchir manuellement les données
  const handleRefresh = useCallback(() => {
    refetch();
    setRefreshKey(prev => prev + 1);
  }, [refetch]);
  
  // Rafraîchissement automatique toutes les 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [refetch]);

  // Mise à jour de la position si initialPosition change
  useEffect(() => {
    if (initialPosition) {
      // Vérifier si la position a réellement changé
      const hasChanged = 
        initialPosition[0] !== position[0] || 
        initialPosition[1] !== position[1];
      
      if (hasChanged) {
        setPosition(initialPosition);
        
        // Notifier du changement de position si nécessaire
        if (onLocationSelect) {
          onLocationSelect(initialPosition[0], initialPosition[1]);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition, onLocationSelect]);
  
  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      console.error('Erreur lors du chargement des pressings:', error);
    }
  }, [error]);

  // Gestion de la sélection des services
  const handleServiceSelect = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Gestion du changement de note minimale
  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Gestion du clic sur la carte
  const handleMapClick = (e: any) => {
    const newPosition: LatLngTuple = [e.latlng.lat, e.latlng.lng];
    setPosition(newPosition);
    if (onLocationSelect) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  };

  // Gestion du clic sur un marqueur de pressing
  const handlePressingClick = (pressing: Pressing) => {
    if (onLocationSelect && pressing.location?.coordinates) {
      onLocationSelect(
        pressing.location.coordinates[1], // lat
        pressing.location.coordinates[0]  // lng
      );
    }
  };

  // Mise à jour de la position si userPosition change
  useEffect(() => {
    if (userPosition) {
      const newPosition: LatLngTuple = [userPosition.lat, userPosition.lng];
      
      // Vérifier si la position a réellement changé
      const hasChanged = 
        !position || 
        newPosition[0] !== position[0] || 
        newPosition[1] !== position[1];
      
      if (hasChanged) {
        setPosition(newPosition);
        
        // Si une fonction de rappel est fournie, notifier du changement de position
        if (onLocationSelect) {
          onLocationSelect(userPosition.lat, userPosition.lng);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition, onLocationSelect]);

  const filteredPressings = React.useMemo(() => {
    if (!Array.isArray(pressings)) return [];
    
    return pressings.filter((pressing: Pressing) => {
      // Vérification de la présence des services
      if (!pressing.services || !Array.isArray(pressing.services)) return true;
      
      // Filtrage par services sélectionnés
      const servicesMatch = selectedServices.length === 0 || 
        pressing.services.some((service: any) => {
          if (typeof service === 'string') {
            return selectedServices.includes(service);
          }
          // Handle PressingService object with potentially undefined name
          const serviceName = service.name || service.nom || '';
          return serviceName && selectedServices.includes(serviceName);
        });
        
      // Filtrage par note minimale
      const ratingMatch = pressing.rating ? pressing.rating >= minRating : true;
      
      return servicesMatch && ratingMatch;
    });
  }, [pressings, selectedServices, minRating]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <div 
          className="leaflet-container" 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            // Vérifier que le clic est bien sur la carte et non sur un élément enfant
            if (e.target === e.currentTarget) {
              const leafletEvent = e as unknown as { latlng: { lat: number; lng: number } };
              handleMapClick(leafletEvent);
            }
          }}
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <FilterPanel 
          selectedServices={selectedServices} 
          minRating={minRating}
          onServiceChange={handleServiceSelect}
          onRatingChange={handleRatingChange}
        />
        
        {filteredPressings.map((pressing) => {
          if (!pressing.location?.coordinates) return null;
          const defaultPressing = {
            ...pressing,
            _id: pressing._id || 'default-pressing',
            name: pressing.name || pressing.businessName || 'Pressing',
            businessName: pressing.businessName || pressing.name || 'Pressing',
            businessInfo: pressing.businessInfo || {},
            services: (pressing.services || []).map(service => service.name || service.category || 'service') as string[],
            openingHours: pressing.openingHours || [],
            rating: pressing.rating || 0,
            photos: pressing.photos || [],
            subscription: pressing.subscription || {
              plan: 'basic',
              status: 'active',
              endDate: ''
            },
            verification: pressing.verification || {
              status: 'pending'
            },
            priceRange: pressing.priceRange || 'medium',
            deliveryTime: pressing.deliveryTime || '',
            distance: pressing.distance || 0,
            isOpen: pressing.isOpen || false,
            address: pressing.address || 'Abidjan'
          };
          return (
            <PressingMarker
              key={defaultPressing._id}
              position={[pressing.location?.coordinates?.[1] ?? 0, pressing.location?.coordinates?.[0] ?? 0] as [number, number]}
              pressing={defaultPressing}
              onClick={() => handlePressingClick(pressing)}
            />
          );
        })}
        
        {userPosition && (
          <PressingMarker
            position={[userPosition.lat, userPosition.lng]}
            isUserLocation={true}
            pressing={{
              _id: 'user-location',
              name: 'Votre position',
              address: '',
              rating: 0,
              services: [],
              location: {
                type: 'Point',
                coordinates: [userPosition.lng, userPosition.lat]
              }
            }}
          />
        )}
      </MapContainer>
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          Chargement des pressings...
        </div>
      )}
      
      {/* Bouton de rafraîchissement */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#2563EB';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#3B82F6';
          }
        }}
        title="Rafraîchir la liste des pressings"
      >
        {isLoading ? '⟳' : '🔄'} Actualiser
      </button>
      
      {/* Indicateur du nombre de pressings */}
      {pressings.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '10px',
          padding: '4px 8px',
          backgroundColor: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {pressings.length} pressing{pressings.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Map;
