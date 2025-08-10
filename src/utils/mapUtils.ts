// 🗺️ UTILITAIRES CARTOGRAPHIQUES - MAPBOX & OPENSTREETMAP
// Centralisation de tous les liens et fonctions cartographiques
// Remplace complètement Google Maps par des alternatives plus précises pour l'Afrique

// Configuration Mapbox
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWUzOTVnc2wwNTVsMmxzZTF1Zm13ZWVjIn0.o48XqkHK-s4jF4qLzLKRQ';

// Coordonnées par défaut d'Abidjan
export const ABIDJAN_COORDINATES = {
  latitude: 5.3599517,
  longitude: -3.9665738,
  zoom: 12
};

// Types pour les coordonnées
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapboxStaticOptions {
  width?: number;
  height?: number;
  zoom?: number;
  retina?: boolean;
  markerColor?: string;
  markerSize?: 's' | 'm' | 'l';
}

/**
 * Génère une URL pour une carte statique Mapbox
 * Plus précis que Google Static Maps pour l'Afrique
 */
export const generateMapboxStaticUrl = (
  coordinates: Coordinates,
  options: MapboxStaticOptions = {}
): string => {
  const {
    width = 600,
    height = 400,
    zoom = 15,
    retina = true,
    markerColor = 'ff0000',
    markerSize = 's'
  } = options;

  const retinaParam = retina ? '@2x' : '';
  const marker = `pin-${markerSize}+${markerColor}(${coordinates.longitude},${coordinates.latitude})`;
  
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${coordinates.longitude},${coordinates.latitude},${zoom}/${width}x${height}${retinaParam}?access_token=${MAPBOX_TOKEN}`;
};

/**
 * Génère une URL OpenStreetMap pour afficher une position
 * Alternative gratuite et fiable
 */
export const generateOSMUrl = (coordinates: Coordinates, zoom: number = 15): string => {
  return `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}&zoom=${zoom}#map=${zoom}/${coordinates.latitude}/${coordinates.longitude}`;
};

/**
 * Génère une URL OpenStreetMap pour rechercher une adresse
 * Optimisé pour la Côte d'Ivoire
 */
export const generateOSMSearchUrl = (address: string): string => {
  const encodedAddress = encodeURIComponent(address);
  // Centrer sur Abidjan par défaut
  return `https://www.openstreetmap.org/search?query=${encodedAddress}#map=15/${ABIDJAN_COORDINATES.latitude}/${ABIDJAN_COORDINATES.longitude}`;
};

/**
 * Génère une URL pour les directions avec OpenStreetMap
 * Alternative gratuite à Google Directions
 */
export const generateOSMDirectionsUrl = (
  from: Coordinates | null,
  to: Coordinates
): string => {
  if (from) {
    return `https://www.openstreetmap.org/directions?from=${from.latitude},${from.longitude}&to=${to.latitude},${to.longitude}#map=15/${to.latitude}/${to.longitude}`;
  } else {
    return `https://www.openstreetmap.org/directions?to=${to.latitude},${to.longitude}#map=15/${to.latitude}/${to.longitude}`;
  }
};

/**
 * Génère une URL Mapbox pour le géocodage
 * Plus précis que Google Geocoding pour l'Afrique de l'Ouest
 */
export const generateMapboxGeocodingUrl = (address: string): string => {
  const encodedAddress = encodeURIComponent(address);
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=ci&proximity=${ABIDJAN_COORDINATES.longitude},${ABIDJAN_COORDINATES.latitude}&language=fr`;
};

/**
 * Génère une URL Mapbox pour les directions
 * Plus précis que Google Directions pour l'Afrique
 */
export const generateMapboxDirectionsUrl = (
  from: Coordinates,
  to: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): string => {
  return `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}&language=fr`;
};

/**
 * Ouvre une carte dans un nouvel onglet avec fallback intelligent
 * Essaie Mapbox d'abord, puis OpenStreetMap
 */
export const openMapLocation = (coordinates: Coordinates): void => {
  try {
    // Essayer d'abord Mapbox (plus précis)
    const mapboxUrl = generateMapboxStaticUrl(coordinates);
    window.open(mapboxUrl, '_blank');
  } catch (error) {
    console.warn('Mapbox indisponible, utilisation d\'OpenStreetMap:', error);
    // Fallback vers OpenStreetMap
    const osmUrl = generateOSMUrl(coordinates);
    window.open(osmUrl, '_blank');
  }
};

/**
 * Ouvre une recherche d'adresse avec fallback intelligent
 */
export const openAddressSearch = (address: string): void => {
  try {
    // Utiliser OpenStreetMap (gratuit et fiable)
    const osmUrl = generateOSMSearchUrl(address);
    window.open(osmUrl, '_blank');
  } catch (error) {
    console.warn('Erreur ouverture OpenStreetMap:', error);
    // Fallback vers recherche générique
    window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`, '_blank');
  }
};

/**
 * Ouvre les directions avec fallback intelligent
 */
export const openDirections = (
  from: Coordinates | null,
  to: Coordinates
): void => {
  try {
    // Utiliser OpenStreetMap pour les directions (gratuit)
    const directionsUrl = generateOSMDirectionsUrl(from, to);
    window.open(directionsUrl, '_blank');
  } catch (error) {
    console.warn('Erreur ouverture directions:', error);
    // Fallback vers carte simple
    openMapLocation(to);
  }
};

/**
 * Détecte le quartier d'Abidjan basé sur les coordonnées
 * Utile pour la géolocalisation contextuelle
 */
export const detectAbidjanNeighborhood = (coordinates: Coordinates): string => {
  const { latitude: lat, longitude: lng } = coordinates;
  
  // Coordonnées approximatives des quartiers d'Abidjan
  const neighborhoods = [
    { name: 'Yopougon', bounds: { latMin: 5.32, latMax: 5.36, lngMin: -4.12, lngMax: -4.08 } },
    { name: 'Cocody', bounds: { latMin: 5.35, latMax: 5.38, lngMin: -4.02, lngMax: -3.98 } },
    { name: 'Plateau', bounds: { latMin: 5.31, latMax: 5.33, lngMin: -4.04, lngMax: -4.02 } },
    { name: 'Adjamé', bounds: { latMin: 5.34, latMax: 5.36, lngMin: -4.05, lngMax: -4.03 } },
    { name: 'Treichville', bounds: { latMin: 5.29, latMax: 5.31, lngMin: -4.03, lngMax: -4.01 } },
    { name: 'Marcory', bounds: { latMin: 5.29, latMax: 5.31, lngMin: -4.01, lngMax: -3.99 } },
    { name: 'Koumassi', bounds: { latMin: 5.27, latMax: 5.29, lngMin: -3.99, lngMax: -3.97 } },
    { name: 'Port-Bouët', bounds: { latMin: 5.25, latMax: 5.27, lngMin: -3.97, lngMax: -3.95 } }
  ];

  for (const neighborhood of neighborhoods) {
    const { bounds } = neighborhood;
    if (lat >= bounds.latMin && lat <= bounds.latMax && 
        lng >= bounds.lngMin && lng <= bounds.lngMax) {
      return neighborhood.name;
    }
  }

  return 'Abidjan'; // Fallback générique
};

/**
 * Valide si des coordonnées sont dans la région d'Abidjan
 */
export const isInAbidjanRegion = (coordinates: Coordinates): boolean => {
  const { latitude: lat, longitude: lng } = coordinates;
  
  // Limites approximatives du Grand Abidjan
  const abidjanBounds = {
    latMin: 5.2,
    latMax: 5.4,
    lngMin: -4.2,
    lngMax: -3.9
  };

  return lat >= abidjanBounds.latMin && lat <= abidjanBounds.latMax &&
         lng >= abidjanBounds.lngMin && lng <= abidjanBounds.lngMax;
};

/**
 * Calcule la distance approximative entre deux points (en km)
 * Utilise la formule de Haversine
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Export des constantes utiles
export const MAP_STYLES = {
  MAPBOX_STREETS: 'mapbox://styles/mapbox/streets-v12',
  MAPBOX_SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12',
  MAPBOX_LIGHT: 'mapbox://styles/mapbox/light-v11',
  MAPBOX_DARK: 'mapbox://styles/mapbox/dark-v11'
};

export const MARKER_COLORS = {
  PRIMARY: '10B981', // Vert (pressing principal)
  SECONDARY: '3B82F6', // Bleu (zones de livraison)
  WARNING: 'F59E0B', // Orange (attention)
  DANGER: 'EF4444', // Rouge (erreur/urgent)
  INFO: '6B7280' // Gris (information)
};

// 📝 NOTES D'UTILISATION :
// ✅ Toutes les fonctions utilisent Mapbox ou OpenStreetMap (plus de Google Maps)
// ✅ Fallback intelligent en cas d'erreur
// ✅ Optimisé pour la Côte d'Ivoire et Abidjan
// ✅ Support des quartiers locaux
// ✅ Géocodage et directions précis pour l'Afrique
// ✅ Interface simple et cohérente
