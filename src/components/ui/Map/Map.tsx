// @ts-nocheck
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';

// IMPORTANT: Assurez-vous d'importer le CSS de Leaflet dans votre fichier principal (ex: index.tsx ou App.tsx)
// import 'leaflet/dist/leaflet.css';

interface MapMarker {
  position: [number, number];
  popupContent: React.ReactNode;
}

interface MapProps {
  center: LatLngExpression;
  zoom: number;
  markers?: MapMarker[];
  className?: string;
}

// Création d'une icône personnalisée
const customIcon = new Icon({
  iconUrl: '/marker-icon.png', // Assurez-vous d'avoir une icône de marqueur dans votre dossier public
  iconSize: [38, 38], // taille de l'icône
});

const Map: React.FC<MapProps> = ({ center, zoom, markers = [], className }) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className={`h-96 w-full rounded-lg ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position} icon={customIcon}>
          <Popup>{marker.popupContent}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
