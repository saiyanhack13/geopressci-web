import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyGetNearbyPressingsQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Search, 
  Filter, 
  Grid, 
  List, 
  ArrowLeft,
  Navigation,
  Heart,
  Eye,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Award,
  Users,
  Zap,
  X
} from 'lucide-react';

interface PressingFilters {
  neighborhood: string;
  minRating: number;
  maxDistance: number;
  services: string[];
  priceRange: 'all' | 'low' | 'medium' | 'high';
  openNow: boolean;
}

interface Pressing {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  phone: string;
  rating: number;
  reviewCount: number;
  distance: number;
  services: string[];
  priceRange: string;
  openingHours: string;
  isOpen: boolean;
  image: string;
  specialOffers: string[];
  deliveryAvailable: boolean;
}

interface PressingData {
  id?: string;
  _id?: string;
  businessName?: string;
  name?: string;
  nom?: string;
  prenom?: string;
  address?: {
    street?: string;
    city?: string;
  };
  phone?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    coordinates?: [number, number];
  };
  services?: string[];
  businessHours?: Array<{open: string; close: string}>;
  coverImage?: string;
  specialOffers?: string[];
  deliveryZones?: unknown[];
}

const PressingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filters, setFilters] = useState<PressingFilters>({
    neighborhood: '',
    minRating: 0,
    maxDistance: 10,
    services: [],
    priceRange: 'all',
    openNow: false
  });

  // Hook API pour récupérer les pressings
  const [getNearbyPressings, { 
    data: pressingsData, 
    isLoading, 
    error 
  }] = useLazyGetNearbyPressingsQuery();

  // Transformation des données backend
  const pressings = useMemo(() => {
    if (!pressingsData) return [] as Pressing[];
    
    return pressingsData.map((pressing: any) => {
      // Si les données viennent directement de l'API avec le type Pressing
      if (typeof pressing.address === 'string') {
        return {
          ...pressing,
          id: pressing.id || pressing._id || '',
          name: pressing.businessName || pressing.name || 'Pressing sans nom',
          address: pressing.address || 'Adresse non disponible',
          neighborhood: pressing.neighborhood || 'Quartier non spécifié',
          phone: pressing.phone || 'Non renseigné',
          rating: pressing.rating || 4.0 + Math.random(),
          reviewCount: pressing.reviewCount || Math.floor(Math.random() * 100) + 10,
          distance: currentLocation && pressing.location?.coordinates ? 
            calculateDistance(
              currentLocation.lat, 
              currentLocation.lng, 
              pressing.location.coordinates[1],
              pressing.location.coordinates[0]
            ) : Math.random() * 10 + 1,
          services: pressing.services || ['Nettoyage à sec', 'Repassage'],
          priceRange: pressing.priceRange || ['€', '€€', '€€€'][Math.floor(Math.random() * 3)],
          openingHours: pressing.openingHours || '8h-18h',
          isOpen: pressing.isOpen ?? true,
          image: pressing.image || pressing.coverImage || '/api/placeholder/300/200',
          specialOffers: pressing.specialOffers || [],
          deliveryAvailable: pressing.deliveryAvailable ?? false
        };
      }
      
      // Si les données ont une structure PressingData (address comme objet)
      const fullAddress = pressing.address && typeof pressing.address === 'object' ? 
        `${pressing.address.street || ''}, ${pressing.address.city || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Adresse non disponible'
        : pressing.address || 'Adresse non disponible';
      
      return {
        id: pressing.id || pressing._id || '',
        name: pressing.businessName || pressing.name || `${pressing.nom || ''} ${pressing.prenom || ''}`.trim() || 'Pressing sans nom',
        address: fullAddress,
        neighborhood: pressing.address?.city || pressing.neighborhood || 'Quartier non spécifié',
        phone: pressing.phone || 'Non renseigné',
        rating: pressing.rating || 4.0 + Math.random(),
        reviewCount: pressing.reviewCount || Math.floor(Math.random() * 100) + 10,
        distance: currentLocation && pressing.location?.coordinates ? 
          calculateDistance(
            currentLocation.lat, 
            currentLocation.lng, 
            pressing.location.coordinates[1] || 5.3364,
            pressing.location.coordinates[0] || -4.0267
          ) : Math.random() * 10 + 1,
        services: pressing.services || ['Nettoyage à sec', 'Repassage'],
        priceRange: pressing.priceRange || ['€', '€€', '€€€'][Math.floor(Math.random() * 3)],
        openingHours: pressing.businessHours?.[0] ? 
          `${pressing.businessHours[0].open}-${pressing.businessHours[0].close}` : 
          pressing.openingHours || '8h-18h',
        isOpen: pressing.isOpen ?? true,
        image: pressing.image || pressing.coverImage || '/api/placeholder/300/200',
        specialOffers: pressing.specialOffers || [],
        deliveryAvailable: pressing.deliveryAvailable ?? ((pressing.deliveryZones && pressing.deliveryZones.length > 0) || false)
      };
    });
  }, [pressingsData, currentLocation]);

  // Filtrage des pressings
  const filteredPressings = useMemo(() => {
    return pressings.filter(pressing => {
      const matchesSearch = !searchQuery || 
        pressing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pressing.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesNeighborhood = !filters.neighborhood || 
        pressing.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase());
      
      const matchesRating = pressing.rating >= filters.minRating;
      const matchesDistance = pressing.distance <= filters.maxDistance;
      const matchesOpenNow = !filters.openNow || pressing.isOpen;
      
      return matchesSearch && matchesNeighborhood && matchesRating && matchesDistance && matchesOpenNow;
    });
  }, [pressings, searchQuery, filters]);

  // Fonction utilitaire pour calculer la distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Géolocalisation
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Charger les pressings à proximité
          getNearbyPressings({
            location: { lat: latitude, lng: longitude },
            radius: filters.maxDistance
          }).catch(console.error);
          
          toast.success('📍 Position détectée ! Pressings chargés');
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          toast.error('Impossible d\'obtenir votre position');
        }
      );
    } else {
      toast.error('Géolocalisation non supportée');
    }
  };

  // Chargement initial
  useEffect(() => {
    // Charger les pressings par défaut (Abidjan)
    getNearbyPressings({
      location: { lat: 5.3364, lng: -4.0267 }, // Abidjan
      radius: 20
    }).catch(console.error);
  }, [getNearbyPressings]);

  // Gestion des erreurs - UI/UX 2025
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <div className="text-red-500 text-2xl sm:text-3xl">⚠️</div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight">
            Erreur de chargement
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            Impossible de charger les pressings. Vérifiez votre connexion internet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl min-h-[44px] touch-target"
            aria-label="Réessayer le chargement"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - UI/UX 2025 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Retour à la page précédente"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
                  Tous les Pressings 🏪
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Chargement...
                    </span>
                  ) : (
                    <>
                      {filteredPressings.length} pressing{filteredPressings.length > 1 ? 's' : ''} 
                      {filteredPressings.length > 1 ? ' trouvés' : ' trouvé'}
                      {currentLocation && ' près de vous'}
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all duration-200 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Basculer en vue ${viewMode === 'grid' ? 'liste' : 'grille'}`}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4 sm:h-5 sm:w-5" /> : <Grid className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Barre de recherche et filtres - UI/UX 2025 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 mobile-card">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche améliorée */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un pressing ou un quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base min-h-[44px] mobile-input"
                aria-label="Rechercher un pressing ou un quartier"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors touch-target"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Boutons d'action améliorés */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleGetLocation}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target min-h-[44px] text-sm sm:text-base"
                aria-label="Détecter ma position actuelle"
              >
                <Navigation className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline font-medium">
                  {currentLocation ? '📍 Position' : 'Ma position'}
                </span>
                <span className="sm:hidden font-medium">📍</span>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 border rounded-xl transition-all duration-200 touch-target min-h-[44px] text-sm sm:text-base ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
                aria-label={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline font-medium">Filtres</span>
                <span className="sm:hidden font-medium">🔧</span>
              </button>
            </div>
          </div>
          
          {/* Filtres avancés - UI/UX 2025 */}
          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="distance-filter">
                    📏 Distance max
                  </label>
                  <select
                    id="distance-filter"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({...filters, maxDistance: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-h-[44px] bg-white"
                    aria-label="Sélectionner la distance maximale"
                  >
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="rating-filter">
                    ⭐ Note minimum
                  </label>
                  <select
                    id="rating-filter"
                    value={filters.minRating}
                    onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-h-[44px] bg-white"
                    aria-label="Sélectionner la note minimale"
                  >
                    <option value={0}>Toutes les notes</option>
                    <option value={3}>3+ ⭐</option>
                    <option value={4}>4+ ⭐</option>
                    <option value={4.5}>4.5+ ⭐</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="neighborhood-filter">
                    🏘️ Quartier
                  </label>
                  <input
                    id="neighborhood-filter"
                    type="text"
                    placeholder="Ex: Cocody, Plateau..."
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({...filters, neighborhood: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm min-h-[44px] mobile-input"
                    aria-label="Filtrer par quartier"
                  />
                </div>
                
                <div className="flex items-center justify-center sm:justify-start">
                  <label className="flex items-center gap-3 cursor-pointer touch-target p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.openNow}
                      onChange={(e) => setFilters({...filters, openNow: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      aria-describedby="open-now-desc"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">🕐 Ouvert maintenant</span>
                      <p id="open-now-desc" className="text-xs text-gray-500 mt-1">Afficher seulement les pressings ouverts</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Bouton reset filtres */}
              <div className="mt-4 sm:mt-6 flex justify-center">
                <button
                  onClick={() => {
                    setFilters({
                      neighborhood: '',
                      minRating: 0,
                      maxDistance: 10,
                      services: [],
                      priceRange: 'all',
                      openNow: false
                    });
                    toast.success('🔄 Filtres réinitialisés');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-target"
                  aria-label="Réinitialiser tous les filtres"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skeleton loaders - UI/UX 2025 */}
        {isLoading && (
          <div className="space-y-6">
            {/* Skeleton header */}
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Chargement des pressings...
                </h3>
                <p className="text-sm text-gray-600">Recherche des meilleurs pressings près de vous</p>
              </div>
            </div>
            
            {/* Skeleton cards */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  {/* Skeleton image */}
                  <div className="h-48 bg-gray-200"></div>
                  
                  {/* Skeleton content */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-lg w-16"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded-lg w-20"></div>
                      <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des pressings - UI/UX 2025 */}
        {!isLoading && (
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {filteredPressings.map((pressing) => (
              <article
                key={pressing.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group mobile-card"
                onClick={() => navigate(`/client/pressing/${pressing.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Voir les détails de ${pressing.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/client/pressing/${pressing.id}`);
                  }
                }}
              >
                {/* Image améliorée */}
                <div className="relative h-48 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <img
                    src={pressing.image}
                    alt={`Photo de ${pressing.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/300/200';
                    }}
                    loading="lazy"
                  />
                  
                  {/* Badges et indicateurs */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {pressing.specialOffers.length > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                        🎁 Offre spéciale
                      </div>
                    )}
                    {pressing.deliveryAvailable && (
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        🚚 Livraison
                      </div>
                    )}
                  </div>
                  
                  {/* Bouton favoris amélioré */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success('❤️ Ajouté aux favoris !', {
                        duration: 2000,
                        position: 'top-center'
                      });
                    }}
                    className="absolute top-3 right-3 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center group/heart"
                    aria-label={`Ajouter ${pressing.name} aux favoris`}
                  >
                    <Heart className="h-4 w-4 text-gray-600 group-hover/heart:text-red-500 group-hover/heart:scale-110 transition-all duration-200" />
                  </button>
                  
                  {/* Indicateur de statut - Toujours ouvert */}
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Ouvert 6h-20h
                    </div>
                  </div>
                </div>
                
                {/* Contenu amélioré */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                        {pressing.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {pressing.neighborhood}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold text-sm text-yellow-700">{(typeof pressing.rating === 'object' ? (pressing.rating as any)?.average || 0 : pressing.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-yellow-600">({pressing.reviewCount})</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <span className="line-clamp-2 leading-relaxed">{pressing.address}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                            📏 {pressing.distance.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Clock className="h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="font-medium">{pressing.openingHours}</span>
                      {pressing.isOpen && (
                        <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full text-xs">
                          • Ouvert maintenant
                        </span>
                      )}
                    </div>
                    
                    {pressing.phone !== 'Non renseigné' && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="h-4 w-4 flex-shrink-0 text-purple-500" />
                        <a 
                          href={`tel:${pressing.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:text-purple-600 transition-colors"
                          aria-label={`Appeler ${pressing.name}`}
                        >
                          {pressing.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Services améliorés */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Services disponibles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pressing.services.slice(0, 3).map((service: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                        >
                          {service}
                        </span>
                      ))}
                      {pressing.services.length > 3 && (
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-200 transition-colors">
                          +{pressing.services.length - 3} autres
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions améliorées */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900">
                          {pressing.priceRange}
                        </span>
                        <span className="text-xs text-gray-500">prix</span>
                      </div>
                      {pressing.deliveryAvailable && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                          <Zap className="h-3 w-3" />
                          <span>Livraison</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/client/pressing/${pressing.id}`);
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg touch-target min-h-[44px]"
                      aria-label={`Voir les détails de ${pressing.name}`}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Voir détails</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* État vide - UI/UX 2025 */}
        {!isLoading && filteredPressings.length === 0 && (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="max-w-md mx-auto px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <div className="text-blue-500 text-3xl sm:text-4xl">🔍</div>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Aucun pressing trouvé
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Nous n'avons pas trouvé de pressing correspondant à vos critères.
                <br className="hidden sm:block" />
                Essayez de modifier votre recherche ou vos filtres.
              </p>
              
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      neighborhood: '',
                      minRating: 0,
                      maxDistance: 10,
                      services: [],
                      priceRange: 'all',
                      openNow: false
                    });
                    toast.success('🔄 Filtres réinitialisés');
                  }}
                  className="bg-blue-600 text-white px-6 py-3 sm:py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl touch-target min-h-[44px] text-sm sm:text-base"
                  aria-label="Réinitialiser tous les filtres de recherche"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Réinitialiser les filtres
                </button>
                
                <button
                  onClick={handleGetLocation}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 sm:py-4 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-target min-h-[44px] text-sm sm:text-base"
                  aria-label="Utiliser ma position pour trouver des pressings à proximité"
                >
                  <Navigation className="w-4 h-4 mr-2 inline" />
                  Utiliser ma position
                </button>
              </div>
              
              <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                  💡 Suggestions
                </h4>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-1 text-left">
                  <li>• Élargissez la distance de recherche</li>
                  <li>• Supprimez certains filtres actifs</li>
                  <li>• Essayez un autre quartier</li>
                  <li>• Vérifiez l'orthographe de votre recherche</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PressingListPage;
