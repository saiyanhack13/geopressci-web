import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { getApiConfigSync } from '../config/api.config';
import { generateOptimizedTags, invalidationStrategies, cacheConfig } from '../utils/cacheOptimization';
import { handleApiError } from '../utils/errorHandling';

// Types pour les données pressing
export interface PressingStats {
  todayOrders: number;
  monthlyRevenue: number;
  activeCustomers: number;
  avgRating: number;
  pendingOrders: number;
  completedToday: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export interface PressingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    type: string;
    quantity: number;
    price: number;
    service: string;
  }>;
  status: 'en_attente' | 'confirmee' | 'collecte_planifiee' | 'en_collecte' | 'collectee' | 'en_traitement' | 'traitement_termine' | 'livraison_planifiee' | 'en_livraison' | 'livree' | 'retournee' | 'annulee';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  pickupDate?: string;
  deliveryDate?: string;
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  priority: 'normal' | 'urgent' | 'express';
}

export interface PressingService {
  _id: string; // Identifiant MongoDB
  id?: string; // Compatibilité
  
  // Champs principaux (correspondant à la BD)
  nom: string; // Nom du service
  description: string; // Description détaillée
  prix: number; // Prix en FCFA
  categorie: string; // Catégorie du service
  dureeMoyenne: number; // Durée moyenne en heures
  disponible: boolean; // Disponibilité du service
  validite: number; // Validité en jours
  
  // Références
  pressing: string; // ID du pressing
  createdBy: string; // ID du créateur
  updatedBy?: string; // ID du dernier modificateur
  
  // Options et médias
  options: any[]; // Options du service
  images: string[]; // URLs des images
  
  // Métadonnées temporelles
  createdAt: string; // Date de création
  updatedAt: string; // Date de dernière modification
  __v?: number; // Version MongoDB
  
  // Champs de compatibilité (pour l'ancien format)
  name?: string; // Alias pour nom
  price?: number; // Alias pour prix
  category?: string; // Alias pour categorie
  duration?: number; // Alias pour dureeMoyenne (en minutes)
  isAvailable?: boolean; // Alias pour disponible
  popularity?: number; // Score de popularité
}

export interface PressingEarnings {
  daily: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  weekly: {
    week: string;
    revenue: number;
    orders: number;
  }[];
  monthly: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topServices: Array<{
    service: string;
    revenue: number;
    count: number;
  }>;
  // Additional properties for backward compatibility
  dailyEarnings?: Array<{
    date: string;
    totalRevenue: number;
    totalOrders: number;
  }>;
  weeklyEarnings?: Array<{
    date: string;
    totalRevenue: number;
    totalOrders: number;
  }>;
  monthlyEarnings?: Array<{
    date: string;
    totalRevenue: number;
    totalOrders: number;
  }>;
  paymentMethodBreakdown?: {
    mobile_money?: number;
    cash?: number;
    card?: number;
    [key: string]: number | undefined;
  };
  serviceBreakdown?: Array<{
    serviceName: string;
    totalRevenue: number;
    totalOrders: number;
  }>;
}

export interface PressingReview {
  id: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
  response?: string;
  responseDate?: string;
}

export interface PressingProfile {
  id: string;
  businessName: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  businessHours: Array<{
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
  }>;
  services: string[];
  photos: string[];
  rating: number | { average: number; count: number; totalScore: number };
  reviewCount: number;
  isVerified: boolean;
  subscription: {
    plan: string;
    status: string;
    expiresAt: string;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  minOrder: number;
  estimatedDeliveryTime?: number;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PressingPhoto {
  _id: string;
  url: string;
  publicId?: string; // Cloudinary public ID
  caption?: string;
  isPrimary: boolean;
  uploadedAt: string;
  optimizedUrl?: string; // URL optimisée Cloudinary
  thumbnailUrl?: string; // URL miniature
}

export interface PressingPhotos {
  gallery: PressingPhoto[];
  profile: PressingPhoto | null;
  cover: PressingPhoto | null;
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
  specialHours?: {
    open?: string;
    close?: string;
  };
}

// Types pour les promotions
export interface Promotion {
  _id: string;
  id?: string; // Compatibilité
  name: string;
  description: string;
  code?: string; // Code promo généré automatiquement si non fourni
  type: 'percentage' | 'fixed_amount' | 'free_trial' | 'buy_x_get_y';
  value?: number; // Requis sauf pour free_trial
  trialDays?: number; // Requis pour free_trial
  buyX?: number; // Requis pour buy_x_get_y
  getY?: number; // Requis pour buy_x_get_y
  maxUses?: number;
  currentUses: number;
  validFrom: string;
  validUntil?: string;
  target: {
    type: 'all' | 'new_users' | 'existing_users' | 'specific_users' | 'specific_pressings';
    users?: string[];
    pressings?: string[];
  };
  services?: string[]; // Services applicables
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  status: 'active' | 'scheduled' | 'expired' | 'paused' | 'deleted';
  autoApply: boolean;
  metadata?: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean; // Virtual field
}

export interface PromotionFormData {
  name: string;
  description: string;
  code?: string;
  type: Promotion['type'];
  value?: number;
  trialDays?: number;
  buyX?: number;
  getY?: number;
  maxUses?: number;
  validFrom: string;
  validUntil?: string;
  target: Promotion['target'];
  services?: string[];
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  status: Promotion['status'];
  autoApply: boolean;
  metadata?: Record<string, string>;
}

// Obtient la configuration API dynamique
const apiConfig = getApiConfigSync();

// API Slice pour les données pressing
export const pressingApi = createApi({
  reducerPath: 'pressingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiConfig.baseUrl,
    timeout: apiConfig.timeout,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PressingStats', 'PressingOrders', 'PressingServices', 'PressingEarnings', 'PressingReviews', 'PressingProfile', 'DeliveryZones', 'PressingPhotos', 'BusinessHours', 'PressingNotifications', 'Promotions', 'PublicReviews', 'PublicOrders', 'PublicServices', 'PublicHours'],
  // Configuration du cache optimisé
  keepUnusedDataFor: cacheConfig.TTL.PROFILE,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    
    // Dashboard Stats
    getPressingStats: builder.query<PressingStats, void>({
      query: () => '/pressing/stats',
      providesTags: ['PressingStats'],
    }),

    // Orders Management
    getPressingOrders: builder.query<{
      orders: PressingOrder[];
      total: number;
      page: number;
      limit: number;
    }, {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }>({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      transformResponse: (response: { success: boolean; data: any[]; total: number; pagination: any }) => {
        // Transformer la réponse backend pour correspondre à l'interface frontend
        return {
          orders: response.data || [],
          total: response.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10
        };
      },
      providesTags: ['PressingOrders'],
    }),

    updateOrderStatus: builder.mutation<PressingOrder, {
      orderId: string;
      status: PressingOrder['status'];
      notes?: string;
    }>({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PressingOrders', 'PressingStats'],
    }),

    // Services Management with Enhanced Features
    getPressingServices: builder.query<PressingService[], void>({
      query: () => '/pressing/services',
      transformResponse: (response: { success: boolean; count: number; data: PressingService[] }) => {
        return response.data || [];
      },
      providesTags: ['PressingServices'],
    }),

    getService: builder.query<PressingService, string>({
      query: (serviceId) => `/pressing/services/${serviceId}`,
      transformResponse: (response: { success: boolean; data: PressingService }) => {
        return response.data;
      },
      providesTags: ['PressingServices'],
    }),

    createService: builder.mutation<PressingService, Omit<PressingService, 'id'>>({
      query: (body) => ({
        url: '/pressing/services',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: PressingService }) => {
        return response.data;
      },
      invalidatesTags: ['PressingServices'],
    }),

    updateService: builder.mutation<PressingService, {
      serviceId: string;
      updates: Partial<PressingService>;
    }>({
      query: ({ serviceId, updates }) => ({
        url: `/pressing/services/${serviceId}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: PressingService }) => {
        return response.data;
      },
      invalidatesTags: ['PressingServices'],
    }),

    deleteService: builder.mutation<{ message: string }, string>({
      query: (serviceId) => ({
        url: `/pressing/services/${serviceId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string }) => {
        return { message: response.message };
      },
      invalidatesTags: ['PressingServices'],
    }),

    toggleServiceAvailability: builder.mutation<PressingService, string>({
      query: (serviceId) => ({
        url: `/pressing/services/${serviceId}/toggle`,
        method: 'PATCH',
      }),
      transformResponse: (response: { success: boolean; data: PressingService }) => {
        return response.data;
      },
      invalidatesTags: ['PressingServices'],
    }),

    // Earnings & Analytics
    getPressingEarnings: builder.query<PressingEarnings, {
      period?: 'daily' | 'weekly' | 'monthly';
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/pressing/earnings',
        params,
      }),
      providesTags: ['PressingEarnings'],
    }),

    // Reviews Management
    getPressingReviews: builder.query<{
      reviews: PressingReview[];
      total: number;
      averageRating: number;
      ratingDistribution: Record<number, number>;
    }, {
      page?: number;
      limit?: number;
      rating?: number;
    }>({
      query: (params) => ({
        url: '/pressing/reviews',
        params,
      }),
      providesTags: ['PressingReviews'],
    }),

    respondToReview: builder.mutation<PressingReview, {
      reviewId: string;
      response: string;
    }>({
      query: ({ reviewId, response }) => ({
        url: `/pressing/reviews/${reviewId}/respond`,
        method: 'POST',
        body: { response },
      }),
      invalidatesTags: ['PressingReviews'],
    }),

    // Profile Management
    getPressingProfile: builder.query<PressingProfile, void>({
      query: () => '/pressing/profile',
      transformResponse: (response: { success: boolean; data: PressingProfile }) => {
        // Extraire les données du profil de la réponse backend
        return response.data;
      },
      providesTags: ['PressingProfile'],
    }),

    updatePressingProfile: builder.mutation<PressingProfile, Partial<PressingProfile>>({
      query: (updates) => ({
        url: '/pressing/profile',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['PressingProfile'],
    }),

    uploadPressingPhoto: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({
        url: '/pressing/photos',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['PressingProfile'],
    }),

    deletePressingPhoto: builder.mutation<void, string>({
      query: (photoUrl) => ({
        url: '/pressing/photos',
        method: 'DELETE',
        body: { photoUrl },
      }),
      invalidatesTags: ['PressingProfile'],
    }),

    // Business Hours Management
    getBusinessHours: builder.query<BusinessHours[], void>({
      query: () => '/pressing/management/hours',
      transformResponse: (response: { success: boolean; data: BusinessHours[] }) => {
        return response.data || [];
      },
      providesTags: ['BusinessHours'],
    }),

    updateDayHours: builder.mutation<BusinessHours, {
      day: string;
      hours: Partial<BusinessHours>;
    }>({
      query: ({ day, hours }) => ({
        url: `/pressing/management/hours/${day}`,
        method: 'PUT',
        body: hours,
      }),
      transformResponse: (response: { success: boolean; data: BusinessHours }) => {
        return response.data;
      },
      invalidatesTags: ['BusinessHours', 'PressingProfile'],
    }),

    updateAllHours: builder.mutation<BusinessHours[], BusinessHours[]>({
      query: (allHours) => ({
        url: '/pressing/management/hours',
        method: 'PUT',
        body: { hours: allHours },
      }),
      transformResponse: (response: { success: boolean; data: BusinessHours[] }) => {
        return response.data;
      },
      invalidatesTags: ['BusinessHours', 'PressingProfile'],
    }),

    copyHours: builder.mutation<BusinessHours[], {
      fromDay: string;
      toDays: string[];
    }>({
      query: ({ fromDay, toDays }) => ({
        url: '/pressing/management/hours/copy',
        method: 'POST',
        body: { fromDay, toDays },
      }),
      transformResponse: (response: { success: boolean; data: BusinessHours[] }) => {
        return response.data;
      },
      invalidatesTags: ['BusinessHours', 'PressingProfile'],
    }),

    getCurrentOpenStatus: builder.query<{
      isOpen: boolean;
      nextChange: string | null;
      currentDay: string;
    }, void>({
      query: () => '/pressing/management/hours/status',
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data;
      },
    }),

    // Legacy endpoint pour compatibilité
    updateBusinessHours: builder.mutation<PressingProfile['businessHours'], PressingProfile['businessHours']>({
      query: (businessHours) => ({
        url: '/pressing/business-hours',
        method: 'PUT',
        body: { businessHours },
      }),
      invalidatesTags: ['PressingProfile', 'BusinessHours'],
    }),

    // Notifications
    getPressingNotifications: builder.query<Array<{
      id: string;
      type: 'order' | 'review' | 'payment' | 'system';
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      data?: any;
    }>, void>({
      query: () => '/pressing/notifications',
      transformResponse: (response: { success: boolean; data: { notifications: any[] } }) => {
        // Extraire le tableau de notifications de la réponse backend
        return response.data?.notifications || [];
      },
    }),

    markNotificationAsRead: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/pressing/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
    }),

    // Delivery Zones Management
    getDeliveryZones: builder.query<DeliveryZone[], {
      activeOnly?: boolean;
    }>({
      query: (params = {}) => ({
        url: '/pressing/delivery-zones',
        params: {
          activeOnly: params.activeOnly !== undefined ? params.activeOnly.toString() : 'true'
        },
      }),
      transformResponse: (response: { success: boolean; count: number; data: DeliveryZone[] }) => {
        return response.data || [];
      },
      providesTags: ['DeliveryZones'],
    }),

    getDeliveryZone: builder.query<DeliveryZone, string>({
      query: (zoneId) => `/pressing/delivery-zones/${zoneId}`,
      transformResponse: (response: { success: boolean; data: DeliveryZone }) => {
        return response.data;
      },
      providesTags: ['DeliveryZones'],
    }),

    createDeliveryZone: builder.mutation<DeliveryZone, {
      name: string;
      deliveryFee: number;
      minOrder: number;
      estimatedDeliveryTime?: number;
      description?: string;
    }>({
      query: (zoneData) => ({
        url: '/pressing/delivery-zones',
        method: 'POST',
        body: zoneData,
      }),
      transformResponse: (response: { success: boolean; data: DeliveryZone }) => {
        return response.data;
      },
      invalidatesTags: ['DeliveryZones'],
    }),

    updateDeliveryZone: builder.mutation<DeliveryZone, {
      id: string;
      name?: string;
      deliveryFee?: number;
      minOrder?: number;
      estimatedDeliveryTime?: number;
      description?: string;
      isActive?: boolean;
    }>({
      query: ({ id, ...updates }) => ({
        url: `/pressing/delivery-zones/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: DeliveryZone }) => {
        return response.data;
      },
      invalidatesTags: ['DeliveryZones'],
    }),

    deleteDeliveryZone: builder.mutation<{ message: string }, string>({
      query: (zoneId) => ({
        url: `/pressing/delivery-zones/${zoneId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string }) => {
        return { message: response.message };
      },
      invalidatesTags: ['DeliveryZones'],
    }),

    // Reverse Geocoding
    reverseGeocode: builder.mutation<{
      success: boolean;
      data: {
        street: string;
        district: string;
        city: string;
        postalCode: string;
        country: string;
        displayName: string;
      };
    }, { lat: number; lng: number }>({
      query: (coordinates) => ({
        url: '/pressing/reverse-geocode',
        method: 'POST',
        body: coordinates,
      }),
    }),

    // Photos Management with Cloudinary
    getPressingPhotos: builder.query<PressingPhotos, void>({
      query: () => '/pressing/management/photos',
      transformResponse: (response: { success: boolean; data: PressingPhotos }) => {
        return response.data;
      },
      providesTags: ['PressingPhotos'],
    }),

    // Gallery Photos
    uploadGalleryPhoto: builder.mutation<PressingPhoto, { formData: FormData }>({
      query: ({ formData }) => ({
        url: '/pressing/management/photos/gallery',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    // Profile Photo
    uploadProfilePhoto: builder.mutation<PressingPhoto, { formData: FormData }>({
      query: ({ formData }) => ({
        url: '/pressing/management/photos/profile',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    // Cover Photo
    uploadCoverPhoto: builder.mutation<PressingPhoto, { formData: FormData }>({
      query: ({ formData }) => ({
        url: '/pressing/management/photos/cover',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    // Delete Photo
    deletePhoto: builder.mutation<{ message: string }, string>({
      query: (photoId) => ({
        url: `/pressing/management/photos/${photoId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string }) => {
        return { message: response.message };
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    // Set Primary Photo
    setPrimaryPhoto: builder.mutation<PressingPhoto, string>({
      query: (photoId) => ({
        url: `/pressing/management/photos/${photoId}/primary`,
        method: 'PATCH',
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    uploadPhotoFile: builder.mutation<PressingPhoto, {
      file: File;
      caption?: string;
      isPrimary?: boolean;
    }>({
      query: ({ file, caption, isPrimary }) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (caption) formData.append('caption', caption);
        if (isPrimary !== undefined) formData.append('isPrimary', isPrimary.toString());
        
        return {
          url: '/pressing/photos/upload',
          method: 'POST',
          body: formData,
          // Ne pas définir le Content-Type, le navigateur le fera automatiquement avec la bonne boundary
          headers: {},
        };
      },
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    setPhotoRole: builder.mutation<PressingPhoto, { photoId: string; role: 'cover' | 'logo' }>({
      query: ({ photoId, role }) => ({
        url: `/pressing/photos/${photoId}/role`,
        method: 'PUT',
        body: { role },
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    // ===== GESTION DES PROMOTIONS =====

    // Récupérer toutes les promotions
    getPromotions: builder.query<{
      promotions: Promotion[];
      total: number;
      page: number;
      limit: number;
    }, {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      search?: string;
    }>(
      {
        query: ({ page = 1, limit = 10, status, type, search } = {}) => {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          
          if (status) params.append('status', status);
          if (type) params.append('type', type);
          if (search) params.append('search', search);
          
          return {
            url: `/pressings/promotions?${params.toString()}`,
            method: 'GET',
          };
        },
        transformResponse: (response: {
          success: boolean;
          data: Promotion[];
          pagination: {
            total: number;
            page: number;
            limit: number;
          };
        }) => ({
          promotions: response.data,
          total: response.pagination.total,
          page: response.pagination.page,
          limit: response.pagination.limit,
        }),
        providesTags: (result) =>
          result
            ? [
                ...result.promotions.map(({ _id }) => ({ type: 'Promotions' as const, id: _id })),
                { type: 'Promotions', id: 'LIST' },
              ]
            : [{ type: 'Promotions', id: 'LIST' }],
      }
    ),

    // Récupérer une promotion par ID
    getPromotionById: builder.query<Promotion, string>({
      query: (id) => ({
        url: `/pressings/promotions/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: Promotion }) => {
        return response.data;
      },
      providesTags: (result, error, id) => [{ type: 'Promotions', id }],
    }),

    // Créer une nouvelle promotion
    createPromotion: builder.mutation<Promotion, PromotionFormData>({
      query: (promotionData) => ({
        url: '/pressings/promotions',
        method: 'POST',
        body: promotionData,
      }),
      transformResponse: (response: { success: boolean; data: Promotion }) => {
        return response.data;
      },
      invalidatesTags: [{ type: 'Promotions', id: 'LIST' }],
    }),

    // Mettre à jour une promotion
    updatePromotion: builder.mutation<Promotion, { id: string; data: Partial<PromotionFormData> }>({
      query: ({ id, data }) => ({
        url: `/pressings/promotions/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: Promotion }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Promotions', id },
        { type: 'Promotions', id: 'LIST' },
      ],
    }),

    // Supprimer une promotion
    deletePromotion: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/pressings/promotions/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string }) => {
        return { message: response.message };
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Promotions', id },
        { type: 'Promotions', id: 'LIST' },
      ],
    }),

    // Mettre à jour le statut d'une promotion
    updatePromotionStatus: builder.mutation<Promotion, { id: string; status: Promotion['status'] }>({
      query: ({ id, status }) => ({
        url: `/pressings/promotions/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Promotion }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Promotions', id },
        { type: 'Promotions', id: 'LIST' },
      ],
    }),

    // ===== ENDPOINTS PUBLICS POUR CLIENTS =====
    
    // Récupérer les avis d'un pressing (public)
    getPublicPressingReviews: builder.query<{
      reviews: Array<{
        id: string;
        rating: number;
        comment: string;
        customerName: string;
        createdAt: string;
        response?: string;
      }>;
      total: number;
      averageRating: number;
    }, string>({  // pressingId
      query: (pressingId) => `/pressings/${pressingId}/reviews`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data || { reviews: [], total: 0, averageRating: 0 };
      },
      providesTags: ['PublicReviews'],
    }),

    // Laisser un avis sur un pressing (client connecté)
    createPressingReview: builder.mutation<{
      id: string;
      rating: number;
      comment: string;
      customerName: string;
      createdAt: string;
    }, {
      pressingId: string;
      rating: number;
      comment: string;
    }>({  
      query: ({ pressingId, ...reviewData }) => ({
        url: `/pressings/${pressingId}/reviews`,
        method: 'POST',
        body: reviewData,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data;
      },
      invalidatesTags: ['PublicReviews', 'PressingStats'],
    }),

    // Récupérer les commandes d'un pressing (public - pour affichage statistiques)
    getPublicPressingOrders: builder.query<{
      recentOrders: Array<{
        id: string;
        orderNumber: string;
        status: string;
        totalAmount: number;
        createdAt: string;
        customerName?: string;
      }>;
      totalOrders: number;
      completedOrders: number;
    }, string>({  // pressingId
      query: (pressingId) => `/pressings/${pressingId}/orders/public`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data || { recentOrders: [], totalOrders: 0, completedOrders: 0 };
      },
      providesTags: ['PublicOrders'],
    }),

    // Récupérer les services d'un pressing (public)
    getPublicPressingServices: builder.query<PressingService[], string>({  // pressingId
      query: (pressingId) => `/pressings/${pressingId}/services`,
      transformResponse: (response: { success: boolean; data: PressingService[] }) => {
        return response.data || [];
      },
      providesTags: ['PublicServices'],
    }),

    // Récupérer les horaires d'un pressing (public)
    getPublicBusinessHours: builder.query<BusinessHours[], string>({  // pressingId
      query: (pressingId) => `/pressings/${pressingId}/hours`,
      transformResponse: (response: { success: boolean; data: BusinessHours[] }) => {
        return response.data || [];
      },
      providesTags: ['PublicHours'],
    }),
  }),
});

// Export hooks
export const {
  // Stats & Analytics
  useGetPressingStatsQuery,
  useGetPressingEarningsQuery,
  
  // Orders Management
  useGetPressingOrdersQuery,
  useUpdateOrderStatusMutation,
  
  // Services Management (Enhanced)
  useGetPressingServicesQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useToggleServiceAvailabilityMutation,
  
  // Photos Management (Cloudinary)
  useGetPressingPhotosQuery,
  useUploadGalleryPhotoMutation,
  useUploadProfilePhotoMutation,
  useUploadCoverPhotoMutation,
  useDeletePhotoMutation,
  useSetPrimaryPhotoMutation,
  
  // Business Hours Management
  useGetBusinessHoursQuery,
  useUpdateDayHoursMutation,
  useUpdateAllHoursMutation,
  useCopyHoursMutation,
  useGetCurrentOpenStatusQuery,
  useUpdateBusinessHoursMutation, // Legacy
  
  // Reviews Management
  useGetPressingReviewsQuery,
  useRespondToReviewMutation,
  
  // Profile Management
  useGetPressingProfileQuery,
  useUpdatePressingProfileMutation,
  useUploadPressingPhotoMutation, // Legacy
  useDeletePressingPhotoMutation, // Legacy
  
  // Notifications
  useGetPressingNotificationsQuery,
  useMarkNotificationAsReadMutation,
  
  // Delivery Zones
  useGetDeliveryZonesQuery,
  useGetDeliveryZoneQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  
  // Utilities
  useReverseGeocodeMutation,
  
  // Legacy Photo Endpoints (for backward compatibility)
  useUploadPhotoFileMutation,
  useSetPhotoRoleMutation,
  
  // Promotions Management
  useGetPromotionsQuery,
  useGetPromotionByIdQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useUpdatePromotionStatusMutation,
  
  // Public Client APIs
  useGetPublicPressingReviewsQuery,
  useCreatePressingReviewMutation,
  useGetPublicPressingOrdersQuery,
  useGetPublicPressingServicesQuery,
  useGetPublicBusinessHoursQuery,
} = pressingApi;
