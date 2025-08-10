import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Star, MapPin, Clock, CheckCircle, XCircle, ArrowRight, Heart } from 'lucide-react';
import Button from '../Button';

interface PressingCardProps {
  pressing: {
    id: string;
    name: string;
    rating: number | { average: number; count: number; totalScore: number };
    distance: number; // en km
    services: string[];
    priceRange: 'low' | 'medium' | 'high';
    image?: string;
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
  };
  className?: string;
  onSelect?: () => void;
  onGetDirections?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

const PressingCard: React.FC<PressingCardProps> = ({ 
  pressing, 
  className, 
  onSelect, 
  onGetDirections, 
  onToggleFavorite, 
  isFavorite 
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/client/pressing/${pressing.id}`);
  };

  const getPriceRangeDisplay = (priceRange: string) => {
    switch (priceRange) {
      case 'low': return { text: 'Économique', emoji: '💰', color: 'text-green-600' };
      case 'medium': return { text: 'Moyen', emoji: '💰💰', color: 'text-yellow-600' };
      case 'high': return { text: 'Premium', emoji: '💰💰💰', color: 'text-purple-600' };
      default: return { text: 'Standard', emoji: '💰', color: 'text-gray-600' };
    }
  };

  const priceDisplay = getPriceRangeDisplay(pressing.priceRange);

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Image avec badge statut */}
      <div className="relative">
        <img 
          src={pressing.image || '/api/placeholder/300/200'} 
          alt={pressing.name} 
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-2 right-2">
          {pressing.isOpen ? (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Ouvert
            </span>
          ) : (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Fermé
            </span>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <span className={`bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium ${priceDisplay.color}`}>
            {priceDisplay.emoji} {priceDisplay.text}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Nom et note */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-800 flex-1 mr-2">{pressing.name}</h3>
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
            <span className="text-sm font-medium text-gray-700">{(typeof pressing.rating === 'object' ? (pressing.rating as any)?.average || 0 : pressing.rating || 0).toFixed(1)}</span>
          </div>
        </div>

        {/* Adresse et distance */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm flex-1">{(pressing.addresses && pressing.addresses.length > 0) ? `${pressing.addresses[0].street}, ${pressing.addresses[0].city}` : 'Adresse non disponible'}</span>
          <span className="text-sm font-medium text-blue-600">
            {pressing.distance.toFixed(1)} km
          </span>
        </div>

        {/* Temps de livraison */}
        <div className="flex items-center text-gray-600 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">Livraison en {pressing.deliveryTime}</span>
        </div>

        {/* Services */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {pressing.services.slice(0, 3).map((service, index) => (
              <span 
                key={index} 
                className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
              >
                {service}
              </span>
            ))}
            {pressing.services.length > 3 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                +{pressing.services.length - 3} autres
              </span>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button 
            onClick={onSelect || handleViewDetails}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            Voir détails
            <ArrowRight className="w-4 h-4" />
          </Button>
          {pressing.isOpen && (
            <Button 
              onClick={onGetDirections || (() => navigate(`/client/pressing/${pressing.id}`))}
              variant="outline"
              className="px-4 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              {onGetDirections ? 'Itinéraire' : '⚡ Commander'}
            </Button>
          )}
          {onToggleFavorite && (
            <Button 
              onClick={onToggleFavorite}
              variant="ghost"
              className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PressingCard;
