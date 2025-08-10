import React, { useState } from 'react';

interface RetryButtonProps {
  onRetry: () => void | Promise<void>;
  disabled?: boolean;
  maxRetries?: number;
  currentRetries?: number;
  cooldownSeconds?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  disabled = false,
  maxRetries = 3,
  currentRetries = 0,
  cooldownSeconds = 0,
  variant = 'primary',
  size = 'md',
  className = '',
  children
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(cooldownSeconds);

  React.useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleRetry = async () => {
    if (disabled || isRetrying || cooldownRemaining > 0 || currentRetries >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const isDisabled = disabled || isRetrying || cooldownRemaining > 0 || currentRetries >= maxRetries;

  const getButtonText = () => {
    if (children) return children;
    
    if (isRetrying) return '🔄 Tentative en cours...';
    if (cooldownRemaining > 0) return `⏳ Attendre ${cooldownRemaining}s`;
    if (currentRetries >= maxRetries) return '❌ Limite atteinte';
    if (currentRetries > 0) return `🔄 Réessayer (${currentRetries}/${maxRetries})`;
    return '🔄 Réessayer';
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleRetry}
        disabled={isDisabled}
        className={`
          w-full border rounded-lg font-medium transition-all duration-200
          ${sizeClasses[size]}
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed' 
            : variantClasses[variant]
          }
          ${isRetrying ? 'animate-pulse' : ''}
          ${className}
        `}
      >
        {getButtonText()}
      </button>

      {/* Informations sur les tentatives */}
      {maxRetries > 1 && (
        <div className="text-center space-y-1">
          <div className="flex justify-center space-x-1">
            {Array.from({ length: maxRetries }, (_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full
                  ${i < currentRetries 
                    ? 'bg-red-400' 
                    : i === currentRetries && isRetrying
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-gray-300'
                  }
                `}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {currentRetries === 0 
              ? `${maxRetries} tentatives disponibles`
              : currentRetries >= maxRetries
                ? 'Toutes les tentatives épuisées'
                : `${maxRetries - currentRetries} tentative(s) restante(s)`
            }
          </p>
        </div>
      )}
    </div>
  );
};

interface RetryWithOptionsProps {
  onRetry: () => void | Promise<void>;
  onChangeMethod: () => void;
  onCancel: () => void;
  error?: string;
  currentRetries?: number;
  maxRetries?: number;
  className?: string;
}

export const RetryWithOptions: React.FC<RetryWithOptionsProps> = ({
  onRetry,
  onChangeMethod,
  onCancel,
  error,
  currentRetries = 0,
  maxRetries = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">Erreur de paiement</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <RetryButton
          onRetry={onRetry}
          currentRetries={currentRetries}
          maxRetries={maxRetries}
          variant="primary"
        />

        <button
          onClick={onChangeMethod}
          className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          🔄 Changer de méthode de paiement
        </button>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ❌ Annuler la transaction
        </button>
      </div>

      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Conseils:</strong></p>
        <ul className="space-y-1">
          <li>• Vérifiez votre solde Mobile Money</li>
          <li>• Assurez-vous d'avoir une bonne connexion</li>
          <li>• Contactez votre opérateur si le problème persiste</li>
        </ul>
      </div>
    </div>
  );
};

export default RetryButton;
