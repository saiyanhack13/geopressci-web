import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Heart, 
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  ArrowLeft,
  Trash2,
  Search,
  Filter,
  SortAsc,
  Eye,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface FavoritePressing {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  distance: number;
  rating: number;
  reviewCount: number;
  phone: string;
  services: string[];
  priceRange: string;
  openingHours: string;
  image: string;
  addedDate: string;
  lastOrderDate?: string;
  totalOrders: number;
}

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Utilisation directe de l'API backend pour les favoris
  const { 
    data: favoritePressings = [], 
    isLoading, 
    error,
    refetch 
  } = useGetFavoritesQuery();
  
  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'rating' | 'lastOrder'>('name');
  const [loading, setLoading] = useState(false);
  
  // Transformation des données API en format FavoritePressing
  const favorites: FavoritePressing[] = favoritePressings.map((pressing: any) => ({
    id: pressing._id || pressing.id,
    name: pressing.businessName || pressing.name || `${pressing.nom} ${pressing.prenom}`,
    address: pressing.address?.street || 'Adresse non disponible',
    neighborhood: pressing.address?.district || pressing.address?.city || 'Quartier non spécifié',
    distance: pressing.distance || Math.random() * 5 + 0.5, // Distance calculée ou simulée
    rating: pressing.rating || 4.0,
    reviewCount: pressing.reviewCount || 0,
    phone: pressing.phone || pressing.telephone || 'Non disponible',
    services: pressing.services?.map((s: any) => s.name || s.nom) || [],
    priceRange: 'Moyen',
    openingHours: pressing.businessHours ? 'Lun-Sam 8h-18h' : 'Horaires non disponibles',
    image: pressing.coverImage || '/api/placeholder/300/200',
    addedDate: pressing.createdAt || new Date().toISOString(),
    lastOrderDate: pressing.lastOrderDate,
    totalOrders: pressing.totalOrders || 0
  }));
  
  const [filteredFavorites, setFilteredFavorites] = useState<FavoritePressing[]>([]);

  const [filterBy, setFilterBy] = React.useState('all');

  const handleRemoveFavorite = async (id: string) => {
    try {
      const result = await toggleFavorite(id).unwrap();
      
      if (result.success) {
        toast.success(' Pressing retiré des favoris');
        refetch(); // Recharger la liste des favoris
      } else {
        toast.error(' Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression favori:', error);
      toast.error(' Erreur lors de la suppression du favori');
    }
  };

  const getSortedFavorites = () => {
    const filtered = favorites.filter((pressing: FavoritePressing) =>
      pressing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pressing.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a: FavoritePressing, b: FavoritePressing) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'lastOrder':
          if (!a.lastOrderDate) return 1;
          if (!b.lastOrderDate) return -1;
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        default: // name
          return a.name.localeCompare(b.name);
      }
    });
  };

  const sortedFavorites = getSortedFavorites();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Heart className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-semibold text-gray-900">Mes Favoris</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              {favorites.length} pressing{favorites.length > 1 ? 's' : ''} favori{favorites.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">{favorites.length}</div>
            <div className="text-sm text-gray-600">Pressings favoris</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {favorites.reduce((sum, f) => sum + f.totalOrders, 0)}
            </div>
            <div className="text-sm text-gray-600">Commandes totales</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {(favorites.reduce((sum, f) => sum + f.rating, 0) / favorites.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Note moyenne</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {favorites.filter(f => f.lastOrderDate && 
                new Date(f.lastOrderDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div className="text-sm text-gray-600">Utilisés ce mois</div>
          </div>
        </div>

        {/* Filtres et tri */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les favoris</option>
                  <option value="recent">Utilisés récemment</option>
                  <option value="frequent">Fréquemment utilisés</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Ajoutés récemment</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Note</option>
                  <option value="orders">Nombre de commandes</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {sortedFavorites.length} résultat{sortedFavorites.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des favoris */}
        {sortedFavorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterBy === 'all' ? 'Aucun favori' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterBy === 'all' 
                ? 'Ajoutez vos pressings préférés à vos favoris pour les retrouver facilement'
                : 'Aucun pressing ne correspond à vos critères de filtrage'
              }
            </p>
            {filterBy !== 'all' && (
              <button
                onClick={() => setFilterBy('all')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir tous les favoris
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedFavorites.map((pressing) => (
              <div
                key={pressing.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image et badge favori */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={pressing.image}
                    alt={pressing.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleRemoveFavorite(pressing.id)}
                      disabled={loading}
                      className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-white transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                      {pressing.totalOrders} commande{pressing.totalOrders > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {pressing.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{pressing.neighborhood} • {pressing.distance} km</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">
                        {pressing.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({pressing.reviewCount})
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{pressing.address}</p>

                  {/* Services */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pressing.services.slice(0, 3).map((service, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                    {pressing.services.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{pressing.services.length - 3} autres
                      </span>
                    )}
                  </div>

                  {/* Informations pratiques */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{pressing.openingHours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{pressing.phone}</span>
                    </div>
                  </div>

                  {/* Prix et dernière commande */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="font-medium text-gray-900">{pressing.priceRange}</span>
                    {pressing.lastOrderDate && (
                      <span className="text-gray-500">
                        Dernière commande : {new Date(pressing.lastOrderDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Commander
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(pressing.id)}
                      disabled={loading}
                      className="flex items-center justify-center bg-gray-100 text-gray-500 hover:text-red-600 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {favorites.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">💡 Suggestions basées sur vos favoris</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Pressings similaires</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Découvrez d'autres pressings dans vos quartiers préférés avec des services similaires.
                </p>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Voir les suggestions →
                </button>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⭐ Offres exclusives</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Profitez d'offres spéciales chez vos pressings favoris.
                </p>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Voir les offres →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
