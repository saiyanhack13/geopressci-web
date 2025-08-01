import React from 'react';

interface AmountDisplayProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCurrency?: boolean;
  className?: string;
  breakdown?: {
    subtotal?: number;
    fees?: number;
    discount?: number;
  };
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  label = 'Montant',
  size = 'md',
  showCurrency = true,
  className = '',
  breakdown
}) => {
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-center">
        <p className={`text-gray-600 font-medium ${labelSizeClasses[size]}`}>
          💰 {label}
        </p>
        <div className={`font-bold text-gray-900 ${sizeClasses[size]} flex items-center justify-center space-x-2`}>
          <span>{formatAmount(amount)}</span>
          {showCurrency && <span className="text-green-600">FCFA</span>}
        </div>
      </div>

      {breakdown && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm mb-3">📋 Détail du montant</h4>
          
          {breakdown.subtotal && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-medium">{formatAmount(breakdown.subtotal)} FCFA</span>
            </div>
          )}
          
          {breakdown.fees && breakdown.fees > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Frais de transaction</span>
              <span className="font-medium text-orange-600">+{formatAmount(breakdown.fees)} FCFA</span>
            </div>
          )}
          
          {breakdown.discount && breakdown.discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Réduction</span>
              <span className="font-medium text-green-600">-{formatAmount(breakdown.discount)} FCFA</span>
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center font-semibold">
              <span>Total à payer</span>
              <span className="text-lg text-blue-600">{formatAmount(amount)} FCFA</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 Montant en Francs CFA (XOF)
        </p>
      </div>
    </div>
  );
};

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  error?: string;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 100,
  label = 'Montant',
  error,
  className = ''
}) => {
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(inputValue) || 0;
    
    if (numericValue >= min && numericValue <= max) {
      onChange(numericValue);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 {label}
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={formatAmount(value)}
            onChange={handleChange}
            className={`
              block w-full px-4 py-3 text-lg font-mono text-right border rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm font-medium">FCFA</span>
          </div>
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">💡 Montants rapides:</p>
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => onChange(amount)}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors
                ${value === amount 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {formatAmount(amount)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmountDisplay;
