import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X, Star, MapPin, Clock, DollarSign } from 'lucide-react';
import { AbidjanNeighborhood, PressingServiceCategory } from '../../types';

export interface SearchFiltersState {
  services: PressingServiceCategory[];
  neighborhoods: AbidjanNeighborhood[];
  priceRange: 'all' | 'economique' | 'moyen' | 'premium';
  rating: number;
  distance: number;
  openNow: boolean;
  deliveryType: 'all' | 'express' | 'standard';
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  resultsCount: number;
  isLoading?: boolean;
}

const abidjanNeighborhoods = [
  { id: AbidjanNeighborhood.COCODY, name: 'Cocody', emoji: '🏘️' },
  { id: AbidjanNeighborhood.PLATEAU, name: 'Plateau', emoji: '🏢' },
  { id: AbidjanNeighborhood.YOPOUGON, name: 'Yopougon', emoji: '🏘️' },
  { id: AbidjanNeighborhood.MARCORY, name: 'Marcory', emoji: '🏘️' },
  { id: AbidjanNeighborhood.TREICHVILLE, name: 'Treichville', emoji: '🏪' },
  { id: AbidjanNeighborhood.ADJAME, name: 'Adjamé', emoji: '🛍️' },
  { id: AbidjanNeighborhood.ABOBO, name: 'Abobo', emoji: '🏘️' },
  { id: AbidjanNeighborhood.KOUMASSI, name: 'Koumassi', emoji: '🏘️' },
  { id: AbidjanNeighborhood.PORT_BOUET, name: 'Port-Bouët', emoji: '✈️' },
  { id: AbidjanNeighborhood.ATTECOUBE, name: 'Attécoubé', emoji: '🏘️' }
];

const serviceOptions = [
  { id: PressingServiceCategory.NETTOYAGE_SEC, name: 'Nettoyage à sec', icon: '🧥' },
  { id: PressingServiceCategory.LAVAGE, name: 'Lavage & Pliage', icon: '👕' },
  { id: PressingServiceCategory.REPASSAGE, name: 'Repassage', icon: '🔥' },
  { id: PressingServiceCategory.AUTRE, name: 'Spécialités', icon: '✨' },
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  resultsCount,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const updateFilters = (updates: Partial<SearchFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      services: [],
      neighborhoods: [],
      priceRange: 'all',
      rating: 0,
      distance: 10,
      openNow: false,
      deliveryType: 'all'
    });
  };

  const hasActiveFilters = 
    filters.services.length > 0 ||
    filters.neighborhoods.length > 0 ||
    filters.priceRange !== 'all' ||
    filters.rating > 0 ||
    filters.distance < 10 ||
    filters.openNow ||
    filters.deliveryType !== 'all';

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Filtres de recherche</h3>
          {hasActiveFilters && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {filters.services.length + filters.neighborhoods.length + 
               (filters.priceRange !== 'all' ? 1 : 0) + 
               (filters.rating > 0 ? 1 : 0) + 
               (filters.distance < 10 ? 1 : 0) + 
               (filters.openNow ? 1 : 0) + 
               (filters.deliveryType !== 'all' ? 1 : 0)} actifs
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {isLoading ? '⏳ Recherche...' : `📍 ${resultsCount} résultat${resultsCount !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilters({ openNow: !filters.openNow })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.openNow
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🕐 Ouvert maintenant
          </button>
          <button
            onClick={() => updateFilters({ rating: filters.rating === 4 ? 0 : 4 })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.rating >= 4
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⭐ 4+ étoiles
          </button>
          <button
            onClick={() => updateFilters({ distance: filters.distance === 2 ? 10 : 2 })}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.distance <= 2
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📍 Proche (2km)
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
            >
              <X className="w-3 h-3 inline mr-1" />
              Effacer tout
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Services */}
          <div>
            <button
              onClick={() => toggleSection('services')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="mr-2">🧽</span>
                Services disponibles
              </h4>
              <ChevronDown className={`w-4 h-4 transition-transform ${
                activeSection === 'services' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeSection === 'services' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {serviceOptions.map(service => (
                  <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service.id)}
                      onChange={(e) => {
                        const newServices = e.target.checked
                          ? [...filters.services, service.id]
                          : filters.services.filter(s => s !== service.id);
                        updateFilters({ services: newServices });
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">
                      {service.icon} {service.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quartiers */}
          <div>
            <button
              onClick={() => toggleSection('neighborhoods')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Quartiers d'Abidjan
              </h4>
              <ChevronDown className={`w-4 h-4 transition-transform ${
                activeSection === 'neighborhoods' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeSection === 'neighborhoods' && (
              <div className="mt-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {abidjanNeighborhoods.map(neighborhood => (
                  <label key={neighborhood.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.neighborhoods.includes(neighborhood.id)}
                      onChange={(e) => {
                        const newNeighborhoods = e.target.checked
                          ? [...filters.neighborhoods, neighborhood.id]
                          : filters.neighborhoods.filter(n => n !== neighborhood.id);
                        updateFilters({ neighborhoods: newNeighborhoods });
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">
                      {neighborhood.emoji} {neighborhood.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Prix */}
          <div>
            <h4 className="font-medium text-gray-900 flex items-center mb-3">
              <DollarSign className="w-4 h-4 mr-2" />
              Gamme de prix
            </h4>
            <div className="space-y-2">
              {[
                { id: 'all', name: 'Tous les prix', emoji: '💰' },
                { id: 'economique', name: 'Économique (< 2000 FCFA)', emoji: '💵' },
                { id: 'moyen', name: 'Moyen (2000-4000 FCFA)', emoji: '💴' },
                { id: 'premium', name: 'Premium (> 4000 FCFA)', emoji: '💎' },
              ].map(price => (
                <label key={price.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.priceRange === price.id}
                    onChange={() => updateFilters({ priceRange: price.id as any })}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm">
                    {price.emoji} {price.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <h4 className="font-medium text-gray-900 flex items-center mb-3">
              <MapPin className="w-4 h-4 mr-2" />
              Distance maximale: {filters.distance}km
            </h4>
            <input
              type="range"
              min="1"
              max="20"
              value={filters.distance}
              onChange={(e) => updateFilters({ distance: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1km</span>
              <span>10km</span>
              <span>20km+</span>
            </div>
          </div>

          {/* Note minimale */}
          <div>
            <h4 className="font-medium text-gray-900 flex items-center mb-3">
              <Star className="w-4 h-4 mr-2" />
              Note minimale
            </h4>
            <div className="flex space-x-2">
              {[0, 3, 4, 4.5].map(rating => (
                <button
                  key={rating}
                  onClick={() => updateFilters({ rating })}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.rating === rating
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 0 ? 'Toutes' : `${rating}+ ⭐`}
                </button>
              ))}
            </div>
          </div>

          {/* Type de livraison */}
          <div>
            <h4 className="font-medium text-gray-900 flex items-center mb-3">
              <Clock className="w-4 h-4 mr-2" />
              Type de livraison
            </h4>
            <div className="space-y-2">
              {[
                { id: 'all', name: 'Tous les délais', emoji: '📦' },
                { id: 'express', name: 'Express (24h)', emoji: '⚡' },
                { id: 'standard', name: 'Standard (2-3 jours)', emoji: '🚚' },
              ].map(delivery => (
                <label key={delivery.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={filters.deliveryType === delivery.id}
                    onChange={() => updateFilters({ deliveryType: delivery.id as any })}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm">
                    {delivery.emoji} {delivery.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
