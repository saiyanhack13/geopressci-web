import React from 'react';

const allServices = ['Nettoyage à sec', 'Repassage', 'Blanchisserie', 'Livraison'];

interface FilterPanelProps {
  selectedServices: string[];
  minRating: number;
  onServiceChange: (service: string) => void;
  onRatingChange: (rating: number) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ selectedServices, minRating, onServiceChange, onRatingChange }) => {
  return (
    <div style={{ position: 'absolute', top: 60, right: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px', width: '200px' }}>
      <h4>Filtrer par service</h4>
      {allServices.map(service => (
        <div key={service}>
          <input 
            type="checkbox" 
            id={service}
            checked={selectedServices.includes(service)}
            onChange={() => onServiceChange(service)}
          />
          <label htmlFor={service} style={{ marginLeft: '5px' }}>{service}</label>
        </div>
      ))}
      <h4 style={{ marginTop: '15px' }}>Note minimale</h4>
      <input 
        type="number" 
        min="0" 
        max="5" 
        step="0.1"
        value={minRating}
        onChange={(e) => onRatingChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default FilterPanel;
