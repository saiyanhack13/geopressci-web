import React from 'react';

// Définition des opérateurs de Mobile Money
const providers = [
  {
    name: 'Orange Money',
    logoUrl: '/logos/orange-money.png', // Assurez-vous que les logos sont dans le dossier public/logos
  },
  {
    name: 'Moov Money',
    logoUrl: '/logos/moov-money.png',
  },
  {
    name: 'MTN Mobile Money',
    logoUrl: '/logos/mtn-momo.png',
  },
  {
    name: 'Wave',
    logoUrl: '/logos/wave.png',
  },
];

interface MobileMoneySelectorProps {
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

const MobileMoneySelector: React.FC<MobileMoneySelectorProps> = ({ selectedValue, onChange, className }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {providers.map((provider) => {
        const isSelected = selectedValue === provider.name;
        return (
          <div
            key={provider.name}
            onClick={() => onChange(provider.name)}
            className={`p-4 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-primary scale-105 shadow-lg' // Style pour l'élément sélectionné
                : 'border-neutral-200 hover:border-primary' // Style par défaut et au survol
            }`}
          >
            <img src={provider.logoUrl} alt={provider.name} className="h-10 object-contain" />
          </div>
        );
      })}
    </div>
  );
};

export default MobileMoneySelector;
