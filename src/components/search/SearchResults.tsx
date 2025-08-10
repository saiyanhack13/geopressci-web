import React, { useState, useMemo } from 'react';
import { MapPin, Star, Clock, ChevronRight, List, Grid, Heart, Navigation } from 'lucide-react';
import { ExtendedPressing } from '../../types/search';
import PressingCard from '../ui/Card/PressingCard';

// Type pour les données de carte de pressing
interface PressingCardData {
  id: string;
  name: string;
  rating: number;
  distance: number;
  services: string[];
  priceRange: "low" | "medium" | "high";
  addresses: Array<{
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
    isDefault?: boolean;
  }>;
  isOpen: boolean;
  deliveryTime: string;
  image?: string;
}

// Fonction utilitaire pour extraire la note moyenne
const getRatingValue = (rating: any): number => {
  if (!rating) return 0;
  if (typeof rating === 'number') return rating;
  return rating.average || 0;
};

// Fonction utilitaire pour extraire le nombre d'avis
const getRatingCount = (rating: any): number => {
  if (!rating) return 0;
  if (typeof rating === 'number') return 0;
  return rating.count || 0;
};

// Fonction pour convertir ExtendedPressing vers PressingCardData
const convertToPressingCardData = (pressing: ExtendedPressing): PressingCardData => {
  // Calculer la fourchette de prix basée sur les services
  const services = pressing.services || [];
  const prices = services.map((s: any) => s.price || 0).filter(price => price > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 1000;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 2000;
  
  // Déterminer la catégorie de prix
  let priceCategory: "low" | "medium" | "high";
  if (maxPrice <= 1500) {
    priceCategory = "low";
  } else if (maxPrice <= 3000) {
    priceCategory = "medium";
  } else {
    priceCategory = "high";
  }
  
  const priceRange = `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} FCFA`;
  
  // Obtenir la première adresse ou une adresse par défaut
  const primaryAddress = pressing.addresses && pressing.addresses.length > 0 
    ? pressing.addresses[0] 
    : { street: 'Adresse non disponible', city: 'Abidjan', state: 'Lagunes', zipCode: '00225', country: 'Côte d\'Ivoire', isDefault: true };
  
  return {
    id: pressing.id || pressing._id || '',
    name: pressing.name || pressing.businessName || 'Pressing sans nom',
    rating: getRatingValue(pressing.rating),
    distance: 0, // Sera calculé séparément
    services: services.map((s: any) => s.name || s.nom || 'Service'), // Convertir en tableau de noms
    priceRange: priceCategory,
    addresses: pressing.addresses || [{
      street: 'Adresse non disponible',
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      isDefault: true
    }],
    isOpen: pressing.isOpen || false,
    deliveryTime: pressing.estimatedDeliveryTime || '24-48h',
    image: pressing.photos && pressing.photos.length > 0 ? pressing.photos[0] : undefined
  };
};

interface SearchResultsProps {
  pressings: ExtendedPressing[];
  isLoading?: boolean;
  userPosition?: [number, number] | null;
  onPressingSelect?: (pressing: ExtendedPressing) => void;
  onGetDirections?: (pressing: ExtendedPressing) => void;
  onToggleFavorite?: (pressingId: string) => void;
  favorites?: string[];
  sortBy: 'relevance' | 'distance' | 'rating' | 'price';
  onSortChange: (sort: 'relevance' | 'distance' | 'rating' | 'price') => void;
}

type ViewMode = 'list' | 'grid';

const SearchResults: React.FC<SearchResultsProps> = ({
  pressings,
  isLoading = false,
  userPosition,
  onPressingSelect,
  onGetDirections,
  onToggleFavorite,
  favorites = [],
  sortBy,
  onSortChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Calculer la distance si position utilisateur disponible
  const calculateDistance = (pressing: ExtendedPressing): number => {
    if (!userPosition) return 0;
    
    const [userLat, userLng] = userPosition;
    // Utiliser la géolocalisation de la première adresse ou coordonnées par défaut d'Abidjan
    const location = pressing.addresses && pressing.addresses.length > 0 && pressing.addresses[0].location
      ? pressing.addresses[0].location
      : { lat: 5.359952, lng: -3.982213 }; // Coordonnées par défaut d'Abidjan
    const { lat: pressingLat, lng: pressingLng } = location;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (pressingLat - userLat) * Math.PI / 180;
    const dLng = (pressingLng - userLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(pressingLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Trier les pressings
  const sortedPressings = useMemo(() => [...pressings].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return calculateDistance(a) - calculateDistance(b);
      case 'rating':
        return getRatingValue(b.rating) - getRatingValue(a.rating);
      case 'price':
        const servicesA = a.services || [];
        const servicesB = b.services || [];
        const avgPriceA = servicesA.length > 0 ? servicesA.reduce((sum: number, s: any) => sum + (s.price || 0), 0) / servicesA.length : 0;
        const avgPriceB = servicesB.length > 0 ? servicesB.reduce((sum: number, s: any) => sum + (s.price || 0), 0) / servicesB.length : 0;
        return avgPriceA - avgPriceB;
      default: // relevance
        return 0;
    }
  }), [pressings, sortBy, userPosition]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price).replace('XOF', 'FCFA');
  };

  const getMinPrice = (pressing: ExtendedPressing): number => {
    const services = pressing.services || [];
    if (services.length === 0) return 0;
    const prices = services.map((s: any) => s.price || 0).filter(price => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (pressings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pressing trouvé</h3>
        <p className="text-gray-500 mb-4">
          Essayez d'ajuster vos filtres ou d'élargir votre zone de recherche
        </p>
        <div className="flex justify-center space-x-2 text-sm text-gray-400">
          <span>💡 Conseils:</span>
          <span>Vérifiez l'orthographe</span>
          <span>•</span>
          <span>Utilisez des termes plus généraux</span>
          <span>•</span>
          <span>Augmentez la distance</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            📍 {pressings.length} pressing{pressings.length !== 1 ? 's' : ''} trouvé{pressings.length !== 1 ? 's' : ''}
          </span>
          
          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="relevance">📊 Pertinence</option>
            <option value="distance">📍 Distance</option>
            <option value="rating">⭐ Note</option>
            <option value="price">💰 Prix</option>
          </select>
        </div>

        {/* Mode d'affichage */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {sortedPressings.map((pressing) => {
          const distance = userPosition ? calculateDistance(pressing) : 0;
          const minPrice = getMinPrice(pressing);
          const pressingId = pressing.id || pressing._id || '';
          const isFavorite = favorites.includes(pressingId);

          if (viewMode === 'grid') {
            const pressingData = convertToPressingCardData(pressing);
            pressingData.distance = distance; // Ajouter la distance calculée
            return (
              <PressingCard
                key={pressingId}
                pressing={pressingData}
                onSelect={() => onPressingSelect?.(pressing)}
                onGetDirections={() => onGetDirections?.(pressing)}
                onToggleFavorite={() => onToggleFavorite?.(pressingId)}
                isFavorite={isFavorite}
              />
            );
          }

          return (
            <div
              key={pressingId}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onPressingSelect?.(pressing)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{pressing.name}</h3>
                      {pressing.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {getRatingValue(pressing.rating).toFixed(1)}
                            {getRatingCount(pressing.rating) > 0 && (
                              <span className="text-xs text-gray-500 ml-1">({getRatingCount(pressing.rating)})</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{pressing.addresses && pressing.addresses.length > 0 ? pressing.addresses[0].city : 'Abidjan'}</span>
                        {userPosition && (
                          <span className="text-orange-600 font-medium">
                            • {formatDistance(distance)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-green-600">Ouvert</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {(pressing.services || []).slice(0, 3).map((service: any, index: number) => (
                          <span
                            key={service.id || service._id || index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {service.name || service.nom || 'Service'}
                          </span>
                        ))}
                        {(pressing.services || []).length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{(pressing.services || []).length - 3} autres
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          À partir de {formatPrice(minPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(pressingId);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        isFavorite
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    
                    {userPosition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGetDirections?.(pressing);
                        }}
                        className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
