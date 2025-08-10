import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyGetNearbyPressingsQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  Filter, 
  Grid, 
  List, 
  Search, 
  Star, 
  Clock, 
  Heart,
  Navigation,
  Phone,
  ChevronDown,
  ChevronUp,
  X,
  Crosshair,
  Wifi,
  WifiOff
} from 'lucide-react';

// Types
import { ExtendedPressing, SortOption } from '../../types/search';
import { AbidjanNeighborhood, PressingServiceCategory } from '../../types/index';

// Components
import SearchBar from '../../components/search/SearchBar';
import { default as SearchFiltersComponent, SearchFiltersState } from '../../components/search/SearchFilters';
import { PressingList } from '../../components/pressing';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/card';

// Types pour l'état de recherche
interface SearchState {
  query: string;
  filters: SearchFiltersState;
  sortBy: SortOption['value'];
  viewMode: 'list' | 'grid' | 'map';
  isFiltersOpen: boolean;
  userPosition: [number, number] | null;
  isLocationLoading: boolean;
  locationError: string | null;
  isOnline: boolean;
  favorites: string[];
  searchHistory: string[];
  results: ExtendedPressing[];
  isLoading: boolean;
}

// Actions pour le reducer
type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFiltersState> }
  | { type: 'SET_SORT'; payload: SortOption['value'] }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' | 'map' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_USER_POSITION'; payload: [number, number] | null }
  | { type: 'SET_LOCATION_LOADING'; payload: boolean }
  | { type: 'SET_LOCATION_ERROR'; payload: string | null }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'SET_RESULTS'; payload: ExtendedPressing[] }
  | { type: 'SET_LOADING'; payload: boolean };

// État initial
const initialState: SearchState = {
  query: '',
  filters: {
    neighborhoods: [],
    services: [],
    priceRange: 'all',
    rating: 0,
    distance: 10,
    openNow: false,
    deliveryType: 'all',
  },
  sortBy: 'relevance',
  viewMode: 'list',
  isFiltersOpen: false,
  userPosition: null,
  isLocationLoading: false,
  locationError: null,
  isOnline: navigator.onLine,
  favorites: JSON.parse(localStorage.getItem('pressing-favorites') || '[]'),
  searchHistory: JSON.parse(localStorage.getItem('pressing-search-history') || '[]'),
  results: [],
  isLoading: false,
};

// Reducer
const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'TOGGLE_FILTERS':
      return { ...state, isFiltersOpen: !state.isFiltersOpen };
    case 'SET_USER_POSITION':
      return { ...state, userPosition: action.payload };
    case 'SET_LOCATION_LOADING':
      return { ...state, isLocationLoading: action.payload };
    case 'SET_LOCATION_ERROR':
      return { ...state, locationError: action.payload };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'TOGGLE_FAVORITE':
      const favorites = state.favorites.includes(action.payload)
        ? state.favorites.filter(id => id !== action.payload)
        : [...state.favorites, action.payload];
      localStorage.setItem('pressing-favorites', JSON.stringify(favorites));
      return { ...state, favorites };
    case 'ADD_TO_HISTORY':
      const history = [action.payload, ...state.searchHistory.filter(h => h !== action.payload)].slice(0, 10);
      localStorage.setItem('pressing-search-history', JSON.stringify(history));
      return { ...state, searchHistory: history };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Quartiers d'Abidjan pour la recherche
const ABIDJAN_NEIGHBORHOODS = [
  'Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Treichville',
  'Adjamé', 'Abobo', 'Koumassi', 'Port-Bouët', 'Attécoubé',
  'Bingerville', 'Anyama', 'Songon'
];

// Transformation des données API vers ExtendedPressing
const transformPressingData = (pressing: any): ExtendedPressing => ({
  id: pressing.id || '1',
  nom: pressing.nom || 'Pressing',
  prenom: pressing.prenom || 'Propriétaire',
  email: pressing.email || 'contact@pressing.ci',
  telephone: pressing.telephone || '+225 07 00 00 00 00',
  businessName: pressing.businessName || pressing.nomCommerce || pressing.nom || 'Pressing',
  businessInfo: pressing.businessInfo || {},
  role: 'pressing',
  services: pressing.services || [],
  openingHours: pressing.horaires || [
    { day: 'monday', open: '08:00', close: '18:00' },
    { day: 'tuesday', open: '08:00', close: '18:00' },
    { day: 'wednesday', open: '08:00', close: '18:00' },
    { day: 'thursday', open: '08:00', close: '18:00' },
    { day: 'friday', open: '08:00', close: '18:00' },
    { day: 'saturday', open: '08:00', close: '16:00' },
    { day: 'sunday', open: '00:00', close: '00:00' }
  ],
  rating: pressing.note || 4.5,
  photos: pressing.photos || [],
  subscription: {
    plan: pressing.subscription?.plan || 'basic',
    status: pressing.subscription?.status || 'active',
    endDate: pressing.subscription?.endDate || ''
  },
  verification: {
    status: pressing.verification?.status || 'approved',
    documentUrl: pressing.verification?.documentUrl,
    rejectionReason: pressing.verification?.rejectionReason
  },
  priceRange: pressing.priceRange || 'medium',
  deliveryTime: pressing.deliveryTime || '24h',
  distance: 0,
  isOpen: pressing.isOpen || true,
  location: { 
    coordinates: pressing.adresse?.localisation?.coordinates || [5.3599, -3.9826],
    type: 'Point'
  },
  name: pressing.nomCommerce || pressing.businessName || pressing.nom || 'Pressing',
  estimatedDeliveryTime: pressing.estimatedDeliveryTime || '24h',
  promotions: pressing.promotions || [],
  badges: pressing.badges || [],
  address: pressing.adresse?.rue || pressing.adresse || 'Adresse non disponible'
});

// Les données sont maintenant chargées directement depuis l'API backend

const PressingPage: React.FC = () => {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const navigate = useNavigate();
  
  // API hooks pour les pressings
  const [getNearbyPressings, { 
    data: nearbyPressingsData, 
    isLoading: nearbyLoading, 
    error: nearbyError 
  }] = useLazyGetNearbyPressingsQuery();

  // Géolocalisation
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_LOCATION_ERROR', payload: '❌ Géolocalisation non supportée par votre navigateur' });
      return;
    }

    dispatch({ type: 'SET_LOCATION_LOADING', payload: true });
    dispatch({ type: 'SET_LOCATION_ERROR', payload: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        dispatch({ type: 'SET_USER_POSITION', payload: [latitude, longitude] });
        dispatch({ type: 'SET_LOCATION_LOADING', payload: false });
        toast.success('📍 Position détectée avec succès !');
      },
      (error) => {
        let errorMessage = '❌ Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Permission de géolocalisation refusée. Activez la localisation dans votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Position non disponible. Vérifiez votre connexion GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = '⏱️ Délai de géolocalisation dépassé. Réessayez.';
            break;
        }
        dispatch({ type: 'SET_LOCATION_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_LOCATION_LOADING', payload: false });
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  // Gestion du statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Chargement des pressings proches via API
  const loadNearbyPressings = useCallback(async (lat?: number, lng?: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const params = {
        location: {
          lat: lat || state.userPosition?.[0] || 5.3364, // Abidjan par défaut
          lng: lng || state.userPosition?.[1] || -4.0267
        },
        radius: state.filters.distance || 10
      };
      
      const result = await getNearbyPressings(params).unwrap();
      const backendPressings = result || [];
      
      // Transformation des données backend vers ExtendedPressing
      const transformedPressings: ExtendedPressing[] = backendPressings.map((pressing: any) => 
        transformPressingData(pressing)
      );
      
      dispatch({ type: 'SET_RESULTS', payload: transformedPressings });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (transformedPressings.length === 0) {
        toast('📍 Aucun pressing trouvé dans cette zone');
      } else {
        toast.success(`🎯 ${transformedPressings.length} pressing${transformedPressings.length > 1 ? 's' : ''} trouvé${transformedPressings.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pressings:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('❌ Erreur lors du chargement des pressings');
    }
  }, [getNearbyPressings, state.userPosition, state.filters.distance]);
  
  // Initialisation et rechargement des données
  useEffect(() => {
    // Chargement initial avec position par défaut d'Abidjan
    loadNearbyPressings();
  }, []);
  
  // Rechargement quand la position utilisateur change
  useEffect(() => {
    if (state.userPosition) {
      loadNearbyPressings(state.userPosition[0], state.userPosition[1]);
    }
  }, [state.userPosition, loadNearbyPressings]);
  
  // Rechargement quand les filtres changent
  useEffect(() => {
    if (state.userPosition || state.results.length > 0) {
      loadNearbyPressings();
    }
  }, [state.filters.distance, loadNearbyPressings]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
    if (query.trim()) {
      dispatch({ type: 'ADD_TO_HISTORY', payload: query.trim() });
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: SearchFiltersState) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  }, []);

  const handlePressingSelect = useCallback((pressing: ExtendedPressing) => {
    navigate(`/pressing-detail/${pressing.id}`);
  }, [navigate]);

  const handleGetDirections = useCallback((pressing: ExtendedPressing) => {
    if (state.userPosition && pressing.location) {
      const [userLat, userLng] = state.userPosition;
      const { coordinates } = pressing.location;
      // Utiliser Mapbox pour les directions (plus précis pour l'Afrique)
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${coordinates[0]},${coordinates[1]}?geometries=geojson&access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWUzOTVnc2wwNTVsMmxzZTF1Zm13ZWVjIn0.o48XqkHK-s4jF4qLzLKRQ'}`;
      // Fallback vers OpenStreetMap si Mapbox n'est pas disponible
      const fallbackUrl = `https://www.openstreetmap.org/directions?from=${userLat},${userLng}&to=${coordinates[1]},${coordinates[0]}&route=foot#map=15/${coordinates[1]}/${coordinates[0]}`;
      
      try {
        window.open(url, '_blank');
      } catch (error) {
        console.warn('Mapbox indisponible, utilisation d\'OpenStreetMap:', error);
        window.open(fallbackUrl, '_blank');
      }
    } else {
      toast.error('Position utilisateur non disponible');
    }
  }, [state.userPosition]);

  const handleToggleFavorite = useCallback((pressingId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: pressingId });
    const isFavorite = state.favorites.includes(pressingId);
    toast.success(isFavorite ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris');
  }, [state.favorites]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec gradient ivoirien */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Titre et indicateur de statut */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                🏪 Pressings à Abidjan
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Trouvez le pressing parfait près de chez vous
              </p>
            </div>
            
            {/* Indicateur de statut */}
            <div className="flex items-center space-x-4 mt-3 sm:mt-0">
              <div className="flex items-center space-x-2">
                {state.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${
                  state.isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {state.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              
              {state.userPosition && (
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-blue-600">
                  <MapPin className="w-4 h-4" />
                  <span>Position détectée</span>
                </div>
              )}
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mb-4">
            <SearchBar
              value={state.query}
              onChange={(value) => dispatch({ type: 'SET_QUERY', payload: value })}
              onSearch={handleSearch}
              onSuggestionSelect={(suggestion) => {
                // Handle suggestion selection
                if (suggestion.type === 'pressing') {
                  // Navigate to pressing details
                } else if (suggestion.type === 'neighborhood') {
                  // Filter by neighborhood
                } else if (suggestion.type === 'service') {
                  // Filter by service
                }
              }}
              placeholder="Rechercher un pressing, quartier, service..."
              recentSearches={state.searchHistory}
            />
          </div>

          {/* Contrôles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Boutons de contrôle */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
                {state.isFiltersOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentPosition}
                disabled={state.isLocationLoading}
                className="flex items-center space-x-2"
              >
                <Crosshair className={`w-4 h-4 ${state.isLocationLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Ma position</span>
              </Button>
            </div>

            {/* Modes d'affichage */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-white rounded-lg border p-1">
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
                  className={`p-2 rounded ${
                    state.viewMode === 'list'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
                  className={`p-2 rounded ${
                    state.viewMode === 'grid'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de filtres */}
      {state.isFiltersOpen && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <SearchFiltersComponent
              filters={state.filters}
              onFiltersChange={handleFilterChange}
              resultsCount={state.results.length}
              isLoading={state.isLoading}
            />
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Statistiques rapides */}
        <div className="mb-6">
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-orange-600">
                    {state.results.length}
                  </span>
                  {' '}pressing{state.results.length > 1 ? 's' : ''} trouvé{state.results.length > 1 ? 's' : ''}
                </div>
                {state.userPosition && (
                  <div className="text-sm text-blue-600">
                    📍 Position activée
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Trier par:</span>
                <select
                  value={state.sortBy}
                  onChange={(e) => dispatch({ type: 'SET_SORT', payload: e.target.value as SortOption['value'] })}
                  className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="relevance">Pertinence</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Note</option>
                  <option value="price">Prix</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Résultats */}
        <PressingList
          pressings={state.results}
          isLoading={state.isLoading}
          userPosition={state.userPosition}
          onPressingSelect={handlePressingSelect}
          onGetDirections={handleGetDirections}
          onToggleFavorite={handleToggleFavorite}
          onCall={(pressing) => {
            if (pressing.telephone) {
              window.open(`tel:${pressing.telephone}`, '_self');
            }
          }}
          favorites={state.favorites}
          viewMode={state.viewMode === 'map' ? 'list' : state.viewMode}
          showDistance={!!state.userPosition}
          emptyMessage="Aucun pressing trouvé dans cette zone"
          emptyIcon={<div className="text-6xl">🏪</div>}
        />
      </div>
    </div>
  );
};

export default PressingPage;
