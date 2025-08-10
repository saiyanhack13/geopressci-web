import React from 'react';

export interface MobileMoneyOperator {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  color: string;
  prefix: string[];
  maxLength: number;
  minLength: number;
}

export const MOBILE_MONEY_OPERATORS: MobileMoneyOperator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    displayName: 'Orange Money',
    logo: '🟠',
    color: '#FF6600',
    prefix: ['07', '08', '09'],
    maxLength: 10,
    minLength: 10
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    displayName: 'MTN MoMo',
    logo: '🟡',
    color: '#FFCC00',
    prefix: ['05', '06'],
    maxLength: 10,
    minLength: 10
  },
  {
    id: 'moov',
    name: 'Moov Africa Money',
    displayName: 'Moov Money',
    logo: '🔵',
    color: '#0066CC',
    prefix: ['01', '02', '03'],
    maxLength: 10,
    minLength: 10
  },
  {
    id: 'wave',
    name: 'Wave',
    displayName: 'Wave',
    logo: '💙',
    color: '#00B4D8',
    prefix: ['07', '08', '09', '05', '06', '01', '02', '03'],
    maxLength: 10,
    minLength: 10
  }
];

interface MobileMoneyOperatorCardProps {
  operator: MobileMoneyOperator;
  selected: boolean;
  onClick: () => void;
}

const MobileMoneyOperatorCard: React.FC<MobileMoneyOperatorCardProps> = ({
  operator,
  selected,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${operator.color}20` }}
        >
          {operator.logo}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{operator.displayName}</h3>
          <p className="text-sm text-gray-500">
            Numéros: {operator.prefix.join(', ')} XX XX XX
          </p>
        </div>
      </div>
    </div>
  );
};

interface MobileMoneyOperatorSelectorProps {
  selectedOperator: MobileMoneyOperator | null;
  onOperatorSelect: (operator: MobileMoneyOperator) => void;
  className?: string;
}

export const MobileMoneyOperatorSelector: React.FC<MobileMoneyOperatorSelectorProps> = ({
  selectedOperator,
  onOperatorSelect,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏦 Choisissez votre opérateur Mobile Money
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {MOBILE_MONEY_OPERATORS.map((operator) => (
          <MobileMoneyOperatorCard
            key={operator.id}
            operator={operator}
            selected={selectedOperator?.id === operator.id}
            onClick={() => onOperatorSelect(operator)}
          />
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Astuce:</strong> Assurez-vous que votre compte Mobile Money a suffisamment de solde avant de continuer.
        </p>
      </div>
    </div>
  );
};

export default MobileMoneyOperatorSelector;
