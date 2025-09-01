/// <reference types="leaflet" />

// Déclarations de types pour Leaflet - Configuration compatible
declare global {
  namespace L {
    // Ensure L namespace is available globally
  }
}

declare module 'leaflet-routing-machine' {
  const LRM: any;
  export = LRM;
}
