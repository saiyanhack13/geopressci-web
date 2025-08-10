import { useState, useEffect, useCallback } from 'react';
import { getApiConfig, ApiConfig, API_URLS } from '../config/api.config';

interface ApiConnectionState {
  config: ApiConfig | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'disconnected' | 'error';
  retryConnection: () => Promise<void>;
}

export const useApiConnection = (): ApiConnectionState => {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ApiConnectionState['connectionStatus']>('checking');

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    setConnectionStatus('checking');
    setError(null);

    try {
      console.log('🔍 Vérification de la connexion API...');
      
      const apiConfig = await getApiConfig();
      setConfig(apiConfig);

      // Test de ping sur l'API configurée
      const response = await fetch(`${apiConfig.baseUrl}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 secondes timeout
      });

      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('✅ Connexion API établie:', apiConfig.baseUrl);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion inconnue';
      setError(errorMessage);
      setIsConnected(false);
      setConnectionStatus('error');
      console.error('❌ Erreur de connexion API:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryConnection = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    config,
    isLoading,
    error,
    isConnected,
    connectionStatus,
    retryConnection,
  };
};

// Hook pour obtenir l'URL API actuelle
export const useApiUrl = (): string => {
  const { config } = useApiConnection();
  return config?.baseUrl || API_URLS.development;
};

// Hook pour vérifier si on est en mode développement
export const useIsDevelopment = (): boolean => {
  const { config } = useApiConnection();
  return config?.environment === 'development';
};
