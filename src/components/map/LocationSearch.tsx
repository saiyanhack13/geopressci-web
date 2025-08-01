import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import { landmarksData, Landmark } from '../../data/landmarks';

// Coordonnées approximatives pour quelques quartiers d'Abidjan
const abidjanQuartiers: { [key: string]: [number, number] } = {
  'Cocody': [5.3591, -3.9834],
  'Plateau': [5.3235, -4.0243],
  'Yopougon': [5.3333, -4.0833],
  'Marcory': [5.2958, -3.9942],
  'Treichville': [5.2996, -4.0155],
};

const LocationSearch: React.FC = () => {
  const map = useMap();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    const target = searchTerm.trim().toLowerCase();

    // Recherche dans les quartiers
    const quartier = Object.keys(abidjanQuartiers).find(q => q.toLowerCase() === target);
    if (quartier && abidjanQuartiers[quartier]) {
      const position = abidjanQuartiers[quartier];
      map.flyTo(position, 15);
      return;
    }

    // Recherche dans les points de repère
    const landmark = landmarksData.find((landmark: Landmark) => landmark.nom.toLowerCase().includes(target));
    if (landmark) {
      map.flyTo(landmark.position, 17);
      return;
    }

    alert('Lieu non trouvé. Essayez un nom de quartier ou de point de repère connu.');
  };
  

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
      <input 
        type="text" 
        placeholder="Rechercher un quartier..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        style={{ marginRight: '5px' }}
      />
      <button onClick={handleSearch}>Rechercher</button>
    </div>
  );
};

export default LocationSearch;
