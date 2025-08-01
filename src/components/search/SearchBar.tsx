import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock, Star } from 'lucide-react';
import { AbidjanNeighborhood } from '../../types';

interface SearchSuggestion {
  id: string;
  type: 'pressing' | 'neighborhood' | 'service';
  title: string;
  subtitle?: string;
  emoji: string;
  data?: any;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  isLoading?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

const mockSuggestions: SearchSuggestion[] = [
  // Pressings populaires
  { id: '1', type: 'pressing', title: 'Pressing de la Riviera', subtitle: 'Cocody • 4.5⭐ • 2.1km', emoji: '🏪', data: { id: '1' } },
  { id: '2', type: 'pressing', title: 'Yopougon Pressing Express', subtitle: 'Yopougon • 4.2⭐ • 5.3km', emoji: '🏪', data: { id: '2' } },
  { id: '3', type: 'pressing', title: 'Plateau Clean Service', subtitle: 'Plateau • 4.7⭐ • 1.8km', emoji: '🏪', data: { id: '3' } },
  
  // Quartiers
  { id: 'cocody', type: 'neighborhood', title: 'Cocody', subtitle: '15 pressings disponibles', emoji: '🏘️', data: { neighborhood: AbidjanNeighborhood.COCODY } },
  { id: 'plateau', type: 'neighborhood', title: 'Plateau', subtitle: '12 pressings disponibles', emoji: '🏢', data: { neighborhood: AbidjanNeighborhood.PLATEAU } },
  { id: 'yopougon', type: 'neighborhood', title: 'Yopougon', subtitle: '8 pressings disponibles', emoji: '🏘️', data: { neighborhood: AbidjanNeighborhood.YOPOUGON } },
  
  // Services
  { id: 'dry_cleaning', type: 'service', title: 'Nettoyage à sec', subtitle: 'Service disponible chez 23 pressings', emoji: '🧥' },
  { id: 'laundry', type: 'service', title: 'Lavage & Pliage', subtitle: 'Service disponible chez 31 pressings', emoji: '👕' },
  { id: 'ironing', type: 'service', title: 'Repassage', subtitle: 'Service disponible chez 28 pressings', emoji: '🔥' },
];

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onSuggestionSelect,
  placeholder = "Rechercher un pressing, quartier ou service...",
  isLoading = false,
  recentSearches = [],
  onClearRecent
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrer les suggestions basées sur la recherche
  useEffect(() => {
    if (value.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = mockSuggestions.filter(suggestion =>
      suggestion.title.toLowerCase().includes(query) ||
      (suggestion.subtitle && suggestion.subtitle.toLowerCase().includes(query))
    ).slice(0, 6);

    setSuggestions(filtered);
    setSelectedIndex(-1);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.title);
    onSuggestionSelect(suggestion);
    setIsFocused(false);
    setSuggestions([]);
  };

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value.trim());
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const showSuggestions = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Barre de recherche */}
      <div className={`relative flex items-center bg-white rounded-lg border-2 transition-all duration-200 ${
        isFocused ? 'border-orange-500 shadow-lg' : 'border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center pl-4">
          <Search className={`w-5 h-5 transition-colors ${
            isFocused ? 'text-orange-500' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Délai pour permettre le clic sur les suggestions
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none"
        />

        <div className="flex items-center pr-2 space-x-2">
          {isLoading && (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          )}
          
          {value && !isLoading && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleSearch}
            disabled={!value.trim() || isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Recherches récentes */}
          {isFocused && value.trim().length === 0 && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Recherches récentes
                </h4>
                {onClearRecent && (
                  <button
                    onClick={onClearRecent}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onChange(search);
                      onSearch(search);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions de recherche */}
          {suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedIndex === index ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{suggestion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {suggestion.type === 'pressing' && <Star className="w-4 h-4 text-yellow-500" />}
                      {suggestion.type === 'neighborhood' && <MapPin className="w-4 h-4 text-blue-500" />}
                      {suggestion.type === 'service' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {value.trim().length > 0 && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune suggestion trouvée</p>
              <p className="text-xs text-gray-400 mt-1">
                Essayez un nom de pressing, quartier ou service
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
