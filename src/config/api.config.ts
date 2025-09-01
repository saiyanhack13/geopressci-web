// Configuration API pour différents environnements

export interface ApiConfig {
  baseUrl: string;
  environment: 'development' | 'production';
  timeout: number;
}

// URLs des différents environnements
const API_URLS = {
  development: process.env.REACT_APP_API_URL_DEV || 'https://geopressci-akcdaadk.b4a.run/api/v1',
  production: process.env.REACT_APP_API_URL_PROD || 'https://geopressci-akcdaadk.b4a.run//api/v1',
  // Fallback si le backend local n'est pas disponible
  fallback: process.env.REACT_APP_API_URL_PROD || 'https://geopressci-akcdaadk.b4a.run//api/v1'
} as const;

// Détecte l'environnement automatiquement
const detectEnvironment = (): 'development' | 'production' => {
  // Si on est sur localhost ou en mode développement
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000' ||
    process.env.NODE_ENV === 'development'
  ) {
    return 'development';
  }
  return 'production';
};

// Fonction pour tester si une URL est accessible
const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes timeout
    
    const response = await fetch(`${url}/ping`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`❌ API non accessible: ${url}`, error);
    return false;
  }
};

// Détermine la meilleure URL API à utiliser
export const getApiConfig = async (): Promise<ApiConfig> => {
  const environment = detectEnvironment();
  
  console.log(`🔍 Environnement détecté: ${environment}`);
  
  if (environment === 'development') {
    // En développement, essaie d'abord le serveur local
    const localAvailable = await testApiConnection(API_URLS.development);
    
    if (localAvailable) {
      console.log('✅ Utilisation du backend local');
      return {
        baseUrl: API_URLS.development,
        environment: 'development',
        timeout: 10000
      };
    } else {
      console.log('⚠️ Backend local non disponible, utilisation du backend de production');
      return {
        baseUrl: API_URLS.fallback,
        environment: 'development',
        timeout: 15000
      };
    }
  } else {
    // En production, utilise toujours le backend de production
    console.log('✅ Utilisation du backend de production');
    return {
      baseUrl: API_URLS.production,
      environment: 'production',
      timeout: 15000
    };
  }
};

// Configuration synchrone pour les cas où on ne peut pas attendre
export const getApiConfigSync = (): ApiConfig => {
  const environment = detectEnvironment();
  
  return {
    baseUrl: environment === 'development' ? API_URLS.development : API_URLS.production,
    environment,
    timeout: environment === 'development' ? 10000 : 15000
  };
};

// Export des URLs pour utilisation directe si nécessaire
export { API_URLS };

// Fonction utilitaire pour logger la configuration API
export const logApiConfig = (config: ApiConfig) => {
  console.log('🔧 Configuration API:', {
    baseUrl: config.baseUrl,
    environment: config.environment,
    timeout: config.timeout,
    timestamp: new Date().toISOString()
  });
};
