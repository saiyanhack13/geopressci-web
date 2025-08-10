import React from 'react';
import { useApiConnection } from '../../hooks/useApiConnection';

interface ApiConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

const ApiConnectionStatus: React.FC<ApiConnectionStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { config, isLoading, error, isConnected, connectionStatus, retryConnection } = useApiConnection();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '✅';
      case 'checking':
        return '🔄';
      case 'error':
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connecté';
      case 'checking':
        return 'Vérification...';
      case 'error':
        return 'Erreur de connexion';
      case 'disconnected':
        return 'Déconnecté';
      default:
        return 'Statut inconnu';
    }
  };

  if (!showDetails && isConnected) {
    return null; // Ne rien afficher si tout va bien et qu'on ne veut pas les détails
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()} ${className}`}>
      <span className="mr-2">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      
      {showDetails && config && (
        <span className="ml-2 text-xs opacity-75">
          ({config.environment === 'development' ? 'Local' : 'Production'})
        </span>
      )}
      
      {error && !isConnected && (
        <button
          onClick={retryConnection}
          className="ml-2 text-xs underline hover:no-underline"
          disabled={isLoading}
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
