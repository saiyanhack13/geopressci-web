import React from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  Heart, 
  Navigation, 
  Phone, 
  ChevronRight,
  Badge,
  Zap
} from 'lucide-react';
import { ExtendedPressing } from '../../types/search';
import Button from '../ui/Button';
import { Card } from '../ui/card';

interface PressingCardProps {
  pressing: ExtendedPressing;
  distance?: number;
  isFavorite?: boolean;
  onSelect?: () => void;
  onToggleFavorite?: () => void;
  onGetDirections?: () => void;
  onCall?: () => void;
  viewMode?: 'list' | 'grid';
  showDistance?: boolean;
}

const PressingCard: React.FC<PressingCardProps> = ({
  pressing,
  distance,
  isFavorite = false,
  onSelect,
  onToggleFavorite,
  onGetDirections,
  onCall,
  viewMode = 'list',
  showDistance = true
}) => {
  const formatDistance = (dist: number): string => {
    if (dist < 1) return `${Math.round(dist * 1000)}m`;
    return `${dist.toFixed(1)}km`;
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString()} FCFA`;
  };

  const getMinPrice = (): number => {
    if (!pressing.services || pressing.services.length === 0) return 0;
    return Math.min(...pressing.services.map(s => s.price || s.prix || 0));
  };

  const getMaxPrice = (): number => {
    if (!pressing.services || pressing.services.length === 0) return 0;
    return Math.max(...pressing.services.map(s => s.price || s.prix || 0));
  };

  const getPrimaryAddress = () => {
    return pressing.addresses && pressing.addresses.length > 0 
      ? pressing.addresses[0] 
      : { street: 'Adresse non disponible', city: 'Abidjan' };
  };

  const primaryAddress = getPrimaryAddress();
  const minPrice = getMinPrice();
  const maxPrice = getMaxPrice();

  if (viewMode === 'grid') {
    return (
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
        <div onClick={onSelect}>
          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
            {pressing.photos && pressing.photos[0] ? (
              <img 
                src={pressing.photos[0]} 
                alt={pressing.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-4xl">🏪</div>
              </div>
            )}
            
            {/* Badge de statut */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pressing.isOpen 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {pressing.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
              </span>
            </div>

            {/* Bouton favori */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleFavorite?.();
              }}
              className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Distance */}
            {showDistance && distance !== undefined && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                  📍 {formatDistance(distance)}
                </span>
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="p-4">
            {/* En-tête */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                  {pressing.name}
                </h3>
                <div className="flex items-center space-x-2">
                  {pressing.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{pressing.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{primaryAddress.city}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {(pressing.services || []).slice(0, 2).map((service) => (
                  <span
                    key={service.id}
                    className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                  >
                    {service.name}
                  </span>
                ))}
                {(pressing.services || []).length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{(pressing.services || []).length - 2}
                  </span>
                )}
              </div>
            </div>

            {/* Prix */}
            <div className="mb-4">
              <div className="text-lg font-bold text-orange-600">
                {minPrice === maxPrice 
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                }
              </div>
              <div className="text-xs text-gray-500">
                Délai: {pressing.estimatedDeliveryTime || '24-48h'}
              </div>
            </div>

            {/* Badges */}
            {pressing.badges && pressing.badges.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {pressing.badges.slice(0, 2).map((badge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Promotions */}
            {pressing.promotions && pressing.promotions.length > 0 && (
              <div className="mb-3">
                {pressing.promotions.slice(0, 1).map((promo, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <span className="text-red-700 text-xs font-medium">{promo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onGetDirections && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onGetDirections();
                  }}
                  className="flex items-center space-x-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span className="hidden sm:inline">Itinéraire</span>
                </Button>
              )}
              
              {onCall && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCall();
                  }}
                  className="flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">Appeler</span>
                </Button>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onSelect}
              className="flex items-center space-x-1"
            >
              <span>Voir détails</span>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Mode liste
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer mb-4">
      <div onClick={onSelect} className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Image */}
          <div className="relative w-full sm:w-32 h-32 sm:h-24 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg overflow-hidden">
              {pressing.photos && pressing.photos[0] ? (
                <img 
                  src={pressing.photos[0]} 
                  alt={pressing.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white text-2xl">🏪</div>
                </div>
              )}
            </div>
            
            {/* Badge de statut sur l'image */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pressing.isOpen 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {pressing.isOpen ? '🟢' : '🔴'}
              </span>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 mb-3 sm:mb-0">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {pressing.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                      {pressing.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{pressing.rating}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{primaryAddress.street}, {primaryAddress.city}</span>
                      </div>
                      {showDistance && distance !== undefined && (
                        <div className="flex items-center space-x-1 text-orange-600 font-medium">
                          <span>📍 {formatDistance(distance)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bouton favori */}
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onToggleFavorite?.();
                    }}
                    className={`p-2 rounded-full transition-colors ml-2 ${
                      isFavorite
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Services */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {(pressing.services || []).slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        {service.name || service.nom || 'Service'} • {formatPrice(service.price || service.prix || 0)}
                      </span>
                    ))}
                    {(pressing.services || []).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{(pressing.services || []).length - 3} autres services
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges et promotions */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pressing.badges && pressing.badges.slice(0, 2).map((badge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                  {pressing.promotions && pressing.promotions.slice(0, 1).map((promo, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                    >
                      {promo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prix et actions */}
              <div className="flex flex-col sm:items-end space-y-3">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {minPrice === maxPrice 
                      ? formatPrice(minPrice)
                      : `À partir de ${formatPrice(minPrice)}`
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    Délai: {pressing.estimatedDeliveryTime || '24-48h'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {onGetDirections && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onGetDirections();
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span className="hidden sm:inline">Itinéraire</span>
                    </Button>
                  )}
                  
                  {onCall && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onCall();
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="hidden sm:inline">Appeler</span>
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onSelect}
                    className="flex items-center space-x-1"
                  >
                    <span>Voir détails</span>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PressingCard;
