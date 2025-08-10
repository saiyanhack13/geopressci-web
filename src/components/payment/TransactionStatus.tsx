import React from 'react';

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout';

interface TransactionStatusProps {
  status: TransactionStatus;
  message?: string;
  transactionId?: string;
  timestamp?: Date;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: '⏳',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'En attente',
    defaultMessage: 'Votre transaction est en attente de traitement...'
  },
  processing: {
    icon: '🔄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'En cours',
    defaultMessage: 'Traitement de votre paiement en cours...'
  },
  success: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Succès',
    defaultMessage: 'Votre paiement a été effectué avec succès !'
  },
  failed: {
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Échec',
    defaultMessage: 'Le paiement a échoué. Veuillez réessayer.'
  },
  cancelled: {
    icon: '🚫',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Annulé',
    defaultMessage: 'La transaction a été annulée.'
  },
  timeout: {
    icon: '⏰',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Délai dépassé',
    defaultMessage: 'La transaction a expiré. Veuillez réessayer.'
  }
};

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  message,
  transactionId,
  timestamp,
  className = ''
}) => {
  const config = statusConfig[status];
  const displayMessage = message || config.defaultMessage;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 ${className}`}>
      <div className="text-center space-y-4">
        {/* Icône avec animation pour les statuts en cours */}
        <div className="flex justify-center">
          <div className={`
            text-6xl
            ${status === 'processing' ? 'animate-spin' : ''}
            ${status === 'pending' ? 'animate-pulse' : ''}
          `}>
            {config.icon}
          </div>
        </div>

        {/* Titre et message */}
        <div className="space-y-2">
          <h3 className={`text-xl font-semibold ${config.color}`}>
            {config.title}
          </h3>
          <p className="text-gray-700">
            {displayMessage}
          </p>
        </div>

        {/* Informations supplémentaires */}
        {(transactionId || timestamp) && (
          <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
            {transactionId && (
              <div className="flex justify-between items-center">
                <span>ID Transaction:</span>
                <span className="font-mono font-medium">{transactionId}</span>
              </div>
            )}
            {timestamp && (
              <div className="flex justify-between items-center">
                <span>Heure:</span>
                <span>{timestamp.toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${color} animate-spin ${className}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && <span className="font-medium">{clampedProgress}%</span>}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default TransactionStatus;
