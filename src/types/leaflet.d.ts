// Déclarations de types pour Leaflet - Configuration permissive
declare module 'leaflet' {
  const leaflet: any;
  export = leaflet;
  export as namespace L;
}

declare module 'leaflet-routing-machine' {
  const LRM: any;
  export = LRM;
}
