import React from 'react';
import { ExtendedPressing } from '../../types/search';
import PressingCard from './PressingCard';
import { Loader2, MapPin, Search } from 'lucide-react';

interface PressingListProps {
  pressings: ExtendedPressing[];
  isLoading?: boolean;
  userPosition?: [number, number] | null;
  onPressingSelect?: (pressing: ExtendedPressing) => void;
  onGetDirections?: (pressing: ExtendedPressing) => void;
  onToggleFavorite?: (pressingId: string) => void;
  onCall?: (pressing: ExtendedPressing) => void;
  favorites?: string[];
  viewMode?: 'list' | 'grid';
  showDistance?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

const PressingList: React.FC<PressingListProps> = ({
  pressings,
  isLoading = false,
  userPosition,
  onPressingSelect,
  onGetDirections,
  onToggleFavorite,
  onCall,
  favorites = [],
  viewMode = 'list',
  showDistance = true,
  emptyMessage = "Aucun pressing trouvé",
  emptyIcon = <Search className="w-12 h-12 text-gray-400" />
}) => {
  // Calculer la distance pour chaque pressing
  const calculateDistance = (pressing: ExtendedPressing): number => {
    if (!userPosition || !pressing.location) return 0;
    
    const [userLat, userLng] = userPosition;
    const { coordinates } = pressing.location;
    const pressingLat = coordinates[1];
    const pressingLng = coordinates[0];
    
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

  // État de chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loading pour mode liste */}
        {viewMode === 'list' ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-full sm:w-32 h-32 sm:h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Skeleton loading pour mode grille */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Indicateur de chargement central */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-orange-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Recherche en cours...</span>
          </div>
        </div>
      </div>
    );
  }

  // État vide
  if (!pressings || pressings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {emptyIcon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-gray-600 max-w-md">
              Essayez de modifier vos critères de recherche ou d'élargir votre zone de recherche.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Activez votre géolocalisation pour de meilleurs résultats</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu des résultats
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {pressings.map((pressing) => {
          const distance = showDistance ? calculateDistance(pressing) : undefined;
          const isFavorite = pressing.id ? favorites.includes(pressing.id) : false;
          
          return (
            <PressingCard
              key={pressing.id || pressing._id || Math.random().toString()}
              pressing={pressing}
              distance={distance}
              isFavorite={isFavorite}
              viewMode="grid"
              showDistance={showDistance}
              onSelect={() => onPressingSelect?.(pressing)}
              onToggleFavorite={() => pressing.id && onToggleFavorite?.(pressing.id)}
              onGetDirections={() => onGetDirections?.(pressing)}
              onCall={() => onCall?.(pressing)}
            />
          );
        })}
      </div>
    );
  }

  // Mode liste
  return (
    <div className="space-y-4">
      {pressings.map((pressing) => {
        const distance = showDistance ? calculateDistance(pressing) : undefined;
        const isFavorite = pressing.id ? favorites.includes(pressing.id) : false;
        
        return (
          <PressingCard
            key={pressing.id || pressing._id || Math.random().toString()}
            pressing={pressing}
            distance={distance}
            isFavorite={isFavorite}
            viewMode="list"
            showDistance={showDistance}
            onSelect={() => onPressingSelect?.(pressing)}
            onToggleFavorite={() => pressing.id && onToggleFavorite?.(pressing.id)}
            onGetDirections={() => onGetDirections?.(pressing)}
            onCall={() => onCall?.(pressing)}
          />
        );
      })}
    </div>
  );
};

export default PressingList;
