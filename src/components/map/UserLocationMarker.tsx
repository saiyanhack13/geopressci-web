// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';

// Correction pour l'icône par défaut de Leaflet avec Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface UserLocationMarkerProps {
  onLocationFound: (latlng: LatLng) => void;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ onLocationFound }) => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();

  const handleLocateClick = () => {
    map.locate().on('locationfound', function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15); // Zoom à 15 pour une meilleure vue
      onLocationFound(e.latlng);
    });
  };

  // Ajouter un bouton de localisation
  useEffect(() => {
    // Créer un contrôle personnalisé
    const LocateButton = Control.extend({
      onAdd: function() {
        const div = DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = DomUtil.create('a', 'leaflet-bar-part');
        button.innerHTML = '📍';
        button.style.fontSize = '20px';
        button.style.lineHeight = '30px';
        button.style.cursor = 'pointer';
        button.title = 'Me localiser';
        
        DomEvent.on(button, 'click', (e) => {
          DomEvent.stopPropagation(e);
          handleLocateClick();
        });
        
        div.appendChild(button);
        return div;
      }
    });

    // Ajouter le contrôle à la carte
    const locateControl = new LocateButton({ position: 'topleft' });
    map.addControl(locateControl);
    
    return () => {
      map.removeControl(locateControl);
    };
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Vous êtes ici</Popup>
    </Marker>
  );
};

export default UserLocationMarker;
