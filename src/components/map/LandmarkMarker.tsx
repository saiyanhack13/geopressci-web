// @ts-nocheck
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Landmark } from '../../data/landmarks';
import * as L from 'leaflet';

const getIcon = (type: Landmark['type']) => {
  let iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684908.png'; // Icône par défaut (pin)
  switch (type) {
    case 'monument':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/3202/3202142.png'; // Icône de monument/bâtiment
      break;
    case 'marché':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/1261/1261126.png'; // Icône de marché/panier
      break;
    case 'pharmacie':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/2966/2966498.png'; // Icône de pharmacie/croix
      break;
  }
  return new L.Icon({
    iconUrl,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
  });
};

interface LandmarkMarkerProps {
  landmark: Landmark;
}

const LandmarkMarker: React.FC<LandmarkMarkerProps> = ({ landmark }) => {
  return (
    <Marker position={landmark.position} icon={getIcon(landmark.type)} opacity={0.8}>
      <Popup>
        <strong>{landmark.nom}</strong><br />
        <em>{landmark.type.charAt(0).toUpperCase() + landmark.type.slice(1)}</em>
      </Popup>
    </Marker>
  );
};

export default LandmarkMarker;
