/**
 * Utilitaires avancés pour la gestion d'erreur frontend
 * Améliore l'expérience utilisateur avec des messages contextuels
 */

import { toast } from 'react-hot-toast';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Types d'erreurs personnalisés
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  code?: string;
  statusCode?: number;
}

export interface NetworkError {
  name: 'NetworkError';
  message: string;
  stack?: string;
}

export type AppError = FetchBaseQueryError | SerializedError | ApiErrorResponse | NetworkError;

// Configuration des messages d'erreur contextuels
const ERROR_MESSAGES = {
  // Erreurs réseau
  NETWORK_ERROR: {
    title: '🌐 Problème de connexion',
    message: 'Vérifiez votre connexion internet et réessayez.',
    action: 'Réessayer'
  },
  TIMEOUT_ERROR: {
    title: '⏱️ Délai d\'attente dépassé',
    message: 'La requête prend plus de temps que prévu. Veuillez patienter ou réessayer.',
    action: 'Réessayer'
  },
  SERVER_ERROR: {
    title: '🔧 Erreur serveur',
    message: 'Une erreur technique est survenue. Notre équipe a été notifiée.',
    action: 'Réessayer plus tard'
  },
  
  // Erreurs d'authentification
  UNAUTHORIZED: {
    title: '🔐 Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    action: 'Se reconnecter'
  },
  FORBIDDEN: {
    title: '🚫 Accès refusé',
    message: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
    action: 'Contacter le support'
  },
  
  // Erreurs de validation
  VALIDATION_ERROR: {
    title: '📝 Données invalides',
    message: 'Veuillez corriger les erreurs dans le formulaire.',
    action: 'Corriger'
  },
  
  // Erreurs spécifiques aux pressings
  PRESSING_NOT_FOUND: {
    title: '🏢 Pressing introuvable',
    message: 'Le pressing demandé n\'existe pas ou a été supprimé.',
    action: 'Retour à la liste'
  },
  GEOLOCATION_ERROR: {
    title: '📍 Erreur de géolocalisation',
    message: 'Impossible de déterminer votre position. Vérifiez vos paramètres GPS.',
    action: 'Saisir manuellement'
  },
  UPLOAD_ERROR: {
    title: '📸 Erreur d\'upload',
    message: 'Impossible d\'uploader l\'image. Vérifiez le format et la taille.',
    action: 'Réessayer'
  }
};

// Détecteur de type d'erreur
export const getErrorType = (error: AppError): keyof typeof ERROR_MESSAGES => {
  // Erreur RTK Query avec status
  if ('status' in error) {
    switch (error.status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'PRESSING_NOT_FOUND';
      case 400:
        return 'VALIDATION_ERROR';
      case 500:
      case 502:
      case 503:
        return 'SERVER_ERROR';
      case 'FETCH_ERROR':
        return 'NETWORK_ERROR';
      case 'TIMEOUT_ERROR':
        return 'TIMEOUT_ERROR';
      default:
        return 'SERVER_ERROR';
    }
  }
  
  // Erreur sérialisée
  if ('name' in error) {
    if (error.name === 'NetworkError') {
      return 'NETWORK_ERROR';
    }
    if (error.name === 'TimeoutError') {
      return 'TIMEOUT_ERROR';
    }
  }
  
  // Erreur API personnalisée
  if ('success' in error && !error.success) {
    if (error.code === 'GEOLOCATION_ERROR') {
      return 'GEOLOCATION_ERROR';
    }
    if (error.code === 'UPLOAD_ERROR') {
      return 'UPLOAD_ERROR';
    }
    if (error.statusCode === 400) {
      return 'VALIDATION_ERROR';
    }
  }
  
  return 'SERVER_ERROR';
};

// Extracteur de message d'erreur
export const getErrorMessage = (error: AppError): string => {
  // Erreur RTK Query avec data
  if ('status' in error && error.data) {
    const data = error.data as any;
    if (data.message) {
      return data.message;
    }
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((err: any) => err.message).join(', ');
    }
  }
  
  // Erreur sérialisée
  if ('message' in error && error.message) {
    return error.message;
  }
  
  // Erreur API personnalisée
  if ('message' in error && error.message) {
    return error.message;
  }
  
  const errorType = getErrorType(error);
  return ERROR_MESSAGES[errorType].message;
};

// Gestionnaire d'erreur principal
export const handleApiError = (
  error: AppError,
  context?: string,
  customHandler?: (error: AppError) => void
) => {
  const errorType = getErrorType(error);
  const errorConfig = ERROR_MESSAGES[errorType];
  const message = getErrorMessage(error);
  
  // Logging pour le debugging
  console.error(`[${context || 'API'}] ${errorType}:`, error);
  
  // Handler personnalisé si fourni
  if (customHandler) {
    customHandler(error);
    return;
  }
  
  // Affichage du toast selon le type d'erreur
  switch (errorType) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT_ERROR':
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 6000,
        id: 'network-error',
        icon: '🌐'
      });
      break;
      
    case 'UNAUTHORIZED':
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 8000,
        id: 'auth-error',
        icon: '🔐'
      });
      // Redirection vers login après 2 secondes
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      break;
      
    case 'VALIDATION_ERROR':
      // Pour les erreurs de validation, afficher chaque erreur
      if ('status' in error && error.data) {
        const data = error.data as any;
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any, index: number) => {
            toast.error(`${err.field}: ${err.message}`, {
              duration: 5000,
              id: `validation-error-${index}`,
              icon: '📝'
            });
          });
          return;
        }
      }
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 5000,
        id: 'validation-error',
        icon: '📝'
      });
      break;
      
    case 'GEOLOCATION_ERROR':
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 8000,
        id: 'geolocation-error',
        icon: '📍'
      });
      break;
      
    case 'UPLOAD_ERROR':
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 6000,
        id: 'upload-error',
        icon: '📸'
      });
      break;
      
    default:
      toast.error(`${errorConfig.title}\n${message}`, {
        duration: 5000,
        id: 'general-error',
        icon: '❌'
      });
  }
};

// Hook personnalisé pour la gestion d'erreur dans les composants
export const useErrorHandler = () => {
  const handleError = (error: AppError, context?: string) => {
    handleApiError(error, context);
  };
  
  const handleValidationErrors = (errors: Array<{ field: string; message: string }>) => {
    errors.forEach((error, index) => {
      toast.error(`${error.field}: ${error.message}`, {
        duration: 5000,
        id: `validation-${index}`,
        icon: '📝'
      });
    });
  };
  
  const handleNetworkError = (retryFn?: () => void) => {
    if (retryFn) {
      // Afficher un toast avec bouton de retry
      toast.error('🌐 Problème de connexion\nVérifiez votre réseau internet', {
        duration: 8000,
        id: 'network-error'
      });
      
      // Afficher un toast de suggestion d'action séparé
      setTimeout(() => {
        toast('💡 Appuyez sur Échap puis cliquez ici pour réessayer', {
          duration: 6000,
          id: 'network-retry',
          icon: '🔄',
          onClick: () => {
            toast.dismiss('network-error');
            toast.dismiss('network-retry');
            retryFn();
          }
        } as any);
      }, 1000);
    } else {
      toast.error('🌐 Problème de connexion\nVérifiez votre réseau internet', {
        duration: 8000,
        id: 'network-error'
      });
    }
  };
  
  const handleGeolocationError = (fallbackFn?: () => void) => {
    if (fallbackFn) {
      // Afficher un toast d'erreur
      toast.error('📍 Géolocalisation indisponible\nUtilisez la saisie manuelle', {
        duration: 8000,
        id: 'geolocation-error'
      });
      
      // Afficher un toast de suggestion d'action séparé
      setTimeout(() => {
        toast('💡 Appuyez sur Échap puis cliquez ici pour la saisie manuelle', {
          duration: 6000,
          id: 'geolocation-fallback',
          icon: '📝',
          onClick: () => {
            toast.dismiss('geolocation-error');
            toast.dismiss('geolocation-fallback');
            fallbackFn();
          }
        } as any);
      }, 1000);
    } else {
      toast.error('📍 Géolocalisation indisponible\nUtilisez la saisie manuelle', {
        duration: 8000,
        id: 'geolocation-error'
      });
    }
  };
  
  return {
    handleError,
    handleValidationErrors,
    handleNetworkError,
    handleGeolocationError
  };
};

// Wrapper pour les mutations RTK Query avec gestion d'erreur automatique
export const withErrorHandling = <T extends (...args: any[]) => any>(
  mutationFn: T,
  context?: string,
  successMessage?: string
) => {
  return async (...args: Parameters<T>) => {
    try {
      const result = await mutationFn(...args);
      
      if (result.error) {
        handleApiError(result.error, context);
        return { success: false, error: result.error };
      }
      
      if (successMessage) {
        toast.success(successMessage, {
          duration: 4000,
          icon: '✅'
        });
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      handleApiError(error as AppError, context);
      return { success: false, error };
    }
  };
};

// Détecteur de statut de connexion
export const createConnectionMonitor = () => {
  let isOnline = navigator.onLine;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  
  const handleOnline = () => {
    if (!isOnline) {
      isOnline = true;
      reconnectAttempts = 0;
      toast.success('🟢 Connexion rétablie', {
        duration: 3000,
        id: 'connection-restored'
      });
    }
  };
  
  const handleOffline = () => {
    if (isOnline) {
      isOnline = false;
      toast.error('🔴 Connexion perdue\nMode hors ligne activé', {
        duration: 0, // Reste affiché jusqu'à reconnexion
        id: 'connection-lost'
      });
    }
  };
  
  const attemptReconnect = async () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      toast.error('❌ Impossible de se reconnecter\nVérifiez votre connexion', {
        duration: 8000,
        id: 'reconnect-failed'
      });
      return false;
    }
    
    reconnectAttempts++;
    toast.loading(`🔄 Tentative de reconnexion (${reconnectAttempts}/${maxReconnectAttempts})`, {
      id: 'reconnecting'
    });
    
    try {
      // Test de connectivité simple
      await fetch('/api/v1/health', { method: 'HEAD', cache: 'no-cache' });
      handleOnline();
      toast.dismiss('reconnecting');
      return true;
    } catch {
      setTimeout(attemptReconnect, 2000 * reconnectAttempts); // Délai croissant
      return false;
    }
  };
  
  // Écouter les événements de connexion
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return {
    isOnline: () => isOnline,
    attemptReconnect,
    cleanup: () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

export default {
  handleApiError,
  useErrorHandler,
  withErrorHandling,
  createConnectionMonitor,
  getErrorType,
  getErrorMessage
};
