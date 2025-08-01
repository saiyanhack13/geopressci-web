import { Pressing, PressingServiceCategory, AbidjanNeighborhood, SearchFilters } from './index';

// Re-export SearchFilters to fix import issues
export type { SearchFilters };

// Types et interfaces pour la recherche de pressings
export interface ExtendedPressing extends Pressing {
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
