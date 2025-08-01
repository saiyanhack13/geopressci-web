import React, { useState, useEffect } from 'react';
import { MobileMoneyOperator } from './MobileMoneySelector';

interface NumberInputProps {
  operator: MobileMoneyOperator | null;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  operator,
  value,
  onChange,
  error,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format le numéro pour l'affichage (XX XX XX XX XX)
  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Valide le numéro selon l'opérateur sélectionné
  const validateNumber = (num: string): string | null => {
    if (!operator) return "Veuillez d'abord sélectionner un opérateur";
    
    const cleaned = num.replace(/\D/g, '');
    
    if (cleaned.length === 0) return null;
    
    if (cleaned.length < operator.minLength) {
      return `Le numéro doit contenir au moins ${operator.minLength} chiffres`;
    }
    
    if (cleaned.length > operator.maxLength) {
      return `Le numéro ne peut pas dépasser ${operator.maxLength} chiffres`;
    }
    
    // Vérifier le préfixe pour les opérateurs spécifiques (sauf Wave)
    if (operator.id !== 'wave') {
      const prefix = cleaned.substring(0, 2);
      if (!operator.prefix.includes(prefix)) {
        return `Numéro invalide pour ${operator.displayName}. Préfixes acceptés: ${operator.prefix.join(', ')}`;
      }
    }
    
    return null;
  };

  useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleaned = inputValue.replace(/\D/g, '');
    
    // Limiter à 10 chiffres maximum
    if (cleaned.length <= 10) {
      onChange(cleaned);
      setDisplayValue(formatNumber(cleaned));
    }
  };

  const validationError = validateNumber(value);
  const finalError = error || validationError;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        📱 Numéro Mobile Money
        {operator && (
          <span className="ml-2 text-xs text-gray-500">
            ({operator.displayName})
          </span>
        )}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">+225</span>
        </div>
        
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={operator ? `${operator.prefix[0]} XX XX XX XX` : "Sélectionnez d'abord un opérateur"}
          disabled={!operator}
          className={`
            block w-full pl-16 pr-3 py-3 border rounded-lg text-lg font-mono
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${finalError 
              ? 'border-red-300 bg-red-50' 
              : operator 
                ? 'border-gray-300' 
                : 'border-gray-200 bg-gray-50'
            }
          `}
        />
        
        {operator && value && !finalError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-green-500 text-xl">✓</span>
          </div>
        )}
      </div>
      
      {finalError && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {finalError}
        </p>
      )}
      
      {operator && !finalError && value.length > 0 && (
        <p className="text-sm text-green-600 flex items-center">
          <span className="mr-1">✅</span>
          Numéro valide pour {operator.displayName}
        </p>
      )}
      
      {operator && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Préfixes acceptés: {operator.prefix.join(', ')}</p>
          <p>• Format: +225 XX XX XX XX XX</p>
        </div>
      )}
    </div>
  );
};

export default NumberInput;
