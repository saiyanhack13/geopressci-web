/**
 * Utilitaires pour optimiser le cache RTK Query
 * Améliore les performances et la cohérence des données
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Types pour les tags de cache optimisés
export interface OptimizedCacheTag {
  type: string;
  id?: string | number;
  subtype?: string;
}

// Configuration des tags de cache pour les pressings
export const PRESSING_CACHE_TAGS = {
  PROFILE: 'PressingProfile',
  STATS: 'PressingStats', 
  ORDERS: 'PressingOrders',
  SERVICES: 'PressingServices',
  REVIEWS: 'PressingReviews',
  PHOTOS: 'PressingPhotos',
  BUSINESS_HOURS: 'BusinessHours',
  DELIVERY_ZONES: 'DeliveryZones',
  EARNINGS: 'PressingEarnings',
  NOTIFICATIONS: 'PressingNotifications'
} as const;

// Générateur de tags optimisés pour éviter les invalidations inutiles
export const generateOptimizedTags = {
  // Tags pour le profil pressing avec sous-types
  profile: (pressingId?: string): OptimizedCacheTag[] => [
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current' },
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'basic' },
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'contact' },
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'address' }
  ],

  // Tags pour les horaires avec granularité fine
  businessHours: (pressingId?: string): OptimizedCacheTag[] => [
    { type: PRESSING_CACHE_TAGS.BUSINESS_HOURS, id: pressingId || 'current' },
    { type: PRESSING_CACHE_TAGS.BUSINESS_HOURS, id: pressingId || 'current', subtype: 'schedule' },
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'hours' } // Invalide aussi le profil
  ],

  // Tags pour les services avec catégories
  services: (pressingId?: string, serviceId?: string): OptimizedCacheTag[] => {
    const tags: OptimizedCacheTag[] = [
      { type: PRESSING_CACHE_TAGS.SERVICES, id: pressingId || 'current' }
    ];
    
    if (serviceId) {
      tags.push({ type: PRESSING_CACHE_TAGS.SERVICES, id: serviceId });
    }
    
    return tags;
  },

  // Tags pour les zones de livraison
  deliveryZones: (pressingId?: string, zoneId?: string): OptimizedCacheTag[] => {
    const tags: OptimizedCacheTag[] = [
      { type: PRESSING_CACHE_TAGS.DELIVERY_ZONES, id: pressingId || 'current' }
    ];
    
    if (zoneId) {
      tags.push({ type: PRESSING_CACHE_TAGS.DELIVERY_ZONES, id: zoneId });
    }
    
    return tags;
  },

  // Tags pour les photos avec types spécifiques
  photos: (pressingId?: string, photoType?: 'profile' | 'gallery' | 'cover'): OptimizedCacheTag[] => {
    const tags: OptimizedCacheTag[] = [
      { type: PRESSING_CACHE_TAGS.PHOTOS, id: pressingId || 'current' }
    ];
    
    if (photoType) {
      tags.push({ type: PRESSING_CACHE_TAGS.PHOTOS, id: pressingId || 'current', subtype: photoType });
    }
    
    return tags;
  },

  // Tags pour les statistiques avec périodes
  stats: (pressingId?: string, period?: 'daily' | 'weekly' | 'monthly'): OptimizedCacheTag[] => {
    const tags: OptimizedCacheTag[] = [
      { type: PRESSING_CACHE_TAGS.STATS, id: pressingId || 'current' }
    ];
    
    if (period) {
      tags.push({ type: PRESSING_CACHE_TAGS.STATS, id: pressingId || 'current', subtype: period });
    }
    
    return tags;
  }
};

// Stratégies d'invalidation intelligente
export const invalidationStrategies = {
  // Invalidation lors de la mise à jour du profil
  onProfileUpdate: (pressingId?: string) => [
    ...generateOptimizedTags.profile(pressingId),
    { type: PRESSING_CACHE_TAGS.STATS, id: pressingId || 'current', subtype: 'basic' }
  ],

  // Invalidation lors de la mise à jour des horaires
  onBusinessHoursUpdate: (pressingId?: string) => [
    ...generateOptimizedTags.businessHours(pressingId),
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'hours' }
  ],

  // Invalidation lors de l'ajout/modification d'un service
  onServiceUpdate: (pressingId?: string, serviceId?: string) => [
    ...generateOptimizedTags.services(pressingId, serviceId),
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'services' },
    { type: PRESSING_CACHE_TAGS.STATS, id: pressingId || 'current', subtype: 'services' }
  ],

  // Invalidation lors de la mise à jour des zones de livraison
  onDeliveryZoneUpdate: (pressingId?: string, zoneId?: string) => [
    ...generateOptimizedTags.deliveryZones(pressingId, zoneId),
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'delivery' }
  ],

  // Invalidation lors de l'upload de photos
  onPhotoUpdate: (pressingId?: string, photoType?: 'profile' | 'gallery' | 'cover') => [
    ...generateOptimizedTags.photos(pressingId, photoType),
    { type: PRESSING_CACHE_TAGS.PROFILE, id: pressingId || 'current', subtype: 'photos' }
  ]
};

// Sélecteurs memoïzés pour optimiser les re-rendus
export const createOptimizedSelectors = () => {
  // Sélecteur pour le profil de base (sans photos lourdes)
  const selectBasicProfile = createSelector(
    [(state: RootState) => state.pressingApi.queries],
    (queries) => {
      const profileQuery = Object.values(queries).find(
        query => query?.endpointName === 'getPressingProfile'
      );
      
      if (profileQuery?.data) {
        const { photos, ...basicProfile } = profileQuery.data as any;
        return basicProfile;
      }
      
      return null;
    }
  );

  // Sélecteur pour les statistiques essentielles
  const selectEssentialStats = createSelector(
    [(state: RootState) => state.pressingApi.queries],
    (queries) => {
      const statsQuery = Object.values(queries).find(
        query => query?.endpointName === 'getPressingStats'
      );
      
      if (statsQuery?.data) {
        const stats = statsQuery.data as any;
        return {
          todayOrders: stats.todayOrders || 0,
          monthlyRevenue: stats.monthlyRevenue || 0,
          avgRating: stats.avgRating || 0,
          activeCustomers: stats.activeCustomers || 0
        };
      }
      
      return null;
    }
  );

  // Sélecteur pour les services actifs uniquement
  const selectActiveServices = createSelector(
    [(state: RootState) => state.pressingApi.queries],
    (queries) => {
      const servicesQuery = Object.values(queries).find(
        query => query?.endpointName === 'getPressingServices'
      );
      
      if (servicesQuery?.data) {
        const services = servicesQuery.data as any[];
        return services.filter(service => service.disponible || service.isAvailable);
      }
      
      return [];
    }
  );

  return {
    selectBasicProfile,
    selectEssentialStats,
    selectActiveServices
  };
};

// Configuration de cache avec TTL (Time To Live)
export const cacheConfig = {
  // Durées de cache en secondes
  TTL: {
    PROFILE: 300, // 5 minutes
    STATS: 60,    // 1 minute
    SERVICES: 600, // 10 minutes
    PHOTOS: 1800, // 30 minutes
    BUSINESS_HOURS: 3600, // 1 heure
    DELIVERY_ZONES: 1800, // 30 minutes
    REVIEWS: 300, // 5 minutes
    ORDERS: 30    // 30 secondes
  },

  // Stratégies de refetch
  REFETCH_ON: {
    FOCUS: ['PressingStats', 'PressingOrders'], // Refetch au focus de la fenêtre
    RECONNECT: ['PressingStats', 'PressingOrders', 'PressingNotifications'], // Refetch à la reconnexion
    MOUNT: ['PressingProfile'] // Refetch au montage du composant
  }
};

// Middleware pour le cache intelligent
export const cacheMiddleware = {
  // Détermine si une requête doit être mise en cache
  shouldCache: (endpointName: string, args: any) => {
    const noCacheEndpoints = ['uploadPhoto', 'deletePhoto', 'updateOrder'];
    return !noCacheEndpoints.includes(endpointName);
  },

  // Détermine la durée de cache selon l'endpoint
  getCacheDuration: (endpointName: string) => {
    const mapping: Record<string, number> = {
      'getPressingProfile': cacheConfig.TTL.PROFILE,
      'getPressingStats': cacheConfig.TTL.STATS,
      'getPressingServices': cacheConfig.TTL.SERVICES,
      'getPressingPhotos': cacheConfig.TTL.PHOTOS,
      'getBusinessHours': cacheConfig.TTL.BUSINESS_HOURS,
      'getDeliveryZones': cacheConfig.TTL.DELIVERY_ZONES,
      'getPressingReviews': cacheConfig.TTL.REVIEWS,
      'getPressingOrders': cacheConfig.TTL.ORDERS
    };

    return mapping[endpointName] || cacheConfig.TTL.PROFILE;
  },

  // Nettoie le cache expiré
  cleanExpiredCache: (queries: any) => {
    const now = Date.now();
    const expiredQueries: string[] = [];

    Object.entries(queries).forEach(([key, query]: [string, any]) => {
      if (query?.fulfilledTimeStamp) {
        const age = now - query.fulfilledTimeStamp;
        const maxAge = cacheMiddleware.getCacheDuration(query.endpointName) * 1000;
        
        if (age > maxAge) {
          expiredQueries.push(key);
        }
      }
    });

    return expiredQueries;
  }
};

export default {
  generateOptimizedTags,
  invalidationStrategies,
  createOptimizedSelectors,
  cacheConfig,
  cacheMiddleware
};
