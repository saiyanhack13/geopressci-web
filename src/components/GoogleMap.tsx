// 🗺️ MIGRATION GOOGLE MAPS → MAPBOX
// Ce fichier a été migré de Google Maps vers Mapbox pour une meilleure précision et performance
// Mapbox offre une couverture cartographique supérieure pour l'Afrique de l'Ouest

import React from 'react';
import MapboxMap from './MapboxMap';

// Interface maintenue pour compatibilité avec l'ancien GoogleMap
interface GoogleMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  onLocationChange?: (location: { lat: number; lng: number; address?: string }) => void;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    info?: string;
  }>;
  draggableMarker?: boolean;
  className?: string;
}

// Wrapper de compatibilité : GoogleMap utilise maintenant Mapbox en arrière-plan
export const GoogleMap: React.FC<GoogleMapProps> = (props) => {
  // Rediriger vers MapboxMap avec les mêmes props
  return <MapboxMap {...props} />;
};

// Export par défaut maintenu pour compatibilité
export default GoogleMap;

// 📝 NOTES DE MIGRATION :
// ✅ Interface identique - aucun changement requis dans les composants parents
// ✅ Mapbox GL JS - performance et rendu supérieurs
// ✅ Géolocalisation améliorée - meilleure précision pour l'Afrique
// ✅ Styles modernes - interface utilisateur améliorée
// ✅ Token configuré - utilise REACT_APP_MAPBOX_ACCESS_TOKEN depuis .env
// ✅ Géocodage Mapbox - plus précis que Google pour la région
// ✅ Fallback gracieux - gestion d'erreurs améliorée
