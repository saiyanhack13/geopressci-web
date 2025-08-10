import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Star, 
  Clock,
  Truck,
  Package
} from 'lucide-react';
import { SearchFilters } from '../../types/search';
import { AbidjanNeighborhood, PressingServiceCategory } from '../../types/index';
import Button from '../ui/Button';
import { Card } from '../ui/card';

interface MobileFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  userPosition?: [number, number] | null;
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
  filters,
  onFiltersChange,
  userPosition,
  isOpen,
  onClose,
  onReset
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['location']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const neighborhoods: { value: AbidjanNeighborhood; label: string; emoji: string }[] = [
    { value: AbidjanNeighborhood.COCODY, label: 'Cocody', emoji: '🏢' },
    { value: AbidjanNeighborhood.PLATEAU, label: 'Plateau', emoji: '🏛️' },
    { value: AbidjanNeighborhood.YOPOUGON, label: 'Yopougon', emoji: '🏘️' },
    { value: AbidjanNeighborhood.ADJAME, label: 'Adjamé', emoji: '🛒' },
    { value: AbidjanNeighborhood.TREICHVILLE, label: 'Treichville', emoji: '🌊' },
    { value: AbidjanNeighborhood.MARCORY, label: 'Marcory', emoji: '🏭' },
    { value: AbidjanNeighborhood.KOUMASSI, label: 'Koumassi', emoji: '🏪' },
    { value: AbidjanNeighborhood.PORT_BOUET, label: 'Port-Bouët', emoji: '✈️' },
    { value: AbidjanNeighborhood.ATTECOUBE, label: 'Attécoubé', emoji: '🏘️' },
    { value: AbidjanNeighborhood.ABOBO, label: 'Abobo', emoji: '🏠' }
  ];

  const services: { value: PressingServiceCategory; label: string; emoji: string }[] = [
    { value: PressingServiceCategory.NETTOYAGE_SEC, label: 'Nettoyage à sec', emoji: '🧽' },
    { value: PressingServiceCategory.LAVAGE, label: 'Lavage', emoji: '🫧' },
    { value: PressingServiceCategory.REPASSAGE, label: 'Repassage', emoji: '👔' },
    { value: PressingServiceCategory.RETOUCHE, label: 'Retouches', emoji: '✂️' }
  ];

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString()} FCFA`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-green-600">
            <h2 className="text-lg font-semibold text-white">🔍 Filtres</h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Localisation */}
            <Card className="p-4">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Localisation</span>
                </div>
                {expandedSections.has('location') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.has('location') && (
                <div className="mt-3 space-y-3">
                  {/* Quartiers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quartiers d'Abidjan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {neighborhoods.map((neighborhood) => (
                        <label
                          key={neighborhood.value}
                          className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={filters.neighborhoods.includes(neighborhood.value)}
                            onChange={(e) => {
                              const newNeighborhoods = e.target.checked
                                ? [...filters.neighborhoods, neighborhood.value]
                                : filters.neighborhoods.filter((n: string) => n !== neighborhood.value);
                              onFiltersChange({ neighborhoods: newNeighborhoods });
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm">
                            {neighborhood.emoji} {neighborhood.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Distance */}
                  {userPosition && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance maximale: {filters.distanceRange[1]}km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={filters.distanceRange[1]}
                        onChange={(e) => onFiltersChange({ distanceRange: [filters.distanceRange[0], parseInt(e.target.value)] })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1km</span>
                        <span>50km</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Services */}
            <Card className="p-4">
              <button
                onClick={() => toggleSection('services')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Services</span>
                </div>
                {expandedSections.has('services') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.has('services') && (
                <div className="mt-3 space-y-2">
                  {services.map((service) => (
                    <label
                      key={service.value}
                      className="flex items-center space-x-3 p-2 rounded-lg border cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={filters.services.includes(service.value)}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...filters.services, service.value]
                            : filters.services.filter((s: string) => s !== service.value);
                          onFiltersChange({ services: newServices });
                        }}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm">
                        {service.emoji} {service.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            {/* Prix */}
            <Card className="p-4">
              <button
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">💰</span>
                  <span className="font-medium">Prix</span>
                </div>
                {expandedSections.has('price') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.has('price') && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fourchette de prix: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="100"
                        value={filters.priceRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= filters.priceRange[1]) {
                            onFiltersChange({ priceRange: [newMin, filters.priceRange[1]] });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="100"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= filters.priceRange[0]) {
                            onFiltersChange({ priceRange: [filters.priceRange[0], newMax] });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>500 FCFA</span>
                      <span>10 000 FCFA</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Qualité */}
            <Card className="p-4">
              <button
                onClick={() => toggleSection('quality')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Qualité</span>
                </div>
                {expandedSections.has('quality') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.has('quality') && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note minimale: {filters.rating} étoile{filters.rating > 1 ? 's' : ''}
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => onFiltersChange({ rating: rating })}
                        className={`p-1 rounded ${
                          rating <= filters.rating
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Options */}
            <Card className="p-4">
              <button
                onClick={() => toggleSection('options')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Options</span>
                </div>
                {expandedSections.has('options') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.has('options') && (
                <div className="mt-3 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.openNow}
                      onChange={(e) => onFiltersChange({ openNow: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">🟢 Ouvert maintenant</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasDelivery}
                      onChange={(e) => onFiltersChange({ hasDelivery: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">🚚 Livraison disponible</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasPickup}
                      onChange={(e) => onFiltersChange({ hasPickup: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">📦 Collecte disponible</span>
                  </label>
                </div>
              )}
            </Card>
          </div>

          {/* Footer */}
          <div className="border-t p-4 space-y-3">
            <Button
              variant="outline"
              onClick={onReset}
              className="w-full"
            >
              🔄 Réinitialiser
            </Button>
            <Button
              variant="primary"
              onClick={onClose}
              className="w-full"
            >
              ✅ Appliquer les filtres
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilters;
