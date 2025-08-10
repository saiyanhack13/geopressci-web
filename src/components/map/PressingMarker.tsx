// @ts-nocheck
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Pressing } from '../../types/pressing';
import * as L from 'leaflet';

// Optionnel: Définir une icône personnalisée pour les pressings
const pressingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048904.png', // URL d'une icône de cintre/pressing
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

interface PressingMarkerProps {
  pressing: Pressing;
  position: [number, number];
  isUserLocation?: boolean;
  onClick?: () => void;
}

const PressingMarker: React.FC<PressingMarkerProps> = ({ pressing, position, isUserLocation, onClick }) => {
  return (
    <Marker position={position} icon={pressingIcon}>
      <Popup>
        <strong>{pressing.name}</strong><br />
        {pressing.address}<br />
        <strong>Services:</strong> {pressing.services.join(', ')}<br />
        <strong>Note:</strong> {pressing.rating} / 5<br />
        <button onClick={onClick} style={{ marginTop: '5px', cursor: 'pointer' }}>Voir l'itinéraire</button>
      </Popup>
    </Marker>
  );
};

export default PressingMarker;
