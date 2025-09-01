// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { PressingServiceCategory } from '../../types';
import { useLazyGetNearbyPressingsQuery, useGetPressingByIdQuery } from '../../services/api';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Navigation, 
  X,
  Crosshair,
  RotateCcw,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  Sliders,
  Map,
  List,
  Loader,
  Wifi,
  WifiOff,
  RefreshCw,
  Heart,
  Share2,
  Info,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  SlidersHorizontal,
  Target,
  Zap,
  Award,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Satellite
} from 'lucide-react';
import { toast } from 'react-hot-toast';
// Migration vers Mapbox - Suppression des imports Leaflet
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import * as L from 'leaflet';
// const divIcon = L.divIcon;
// import 'leaflet/dist/leaflet.css';

// Import des composants Mapbox
import MapboxMap from '../../components/MapboxMap';
import MapboxGeolocationButton from '../../components/geolocation/MapboxGeolocationButton';
import useMapboxGeolocation, { MapboxGeolocationPosition } from '../../hooks/useMapboxGeolocation';
import MapboxMapView from '../../components/map/MapboxMapView';

// Import du service de géolocalisation forcée
import ForcedGeolocationButton from '../../components/geolocation/ForcedGeolocationButton';
import { ForcedGeolocationPosition } from '../../hooks/useForcedGeolocation';

// Import des types
import { AbidjanNeighborhood } from '../../types';
import { ExtendedPressing, SortOption, SearchAction } from '../../types/search';
import { Breadcrumbs } from '../../components/navigation/Breadcrumbs';
import RouteDisplay from '../../components/map/RouteDisplay';

// Type local pour SearchPage
type SearchFilters = {
  neighborhoods: string[];
  services: string[];
  priceRange: [number, number];
  distanceRange: [number, number];
  rating: number;
  openNow: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  isOpen?: boolean; // Propriété optionnelle pour compatibilité
  distance?: number; // Propriété distance pour les filtres
};

// Type local pour SearchState
type SearchState = {
  query: string;
  results: ExtendedPressing[];
  filteredResults: ExtendedPressing[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  sortBy: SortOption;
  viewMode: 'list' | 'map';
  userPosition: [number, number] | null;
  favorites: string[];
  recentSearches: string[];
  isOnline: boolean;
  selectedPressing: ExtendedPressing | null;
  lastSearchTime: number;
};

// Options de tri
const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Pertinence', icon: <Search className="w-4 h-4" />, description: 'Meilleurs résultats' },
  { value: 'distance', label: 'Distance', icon: <MapPin className="w-4 h-4" />, description: 'Plus proches' },
  { value: 'rating', label: 'Note', icon: <Star className="w-4 h-4" />, description: 'Mieux notés' },
  { value: 'price', label: 'Prix', icon: <DollarSign className="w-4 h-4" />, description: 'Moins chers' },
  { value: 'newest', label: 'Nouveautés', icon: <TrendingUp className="w-4 h-4" />, description: 'Plus récents' },
  { value: 'popular', label: 'Popularité', icon: <Users className="w-4 h-4" />, description: 'Plus demandés' }
];

// Quartiers d'Abidjan avec coordonnées précises
const ABIDJAN_NEIGHBORHOODS = [
  { value: 'Cocody', label: 'Cocody 🏙️', emoji: '🏙️', description: 'Quartier résidentiel moderne', lat: 5.3447, lng: -3.9875, bounds: { north: 5.37, south: 5.32, east: -3.95, west: -4.02 } },
  { value: 'Plateau', label: 'Plateau 🏢', emoji: '🏢', description: 'Centre des affaires', lat: 5.3196, lng: -4.0083, bounds: { north: 5.33, south: 5.31, east: -4.00, west: -4.02 } },
  { value: 'Yopougon', label: 'Yopougon 🏘️', emoji: '🏘️', description: 'Grande commune populaire', lat: 5.3364, lng: -4.0889, bounds: { north: 5.36, south: 5.31, east: -4.05, west: -4.12 } },
  { value: 'Adjamé', label: 'Adjamé 🛒', emoji: '🛒', description: 'Centre commercial traditionnel', lat: 5.3608, lng: -4.0239, bounds: { north: 5.37, south: 5.35, east: -4.01, west: -4.04 } },
  { value: 'Treichville', label: 'Treichville 🎭', emoji: '🎭', description: 'Quartier culturel animé', lat: 5.2947, lng: -4.0081, bounds: { north: 5.31, south: 5.28, east: -3.99, west: -4.03 } },
  { value: 'Marcory', label: 'Marcory 🌊', emoji: '🌊', description: 'Zone industrielle et résidentielle', lat: 5.2833, lng: -3.9833, bounds: { north: 5.30, south: 5.26, east: -3.96, west: -4.01 } },
  { value: 'Koumassi', label: 'Koumassi 🏭', emoji: '🏭', description: 'Zone industrielle', lat: 5.2889, lng: -3.9444, bounds: { north: 5.31, south: 5.27, east: -3.92, west: -3.97 } },
  { value: 'Port-Bouët', label: 'Port-Bouët ✈️', emoji: '✈️', description: 'Proche de l\'aéroport', lat: 5.2361, lng: -3.9306, bounds: { north: 5.26, south: 5.21, east: -3.90, west: -3.96 } },
  { value: 'Attécoubé', label: 'Attécoubé 🌳', emoji: '🌳', description: 'Quartier verdoyant', lat: 5.3500, lng: -4.0500, bounds: { north: 5.37, south: 5.33, east: -4.03, west: -4.07 } },
  { value: 'Abobo', label: 'Abobo 🏠', emoji: '🏠', description: 'Grande commune nord', lat: 5.4167, lng: -4.0167, bounds: { north: 5.45, south: 5.38, east: -3.99, west: -4.05 } },
  { value: 'Bingerville', label: 'Bingerville 🌺', emoji: '🌺', description: 'Ancienne capitale', lat: 5.3500, lng: -3.8833, bounds: { north: 5.37, south: 5.33, east: -3.86, west: -3.91 } },
  { value: 'Anyama', label: 'Anyama 🌿', emoji: '🌿', description: 'Commune périphérique', lat: 5.4833, lng: -4.0500, bounds: { north: 5.51, south: 5.46, east: -4.03, west: -4.07 } },
  { value: 'Songon', label: 'Songon 🌾', emoji: '🌾', description: 'Zone rurale proche', lat: 5.3000, lng: -4.2500, bounds: { north: 5.33, south: 5.27, east: -4.23, west: -4.27 } }
];

// Services de pressing avec emojis
const PRESSING_SERVICES: { value: PressingServiceCategory; label: string; emoji: string; description: string }[] = [
  { value: PressingServiceCategory.NETTOYAGE_SEC, label: 'Nettoyage à sec', emoji: '🧽', description: 'Vêtements délicats' },
  { value: PressingServiceCategory.LAVAGE, label: 'Lavage', emoji: '🫧', description: 'Lavage classique' },
  { value: PressingServiceCategory.REPASSAGE, label: 'Repassage', emoji: '👔', description: 'Repassage professionnel' },
  { value: PressingServiceCategory.RETOUCHE, label: 'Retouches', emoji: '✂️', description: 'Ajustements et réparations' }
];

// État initial
const initialState: SearchState = {
  query: '',
  results: [],
  filteredResults: [],
  isLoading: false,
  error: null,
  filters: {
    neighborhoods: [],
    services: [],
    priceRange: [500, 10000],
    distanceRange: [0, 50],
    rating: 0,
    openNow: false,
    hasDelivery: false,
    hasPickup: false
  },
  sortBy: SORT_OPTIONS[0],
  viewMode: 'list',
  userPosition: null,
  favorites: JSON.parse(localStorage.getItem('pressing-favorites') || '[]'),
  recentSearches: JSON.parse(localStorage.getItem('pressing-searches') || '[]'),
  isOnline: navigator.onLine,
  selectedPressing: null,
  lastSearchTime: 0
};

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

// Fonction pour détecter le quartier depuis les coordonnées
const getNeighborhoodFromCoordinates = (lat: number, lng: number): string => {
  for (const neighborhood of ABIDJAN_NEIGHBORHOODS) {
    const { bounds } = neighborhood;
    if (lat >= bounds.south && lat <= bounds.north && 
        lng >= bounds.west && lng <= bounds.east) {
      return neighborhood.value;
    }
  }
  return 'Autre'; // Si pas dans les quartiers définis
};

// Fonction pour obtenir la géolocalisation avec options avancées optimisées pour Abidjan
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }

    // Configuration optimisée pour une précision maximale
    const options: PositionOptions = {
      enableHighAccuracy: true,    // Force l'utilisation du GPS
      timeout: 30000,             // Timeout étendu pour Abidjan (30s)
      maximumAge: 60000           // Cache de 1 minute pour éviter les requêtes répétées
    };

    // Tentative avec haute précision d'abord
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Vérifier la précision obtenue
        if (position.coords.accuracy <= 100) {
          resolve(position);
        } else {
          // Si précision insuffisante, réessayer avec timeout plus long
          const fallbackOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 45000,
            maximumAge: 0
          };
          
          navigator.geolocation.getCurrentPosition(resolve, reject, fallbackOptions);
        }
      },
      reject,
      options
    );
  });
};

// Fonction pour filtrer et trier les résultats
const filterAndSortResults = (
  pressings: ExtendedPressing[], 
  filters: SearchFilters, 
  sortBy: SortOption, 
  query: string,
  userPosition: [number, number] | null
): ExtendedPressing[] => {
  let filtered = [...pressings];

  // Filtre par recherche textuelle
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter(pressing => 
      (pressing.name || pressing.businessName || '')?.toLowerCase().includes(searchTerm) ||
      pressing.addresses?.[0]?.street?.toLowerCase().includes(searchTerm) ||
      pressing.services?.some(service => 
        (service.name || service.nom || '').toLowerCase().includes(searchTerm)
      )
    );
  }

  // Filtre par quartiers
  if (filters.neighborhoods && filters.neighborhoods.length > 0) {
    filtered = filtered.filter(pressing => {
      const pressingNeighborhood = pressing.addresses?.[0]?.city;
      return pressingNeighborhood && filters.neighborhoods?.includes(pressingNeighborhood);
    });
  }

  // Filtre par services
  if (filters.services.length > 0) {
    filtered = filtered.filter(pressing => 
      pressing.services?.some(service => 
        filters.services.includes(service.category as PressingServiceCategory)
      )
    );
  }

  // Filtre par prix
  filtered = filtered.filter(pressing => {
    const services = pressing.services || [];
    if (services.length === 0) {
      // Si aucun service n'est défini, ne pas filtrer par prix
      return true;
    }
    const avgPrice = services.reduce((sum, service) => sum + (service.price || 0), 0) / services.length;
    return avgPrice >= filters.priceRange[0] && avgPrice <= filters.priceRange[1];
  });

  // Filtre par distance
  if (userPosition) {
    filtered = filtered.filter(pressing => {
      if (filters.distanceRange && filters.distanceRange.length === 2) {
        return pressing.distance !== undefined && 
               pressing.distance >= 0 && // Toujours inclure les pressings proches (>= 0km)
               pressing.distance <= filters.distanceRange![1];
      }
      return true;
    });
  }

  // Filtre par note
  if (filters.rating) {
    filtered = filtered.filter(pressing => {
      return (pressing.rating || 0) >= filters.rating;
    });
  }

  // Filtre ouvert maintenant
  if (filters.openNow || filters.isOpen) {
    filtered = filtered.filter(pressing => isPressingOpen(pressing));
  }

  // Filtre livraison (basé sur les services disponibles)
  if (filters.hasDelivery) {
    filtered = filtered.filter(pressing => 
      pressing.services?.some(service => (service.name || service.nom || '').toLowerCase().includes('livraison'))
    );
  }

  // Filtre collecte (basé sur les services disponibles)
  if (filters.hasPickup) {
    filtered = filtered.filter(pressing => 
      pressing.services?.some(service => (service.name || service.nom || '').toLowerCase().includes('collecte'))
    );
  }

  // Calcul des distances si position utilisateur disponible
  if (userPosition) {
    filtered = filtered.map(pressing => ({
      ...pressing,
      distance: calculateDistance(
        userPosition[0], userPosition[1],
        pressing.location.coordinates[1], pressing.location.coordinates[0]
      )
    }));
  }

  // Tri des résultats
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'rating':
        return ((b.rating || 0) - (a.rating || 0));
      case 'price':
        const aPrice = a.services?.[0]?.price || 0;
        const bPrice = b.services?.[0]?.price || 0;
        return aPrice - bPrice;
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'popular':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      default: // relevance
        return 0;
    }
  });

  return filtered;
};

// Fonction pour vérifier si un pressing est ouvert
const isPressingOpen = (pressing: ExtendedPressing): boolean => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = pressing.openingHours?.find(h => h.day === currentDay);
  if (!todayHours || !todayHours.open) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Reducer pour la gestion d'état avancée
const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      const newState = { ...state, query: action.payload };
      // Filtrage automatique lors du changement de requête
      const filteredResults = filterAndSortResults(
        newState.results, 
        newState.filters, 
        newState.sortBy, 
        action.payload,
        newState.userPosition
      );
      return { ...newState, filteredResults };
      
    case 'SET_RESULTS':
      const stateWithResults = { ...state, results: action.payload, isLoading: false, error: null };
      const filteredWithResults = filterAndSortResults(
        action.payload, 
        stateWithResults.filters, 
        stateWithResults.sortBy, 
        stateWithResults.query,
        stateWithResults.userPosition
      );
      return { ...stateWithResults, filteredResults: filteredWithResults };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'SET_FILTERS':
      const stateWithFilters = { ...state, filters: { ...state.filters, ...action.payload } };
      const filteredWithFilters = filterAndSortResults(
        stateWithFilters.results, 
        stateWithFilters.filters, 
        stateWithFilters.sortBy, 
        stateWithFilters.query,
        stateWithFilters.userPosition
      );
      return { ...stateWithFilters, filteredResults: filteredWithFilters };
      
    case 'SET_SORT':
      const stateWithSort = { ...state, sortBy: action.payload };
      const filteredWithSort = filterAndSortResults(
        stateWithSort.results, 
        stateWithSort.filters, 
        action.payload, 
        stateWithSort.query,
        stateWithSort.userPosition
      );
      return { ...stateWithSort, filteredResults: filteredWithSort };
      
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
      
    case 'SET_USER_POSITION':
      const stateWithPosition = { ...state, userPosition: action.payload };
      const filteredWithPosition = filterAndSortResults(
        stateWithPosition.results, 
        stateWithPosition.filters, 
        stateWithPosition.sortBy, 
        stateWithPosition.query,
        action.payload
      );
      return { ...stateWithPosition, filteredResults: filteredWithPosition };
      
    case 'ADD_TO_HISTORY':
      const newHistory = [action.payload, ...state.recentSearches.filter(s => s !== action.payload)].slice(0, 10);
      localStorage.setItem('pressing-searches', JSON.stringify(newHistory));
      return { ...state, recentSearches: newHistory, lastSearchTime: Date.now() };
      
    case 'TOGGLE_FAVORITE':
      const newFavorites = state.favorites.includes(action.payload)
        ? state.favorites.filter(id => id !== action.payload)
        : [...state.favorites, action.payload];
      localStorage.setItem('pressing-favorites', JSON.stringify(newFavorites));
      return { ...state, favorites: newFavorites };
      
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
      
    case 'FILTER_RESULTS':
      const manualFiltered = filterAndSortResults(
        state.results, 
        state.filters, 
        state.sortBy, 
        state.query,
        state.userPosition
      );
      return { ...state, filteredResults: manualFiltered };
      
    case 'SET_SELECTED_PRESSING':
      return { ...state, selectedPressing: action.payload };
    default:
      return state;
  }
};

// Quartiers d'Abidjan pour la recherche
const ABIDJAN_NEIGHBORHOODS_LIST: string[] = [
  'Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Treichville',
  'Adjamé', 'Abobo', 'Koumassi', 'Port-Bouët', 'Attécoubé',
  'Bingerville', 'Anyama', 'Songon'
];

// Composant de vue carte interactive avec Mapbox
const MapView = MapboxMapView;

const SearchPage = () => {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const [showFilters, setShowFilters] = useState(false);
  const [geolocationStatus, setGeolocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geolocationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API hooks pour les pressings
  const [getNearbyPressings, { data: nearbyPressingsData, isLoading: nearbyLoading, error: nearbyError }] = useLazyGetNearbyPressingsQuery();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook Mapbox pour géolocalisation automatique
  const {
    position: mapboxPosition,
    error: mapboxError,
    isLoading: mapboxLoading,
    requestPosition: requestMapboxPosition,
    clearPosition: clearMapboxPosition
  } = useMapboxGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes de cache
    fallbackToIP: true,
    autoRequest: false // Géolocalisation manuelle via bouton
  });

  // Chargement initial des pressings proches (déplacé avant handleLocationReceived)
  const loadNearbyPressings = useCallback(async (lat?: number, lng?: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const params = {
        location: {
          lat: lat || state.userPosition?.[0] || 5.3364,
          lng: lng || state.userPosition?.[1] || -4.0267
        },
        radius: state.filters.distanceRange[1] || 100000 // Rayon très large pour récupérer tous les pressings d'Abidjan (100km)
      };
      
      const result = await getNearbyPressings(params);
      console.log('API Result:', result);
      const backendPressings = result.data || [];
      console.log('Backend Pressings:', backendPressings);
      
      // Transformation des données backend vers ExtendedPressing
      const transformedPressings: ExtendedPressing[] = backendPressings
        .map((pressing: any) => {
          // Extraire les coordonnées avec validation multiple
          let lat = 0, lng = 0;
          
          // Priorité 1: address.coordinates.coordinates (format GeoJSON)
          if (pressing.address?.coordinates?.coordinates && Array.isArray(pressing.address.coordinates.coordinates)) {
            [lng, lat] = pressing.address.coordinates.coordinates;
          }
          // Priorité 2: address.location (format direct)
          else if (pressing.address?.location) {
            lat = pressing.address.location.lat || pressing.address.location.latitude || 0;
            lng = pressing.address.location.lng || pressing.address.location.longitude || 0;
          }
          // Priorité 3: coordonnées directes
          else if (pressing.coordinates) {
            lat = pressing.coordinates.lat || pressing.coordinates.latitude || 0;
            lng = pressing.coordinates.lng || pressing.coordinates.longitude || 0;
          }
          // Priorité 4: localisation dans adresse
          else if (pressing.adresse?.localisation?.coordinates) {
            [lng, lat] = pressing.adresse.localisation.coordinates;
          }
          
          // Validation des coordonnées pour Abidjan
          const isValidAbidjanCoordinates = (
            lat >= 5.0 && lat <= 5.6 && // Limites latitude Abidjan étendue
            lng >= -4.5 && lng <= -3.8   // Limites longitude Abidjan étendue
          );
          
          // Fallback vers coordonnées par défaut si invalides
          if (!isValidAbidjanCoordinates) {
            console.warn('Coordonnées invalides pour pressing:', pressing.nom, { lat, lng });
            // Utiliser coordonnées par défaut d'Abidjan selon le quartier
            const fallbackCoords = {
              'Yopougon': { lat: 5.34, lng: -4.10 },
              'Cocody': { lat: 5.365, lng: -4.001 },
              'Plateau': { lat: 5.32, lng: -4.03 },
              'Adjamé': { lat: 5.35, lng: -4.04 },
              'Treichville': { lat: 5.295, lng: -4.025 },
              'Marcory': { lat: 5.295, lng: -3.995 }
            };
            
            const neighborhood = pressing.addresses?.[0]?.city || 'Yopougon';
            const coords = fallbackCoords[neighborhood] || fallbackCoords['Yopougon'];
            lat = coords.lat;
            lng = coords.lng;
          }
          
          return {
            id: pressing._id || pressing.id,
            name: pressing.businessName || pressing.nom || pressing.name,
            businessName: pressing.businessName || pressing.nom,
            address: pressing.address?.street || pressing.adresse?.rue || 'Adresse non disponible',
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            distance: pressing.distance || 0,
            rating: pressing.rating || 0,
            reviewCount: pressing.reviewCount || 0,
            services: pressing.services || [],
            isOpen: pressing.isOpen || false,
            telephone: pressing.telephone || pressing.phone,
            addresses: pressing.addresses || [{
              street: pressing.address?.street || pressing.adresse?.rue,
              city: pressing.address?.city || pressing.adresse?.ville,
              postalCode: pressing.address?.postalCode || pressing.adresse?.codePostal
            }],
            openingHours: pressing.openingHours || pressing.businessHours || [],
            badges: pressing.badges || [],
            createdAt: pressing.createdAt,
            validatedCoordinates: {
              lat,
              lng,
              isOriginal: isValidAbidjanCoordinates,
              source: isValidAbidjanCoordinates ? 'api' : 'fallback',
              originalCoordinates: pressing.address?.coordinates?.coordinates || null,
              fallbackUsed: !isValidAbidjanCoordinates,
              detectedNeighborhood: getNeighborhoodFromCoordinates(lat, lng),
              validationPassed: isValidAbidjanCoordinates
            }
          };
        })
        .filter(pressing => {
          // Filtrer les pressings sans coordonnées valides
          const hasValidCoords = pressing.validatedCoordinates.lat !== 0 && pressing.validatedCoordinates.lng !== 0;
          if (!hasValidCoords) {
            console.warn('Pressing exclu (coordonnées invalides):', pressing.nom, pressing.id);
          }
          return hasValidCoords;
        });
      
      console.log(`✅ ${transformedPressings.length} pressings avec coordonnées valides chargés`);
      dispatch({ type: 'SET_RESULTS', payload: transformedPressings });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (transformedPressings.length === 0) {
        toast('Aucun pressing trouvé dans cette zone');
      } else {
        toast.success(`🎯 ${transformedPressings.length} pressing${transformedPressings.length > 1 ? 's' : ''} trouvé${transformedPressings.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pressings:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Erreur lors du chargement des pressings');
    }
  }, [getNearbyPressings, state.userPosition, state.filters.distance]);

  // Gestionnaire de réception de position Mapbox
  const handleLocationReceived = useCallback((position: MapboxGeolocationPosition) => {
    const { latitude, longitude, accuracy, source } = position;
    
    // Mise à jour de la position dans l'état
    dispatch({ 
      type: 'SET_USER_POSITION', 
      payload: [latitude, longitude] 
    });
    
    // Détection automatique du quartier
    const neighborhood = getNeighborhoodFromCoordinates(latitude, longitude);
    
    setGeolocationStatus('success');
    
    // Rechargement des pressings proches avec la nouvelle position
    loadNearbyPressings(latitude, longitude);
    
    // Toast de succès avec informations détaillées
    const sourceText = source === 'native' ? 'GPS natif' : source === 'mapbox' ? 'Mapbox' : 'IP';
    const precisionText = accuracy <= 100 ? 'Précise' : 'Approximative';
    
    toast.success(
      `📍 Position détectée via ${sourceText} • ${precisionText} (±${Math.round(accuracy)}m)${neighborhood !== 'Autre' ? ` • ${neighborhood}` : ''}`,
      {
        duration: 4000,
        id: 'geolocation-success'
      }
    );
  }, [loadNearbyPressings]);

  // Gestionnaire d'erreur de géolocalisation
  const handleLocationError = useCallback((error: any) => {
    setGeolocationStatus('error');
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        toast.error('🚫 Autorisation de géolocalisation refusée.', { id: 'geolocation-error' });
        break;
      case 2: // POSITION_UNAVAILABLE
        toast.error('📡 Position indisponible. Vérifiez votre connexion GPS.', { id: 'geolocation-error' });
        break;
      case 3: // TIMEOUT
        toast.error('⏱️ Délai d\'attente dépassé. Réessayez.', { id: 'geolocation-error' });
        break;
      default:
        toast.error('❌ Erreur de géolocalisation. Utilisez la recherche manuelle.', { id: 'geolocation-error' });
    }
  }, []);

  // Fonction de rafraîchissement manuel pour forcer le rechargement des nouveaux pressings
  const handleRefreshPressings = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Forcer le rechargement avec un timestamp pour éviter le cache
      await loadNearbyPressings(
        state.userPosition?.[0], 
        state.userPosition?.[1]
      );
      toast.success('🔄 Données actualisées ! Nouveaux pressings chargés.', {
        duration: 3000,
        id: 'refresh-success'
      });
    } catch (error) {
      toast.error('❌ Erreur lors de l\'actualisation', {
        id: 'refresh-error'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNearbyPressings, state.userPosition]);


  
  // Initialisation des données
  useEffect(() => {
    // Chargement initial avec position par défaut d'Abidjan
    loadNearbyPressings();
    
    // La géolocalisation est maintenant manuelle via le bouton MapboxGeolocationButton
    // Plus de géolocalisation automatique pour respecter la vie privée de l'utilisateur
    
    // Gestion du statut en ligne/hors ligne
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      toast.success('🟢 Connexion rétablie');
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
      toast.error('🔴 Connexion perdue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (geolocationTimeoutRef.current) {
        clearTimeout(geolocationTimeoutRef.current);
      }
    };
  }, [loadNearbyPressings]);

  // Génération de suggestions intelligentes
  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const newSuggestions: string[] = [];

    // Suggestions basées sur les pressings (données API)
    state.results.forEach(pressing => {
      if (pressing.name?.toLowerCase().includes(searchTerm)) {
        newSuggestions.push(pressing.name);
      }
      if (pressing.addresses?.[0]?.city?.toLowerCase().includes(searchTerm)) {
        newSuggestions.push(pressing.addresses[0].city);
      }
    });

    // Suggestions basées sur les quartiers
    ABIDJAN_NEIGHBORHOODS_LIST.forEach(neighborhood => {
      if (neighborhood.toLowerCase().includes(searchTerm)) {
        newSuggestions.push(neighborhood);
      }
    });

    // Suggestions basées sur les services
    PRESSING_SERVICES.forEach(service => {
      if (service.label.toLowerCase().includes(searchTerm)) {
        newSuggestions.push(service.label);
      }
    });

    // Suggestions basées sur l'historique
    state.recentSearches.forEach(search => {
      if (search.toLowerCase().includes(searchTerm)) {
        newSuggestions.push(search);
      }
    });

    // Limiter et dédupliquer
    const uniqueSuggestions = Array.from(new Set(newSuggestions));
    setSuggestions(uniqueSuggestions.slice(0, 5));
  }, [state.recentSearches]);

  // Fonction de recherche avec debounce
  const handleSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
    generateSuggestions(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'ADD_TO_HISTORY', payload: query.trim() });
        setSuggestions([]); // Masquer les suggestions après recherche
        
        // Simulation de recherche
        setTimeout(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        }, 300);
      }
    }, 300);
  }, [generateSuggestions]);

  // Gestion des favoris
  const handleToggleFavorite = useCallback((pressingId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: pressingId });
    
    const isFavorite = state.favorites.includes(pressingId);
    toast.success(isFavorite ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris');
  }, [state.favorites]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec gradient ivoirien */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-10px font-bold text-gray-900">🔍</h1>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {state.isOnline ? (
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
                <span className={`text-xs sm:text-sm ${state.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {state.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              
              {/* Indicateur géolocalisation */}
              {geolocationStatus === 'success' && state.userPosition && (
                <div className="hidden sm:flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Position détectée</span>
                </div>
              )}
            </div>
            
            {/* Actions rapides */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Bouton de rafraîchissement pour les nouveaux pressings */}
              <button
                onClick={handleRefreshPressings}
                disabled={isRefreshing || state.isLoading}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualiser les pressings (nouveaux pressings)"
              >
                {isRefreshing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </button>
              
              {/* Bouton géolocalisation haute précision */}
              <div className="flex items-center space-x-1">
                <MapboxGeolocationButton
                  onLocationReceived={handleLocationReceived}
                  onError={handleLocationError}
                  variant="primary"
                  size="sm"
                  showAccuracy={true}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Satellite className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Précision Max</span>
                </MapboxGeolocationButton>
                
                {/* Bouton géolocalisation standard en fallback */}
                <button
                  onClick={async () => {
                    setGeolocationStatus('loading');
                    try {
                      const position = await getCurrentPosition();
                      const { latitude, longitude, accuracy } = position.coords;
                      
                      dispatch({ 
                        type: 'SET_USER_POSITION', 
                        payload: [latitude, longitude] 
                      });
                      
                      const neighborhood = getNeighborhoodFromCoordinates(latitude, longitude);
                      setGeolocationStatus('success');
                      loadNearbyPressings(latitude, longitude);
                      
                      const precisionText = accuracy <= 100 ? 'Précise' : 'Standard';
                      toast.success(
                        `📍 GPS Standard • ${precisionText} (±${Math.round(accuracy)}m)${neighborhood !== 'Autre' ? ` • ${neighborhood}` : ''}`,
                        { duration: 3000, id: 'standard-gps-success' }
                      );
                    } catch (error: any) {
                      setGeolocationStatus('error');
                      handleLocationError(error);
                    }
                  }}
                  disabled={geolocationStatus === 'loading'}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="GPS Standard (fallback)"
                >
                  {geolocationStatus === 'loading' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crosshair className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Toggle filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md transition-colors ${
                  showFilters 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Filtres avancés"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              
              {/* Toggle vue liste/carte */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
                  className={`p-1 rounded transition-colors ${
                    state.viewMode === 'list' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'map' })}
                  className={`p-1 rounded transition-colors ${
                    state.viewMode === 'map' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <br />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8">
        {/* Barre de recherche avancée */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={state.query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={state.userPosition ? "Rechercher près de moi..." : "Rechercher un pressing à Abidjan..."}
              className="w-full pl-9 sm:pl-10 pr-12 sm:pr-16 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            />
            
            {/* Boutons d'action dans la barre de recherche */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {state.query && (
                <button
                  onClick={() => {
                    handleSearch('');
                    setSuggestions([]);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {state.isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-orange-500"></div>
              )}
              
              {!state.isLoading && state.userPosition && (
                <div title="Position détectée">
                  <Navigation className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
            
            {/* Suggestions de recherche */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleSearch(suggestion);
                      setSuggestions([]);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm sm:text-base"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Statistiques rapides */}
        {state.filteredResults.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{state.filteredResults.length} pressing{state.filteredResults.length > 1 ? 's' : ''} trouvé{state.filteredResults.length > 1 ? 's' : ''}</span>
                {state.userPosition && (
                  <span className="text-green-600">• Position détectée</span>
                )}
                {state.query && (
                  <span>• Recherche: "{state.query}"</span>
                )}
              </div>
              
              {/* Tri rapide */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Trier par:</span>
                <select
                  value={state.sortBy.value}
                  onChange={(e) => {
                    const sortOption = SORT_OPTIONS.find(opt => opt.value === e.target.value);
                    if (sortOption) dispatch({ type: 'SET_SORT', payload: sortOption });
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Panneau de filtres avancés */}
        {showFilters && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filtres avancés</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      dispatch({ 
                        type: 'SET_FILTERS', 
                        payload: {
                          neighborhoods: [],
                          services: [],
                          priceRange: [500, 10000],
                          distanceRange: [1, 50],
                          rating: 0,
                          openNow: false,
                          hasDelivery: false,
                          hasPickup: false
                        }
                      });
                      toast.success('🔄 Filtres réinitialisés');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Réinitialiser</span>
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Quartiers d'Abidjan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Quartiers d'Abidjan
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ABIDJAN_NEIGHBORHOODS.map(neighborhood => (
                      <label key={neighborhood.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.filters.neighborhoods.includes(neighborhood.value as AbidjanNeighborhood)}
                          onChange={(e) => {
                            const neighborhoods = e.target.checked
                              ? [...state.filters.neighborhoods, neighborhood.value as AbidjanNeighborhood]
                              : state.filters.neighborhoods.filter(n => n !== neighborhood.value);
                            dispatch({ type: 'SET_FILTERS', payload: { neighborhoods } });
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{neighborhood.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧽 Services
                  </label>
                  <div className="space-y-2">
                    {PRESSING_SERVICES.map(service => (
                      <label key={service.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.filters.services.includes(service.value)}
                          onChange={(e) => {
                            const services = e.target.checked
                              ? [...state.filters.services, service.value]
                              : state.filters.services.filter(s => s !== service.value);
                            dispatch({ type: 'SET_FILTERS', payload: { services } });
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          {service.emoji} {service.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Prix et Distance */}
                <div className="space-y-4">
                  {/* Fourchette de prix */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 Prix ({state.filters.priceRange[0]} - {state.filters.priceRange[1]} FCFA)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={state.filters.priceRange[1]}
                        onChange={(e) => {
                          const max = parseInt(e.target.value);
                          const min = Math.min(state.filters.priceRange[0], max - 500);
                          dispatch({ type: 'SET_FILTERS', payload: { priceRange: [min, max] } });
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>500 FCFA</span>
                        <span>10 000 FCFA</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Distance */}
                  {state.userPosition && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📏 Distance max ({state.filters.distanceRange[1]} km)
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={state.filters.distanceRange[1]}
                          onChange={(e) => {
                            const max = parseInt(e.target.value);
                            dispatch({ type: 'SET_FILTERS', payload: { distanceRange: [1, max] } });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1 km</span>
                          <span>50 km</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Note minimale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⭐ Note minimale ({state.filters.rating > 0 ? state.filters.rating : 'Toutes'})
                    </label>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => dispatch({ type: 'SET_FILTERS', payload: { rating } })}
                          className={`p-1 rounded transition-colors ${
                            state.filters.rating === rating
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${rating <= state.filters.rating && state.filters.rating > 0 ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Options rapides */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.filters.openNow}
                      onChange={(e) => dispatch({ type: 'SET_FILTERS', payload: { openNow: e.target.checked } })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">🟢 Ouvert maintenant</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.filters.hasDelivery}
                      onChange={(e) => dispatch({ type: 'SET_FILTERS', payload: { hasDelivery: e.target.checked } })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">🚚 Livraison disponible</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.filters.hasPickup}
                      onChange={(e) => dispatch({ type: 'SET_FILTERS', payload: { hasPickup: e.target.checked } })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">📦 Collecte disponible</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {state.filteredResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              {state.isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-600">Recherche en cours...</p>
                </div>
              ) : state.query || Object.values(state.filters).some(f => 
                Array.isArray(f) ? f.length > 0 : 
                typeof f === 'boolean' ? f : 
                typeof f === 'number' ? f > 0 : false
              ) ? (
                <div className="space-y-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pressing trouvé</h3>
                    <p className="text-gray-600 mb-4">
                      Aucun pressing ne correspond à vos critères de recherche.
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          handleSearch('');
                          dispatch({ type: 'SET_FILTERS', payload: {
                            neighborhoods: [],
                            services: [],
                            priceRange: [500, 10000],
                            distanceRange: [1, 50],
                            rating: 0,
                            openNow: false,
                            hasDelivery: false,
                            hasPickup: false
                          }});
                        }}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Réinitialiser la recherche</span>
                      </button>
                      {/* Bouton de géolocalisation Mapbox moderne */}
                      <div className="flex items-center space-x-3">
                        <MapboxGeolocationButton
                          onLocationReceived={handleLocationReceived}
                          onError={handleLocationError}
                          variant="primary"
                          size="md"
                          showAccuracy={true}
                          className="ml-2"
                        >
                          <Target className="w-4 h-4" />
                          <span>📍 Ma position</span>
                        </MapboxGeolocationButton>
                        
                        {/* Indicateur de position détectée */}
                        {state.userPosition && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            <span>Position détectée</span>
                            <span className="text-xs text-gray-500">
                              ({state.userPosition[0].toFixed(4)}, {state.userPosition[1].toFixed(4)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Search className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Recherchez un pressing</h3>
                    <p className="text-gray-600">
                      Utilisez la barre de recherche ou les filtres pour trouver le pressing idéal à Abidjan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : state.viewMode === 'list' ? (
          <div className="space-y-3 sm:space-y-4">
            {state.filteredResults.map((pressing) => (
              <div
                key={pressing.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{pressing.businessName || pressing.nom || 'Pressing'}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pressing.address || 'Adresse non disponible'}</p>
                      </div>
                      
                      <button
                        onClick={() => handleToggleFavorite(String(pressing.id))}
                        className={`ml-2 p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${
                          state.favorites?.includes(String(pressing.id))
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${pressing.id && state.favorites.includes(pressing.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    {/* Badges */}
                    {pressing.badges && pressing.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pressing.badges.slice(0, 2).map((badge, index) => (
                          <span
                            key={`${pressing.id}-badge-${index}-${badge}`}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Informations principales */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span>{typeof pressing.rating === 'object' ? (pressing.rating as any).average?.toFixed(1) || '0.0' : (pressing.rating as any)?.toFixed(1) || '0.0'}</span>
                        <span className="hidden sm:inline">({pressing.reviewCount || 0} avis)</span>
                      </div>
                      
                      {pressing.distance && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{pressing.distance.toFixed(1)} km</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-green-600">
                          Ouvert 6h-20h
                        </span>
                      </div>
                      
                      {pressing.estimatedDeliveryTime && (
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-600">🚚 {pressing.estimatedDeliveryTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                      {pressing.services?.slice(0, 3).map((service, index) => (
                        <span
                          key={service.id || `${pressing.id}-service-${index}`}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {service.name || service.nom || 'Service'} - {(service.price || service.prix || 0).toLocaleString()} FCFA
                        </span>
                      ))}
                      {pressing.services && pressing.services.length > 3 && (
                        <span key={`${pressing.id}-more-services`} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{pressing.services.length - 3} autres
                        </span>
                      )}
                    </div>

                    {/* Promotions */}
                    {pressing.promotions && pressing.promotions.length > 0 && (
                      <div className="mb-3">
                        {pressing.promotions.slice(0, 1).map((promo, index) => (
                          <span
                            key={`${pressing.id}-promo-${index}-${promo.substring(0, 10)}`}
                            className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            🎉 {promo}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/pressing-detail/${pressing.id}`)}
                        className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        Voir détails
                      </button>
                      {state.userPosition && (
                        <button
                          onClick={() => {
                            // Basculer vers la vue carte et sélectionner ce pressing
                            dispatch({ type: 'SET_VIEW_MODE', payload: 'map' });
                            dispatch({ type: 'SET_SELECTED_PRESSING', payload: pressing });
                            // Faire défiler vers la carte
                            setTimeout(() => {
                              const mapElement = document.querySelector('[data-testid="map-container"]');
                              if (mapElement) {
                                mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <Navigation className="w-4 h-4 mr-1 inline" />
                          Itinéraire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="map-container">
            <MapView
              pressings={state.filteredResults}
              userPosition={state.userPosition}
              onPressingSelect={(pressing) => {
                // Toggle selection: if already selected, deselect it
                const newSelection = state.selectedPressing?.id === pressing?.id ? null : pressing;
                dispatch({ type: 'SET_SELECTED_PRESSING', payload: newSelection });
              }}
              favorites={state.favorites}
              onToggleFavorite={handleToggleFavorite}
              selectedPressing={state.selectedPressing}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
  