import { Pressing, PressingServiceCategory, AbidjanNeighborhood, SearchFilters } from './index';

// Re-export SearchFilters to fix import issues
export type { SearchFilters };

// Types et interfaces pour la recherche de pressings
export interface ExtendedPressing extends Omit<Pressing, 'rating'> {
  distance: number;
  isOpen: boolean;
  estimatedDeliveryTime?: string;
  promotions?: string[];
  badges?: string[];
  reviewCount?: number;
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  // Surcharge du type rating pour inclure plus de détails
  rating: {
    average: number;
    count: number;
    totalScore: number;
  } | number; // Compatibilité avec l'ancien format
  // Nouvelles propriétés pour la validation des coordonnées
  validatedCoordinates?: {
    lat: number;
    lng: number;
    isOriginal: boolean;
    source: 'backend' | 'fallback' | 'unknown';
  };
  // Métadonnées de localisation pour debugging et affichage
  locationMetadata?: {
    originalCoordinates: [number, number] | null;
    fallbackUsed: boolean;
    detectedNeighborhood: string;
    validationPassed: boolean;
  };
}

export interface SearchState {
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
}

// SearchFilters is now imported from types/index.ts to avoid conflicts

export interface SortOption {
  value: 'relevance' | 'distance' | 'rating' | 'price' | 'newest' | 'popular';
  label: string;
  icon: React.ReactNode;
  description: string;
}

export type SearchAction = 
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: ExtendedPressing[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SET_SORT'; payload: SortOption }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'map' }
  | { type: 'SET_USER_POSITION'; payload: [number, number] | null }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'FILTER_RESULTS' }
  | { type: 'SET_SELECTED_PRESSING'; payload: ExtendedPressing | null };
