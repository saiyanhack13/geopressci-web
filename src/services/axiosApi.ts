import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://geopressci-b55css5d.b4a.run/api/v1';

// Création de l'instance Axios
const axiosApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
axiosApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('geopressci_access_token') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('geopressci_access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
axiosApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Ne pas déconnecter pour certains endpoints publics ou non critiques
      const publicEndpoints = [
        '/available-slots',
        '/public/',
        '/pressings/', // endpoints publics de pressing
        '/maps/',
        '/health'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));
      
      if (!isPublicEndpoint) {
        // Token expiré ou invalide pour un endpoint protégé
        console.warn('🔐 Token expiré pour endpoint protégé:', url);
        
        // Nettoyer les tokens
        localStorage.removeItem('geopressci_access_token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('geopressci_access_token');
        localStorage.removeItem('geopressci_user');
        sessionStorage.removeItem('geopressci_user');
        
        // Rediriger vers la page de connexion si nécessaire
        if (window.location.pathname !== '/login' && 
            window.location.pathname !== '/register' &&
            window.location.pathname !== '/' &&
            !window.location.pathname.startsWith('/client/pressing/')) {
          console.log('🔄 Redirection vers login pour endpoint protégé');
          window.location.href = '/login';
        }
      } else {
        console.warn('⚠️ Erreur 401 sur endpoint public/non critique:', url, '- Pas de déconnexion');
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosApi;
