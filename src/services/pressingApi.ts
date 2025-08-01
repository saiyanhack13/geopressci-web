import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { getApiConfigSync } from '../config/api.config';

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
  caption?: string;
  isPrimary: boolean;
  uploadedAt: string;
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
  tagTypes: ['PressingStats', 'PressingOrders', 'PressingServices', 'PressingEarnings', 'PressingReviews', 'PressingProfile', 'DeliveryZones', 'PressingPhotos'],
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

    // Services Management
    getPressingServices: builder.query<PressingService[], void>({
      query: () => '/pressing/services',
      transformResponse: (response: { success: boolean; count: number; data: PressingService[] }) => {
        // Extraire le tableau de services de la réponse backend
        return response.data || [];
      },
      providesTags: ['PressingServices'],
    }),

    createService: builder.mutation<PressingService, Omit<PressingService, 'id'>>({
      query: (body) => ({
        url: '/pressing/services',
        method: 'POST',
        body,
      }),
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
      invalidatesTags: ['PressingServices'],
    }),

    deleteService: builder.mutation<void, string>({
      query: (serviceId) => ({
        url: `/pressing/services/${serviceId}`,
        method: 'DELETE',
      }),
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

    // Business Hours
    updateBusinessHours: builder.mutation<PressingProfile['businessHours'], PressingProfile['businessHours']>({
      query: (businessHours) => ({
        url: '/pressing/business-hours',
        method: 'PUT',
        body: { businessHours },
      }),
      invalidatesTags: ['PressingProfile'],
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

    // Gallery Photos Management
    getPressingGalleryPhotos: builder.query<PressingPhoto[], void>({
      query: () => '/pressing/photos',
      transformResponse: (response: { success: boolean; count: number; data: PressingPhoto[] }) => {
        return response.data || [];
      },
      providesTags: ['PressingPhotos'],
    }),

    uploadGalleryPhoto: builder.mutation<PressingPhoto, {
      url: string;
      caption?: string;
      isPrimary?: boolean;
    }>({
      query: (photoData) => ({
        url: '/pressing/photos',
        method: 'POST',
        body: photoData,
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    updateGalleryPhoto: builder.mutation<PressingPhoto, {
      photoId: string;
      caption?: string;
      isPrimary?: boolean;
    }>({
      query: ({ photoId, ...updates }) => ({
        url: `/pressing/photos/${photoId}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: PressingPhoto }) => {
        return response.data;
      },
      invalidatesTags: ['PressingPhotos', 'PressingProfile'],
    }),

    deleteGalleryPhoto: builder.mutation<{ message: string }, string>({
      query: (photoId) => ({
        url: `/pressing/photos/${photoId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string }) => {
        return { message: response.message };
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
  }),
});

// Export hooks
export const {
  useGetPressingStatsQuery,
  useGetPressingOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetPressingServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetPressingEarningsQuery,
  useGetPressingReviewsQuery,
  useRespondToReviewMutation,
  useGetPressingProfileQuery,
  useUpdatePressingProfileMutation,
  useUploadPressingPhotoMutation,
  useDeletePressingPhotoMutation,
  useUpdateBusinessHoursMutation,
  useGetPressingNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useGetDeliveryZonesQuery,
  useGetDeliveryZoneQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  useReverseGeocodeMutation,
  useGetPressingGalleryPhotosQuery,
  useUploadGalleryPhotoMutation,
  useUpdateGalleryPhotoMutation,
  useDeleteGalleryPhotoMutation,
  useUploadPhotoFileMutation,
  useSetPhotoRoleMutation,
} = pressingApi;
