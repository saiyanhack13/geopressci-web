import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/types';
import { getApiConfigSync, logApiConfig } from '../config/api.config';
import { 
  Order, 
  Pressing, 
  User, 
  Payment, 
  Geolocation, 
  OrderStatus, 
  PaymentStatus,
  MobileMoneyProvider,
  PressingService,
  Address, 
  PaymentMethod
} from '../types';

// Obtient la configuration API dynamique
const apiConfig = getApiConfigSync();
logApiConfig(apiConfig);

// Crée une baseQuery avec gestion des jetons et retry
const baseQuery = fetchBaseQuery({
  baseUrl: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  prepareHeaders: (headers, { getState }) => {
    // Récupère le token depuis le state Redux (authSlice)
    const token = (getState() as RootState).auth.token;
    const localToken = localStorage.getItem('authToken');
    
    console.log('🔍 API prepareHeaders - Debug:', {
      reduxToken: token ? `${token.substring(0, 20)}...` : 'null',
      localStorageToken: localToken ? `${localToken.substring(0, 20)}...` : 'null',
      tokensMatch: token === localToken
    });
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
      console.log('✅ Token ajouté aux headers:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('❌ Aucun token trouvé dans Redux state');
    }
    return headers;
  },
});

// Crée une baseQuery avec une logique de retry pour les connexions instables
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 });

/**
 * Crée une API slice qui peut être injectée avec des endpoints.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['User', 'Pressing', 'Order', 'Payment', 'Subscription', 'PressingsList', 'Notification', 'NotificationSettings', 'Favorites'], // Types de tags pour la mise en cache
  endpoints: (builder) => ({
    reverseGeocode: builder.query<{ address: string }, { lat: number; lng: number }>({
      query: ({ lat, lng }) => `maps/reverse-geocode?lat=${lat}&lng=${lng}`,
      transformResponse: (response: { data: { address: string } }) => response.data,
    }),
    
    // Endpoints pour l'authentification
    login: builder.mutation<{ user: User; token: string }, { email: string; password: string }>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { success: boolean; token: string; data: User }) => ({
        user: response.data,
        token: response.token
      }),
      invalidatesTags: ['User'],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; message: string }) => ({ message: response.message }),
      invalidatesTags: ['User', 'Order'],
    }),

    refreshToken: builder.mutation<{ token: string }, void>({
      query: () => ({
        url: 'auth/refresh-token',
        method: 'POST',
      }),
      transformResponse: (response: { success: boolean; token: string }) => ({ token: response.token }),
    }),

    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      providesTags: ['User'],
    }),

    // Endpoints pour les pressings
    getNearbyPressings: builder.query<Pressing[], { location: Geolocation; radius?: number }>({
      query: ({ location, radius = 5000 }) => 
        `pressings/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`,
      transformResponse: (response: { success: boolean; data: Pressing[] }) => response.data,
      providesTags: (result, error, arg) => [
        { type: 'Pressing', id: 'NEARBY_LIST' },
        ...(result || []).map(({ _id }) => ({ type: 'Pressing' as const, id: _id })),
        'Pressing'
      ],
      // Forcer le refetch toutes les 30 secondes pour les nouveaux pressings
      keepUnusedDataFor: 30,
    }),

    searchPressings: builder.query<Pressing[], { query?: string; filters?: any }>({
      query: ({ query, filters }) => {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
          });
        }
        return `pressings/search?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Pressing[] }) => response.data,
      providesTags: ['Pressing'],
    }),

    getPressingById: builder.query<Pressing, string>({
      query: (id) => `pressings/${id}`,
      transformResponse: (response: { success: boolean; data: Pressing }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Pressing', id }],
    }),

    getPressingServices: builder.query<PressingService[], string>({
      query: (pressingId) => `pressings/${pressingId}/services`,
      transformResponse: (response: { success: boolean; data: PressingService[] }) => response.data,
      providesTags: (result, error, pressingId) => [{ type: 'Pressing', id: pressingId }],
    }),
    
    // Endpoints pour les commandes (utilise directement le backend)
    getOrders: builder.query<Order[], { status?: string; page?: number, limit?: number, search?: string }>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args.status && args.status !== 'all') params.append('status', args.status);
        if (args.search) params.append('search', args.search);
        if (args.page) params.append('page', args.page.toString());
        if (args.limit) params.append('limit', args.limit.toString());
        return `orders?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Order[] }) => {
        return response.data || [];
      },
      providesTags: (result) => 
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Order', id: 'LIST' }]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    
    createOrder: builder.mutation<Order, {
      pressingId: string;
      services: Array<{ serviceId: string; quantite: number; instructions?: string }>;
      adresseLivraison: string;
      dateRecuperationSouhaitee?: string;
      instructionsSpeciales?: string;
    }>({
      query: (orderData) => ({
        url: 'orders',
        method: 'POST',
        body: orderData,
      }),
      transformResponse: (response: { success: boolean; data: Order }) => response.data,
      invalidatesTags: ['Order'],
    }),

    updateOrderStatus: builder.mutation<Order, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Order }) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),

    cancelOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `orders/${id}/annuler`,
        method: 'PUT',
      }),
      transformResponse: (response: { success: boolean; data: Order }) => response.data,
      invalidatesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    getOrderTracking: builder.query<Order, string>({
      query: (id) => `orders/${id}/tracking`,
      transformResponse: (response: { success: boolean; data: Order }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    
    getOrderById: builder.query<Order, string>({
      query: (orderId) => `orders/${orderId}`,
      transformResponse: (response: any) => {
        // Transform backend response to frontend format if needed
        return response.data || response;
      },
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    // Endpoints pour les pressings (detailed)
    getNearbyPressingsDetailed: builder.query<Pressing[], { 
      latitude: number; 
      longitude: number; 
      radius?: number; 
      limit?: number 
    }>({
      query: ({ latitude, longitude, radius = 10, limit = 20 }) => 
        `pressings/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}&limit=${limit}`,
      transformResponse: (response: { success: boolean; data: Pressing[] }) => response.data,
      providesTags: ['Pressing'],
    }),

    // Endpoints pour les utilisateurs (detailed)
    getCurrentUserDetailed: builder.query<User, void>({
      query: () => 'users/me',
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      providesTags: ['User'],
    }),

    updateCurrentUser: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: 'users/me',
        method: 'PUT',
        body: userData,
      }),
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      invalidatesTags: ['User'],
    }),

    updatePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (passwordData) => ({
        url: 'users/update-password',
        method: 'PUT',
        body: passwordData,
      }),
      transformResponse: (response: { success: boolean; message: string }) => ({ message: response.message }),
      invalidatesTags: ['User'],
    }),

    // Endpoints pour les paiements

    initiatePayment: builder.mutation<Payment, { orderId: string; provider: MobileMoneyProvider; phoneNumber?: string }>({
      query: (paymentData) => ({
        url: 'payments/initiate',
        method: 'POST',
        body: paymentData,
      }),
      transformResponse: (response: { success: boolean; data: Payment }) => response.data,
      invalidatesTags: ['Payment'],
    }),

    getPaymentStatus: builder.query<Payment, string>({
      query: (transactionId) => `payments/${transactionId}/status`,
      transformResponse: (response: { success: boolean; data: Payment }) => response.data,
      providesTags: (result, error, transactionId) => [{ type: 'Payment', id: transactionId }],
    }),

    getPaymentHistory: builder.query<Payment[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `payments?page=${page}&limit=${limit}`,
      transformResponse: (response: { success: boolean; data: Payment[] }) => response.data,
      providesTags: ['Payment'],
    }),

    getPaymentMethods: builder.query<PaymentMethod[], void>({
      query: () => 'payments/methods',  
      transformResponse: (response: { success: boolean; data: PaymentMethod[] }) => response.data,
      providesTags: ['Payment'],
    }),

    verifyPayment: builder.mutation<Payment, string>({
      query: (transactionId) => ({
        url: 'payments/verify',
        method: 'POST',
        body: { transactionId },
      }),
      transformResponse: (response: { success: boolean; data: Payment }) => response.data,
      invalidatesTags: ['Payment', 'Order'],
    }),

    // Endpoints pour l'administration
    getAdminStats: builder.query<{
      totalUsers: number;
      totalPressings: number;
      totalOrders: number;
      totalRevenue: number;
      activeUsers: number;
      pendingOrders: number;
      monthlyGrowth: number;
      averageOrderValue: number;
    }, void>({
      query: () => 'admin/stats',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['User', 'Pressing', 'Order'],
    }),

    getRecentActivity: builder.query<Array<{
      id: string;
      type: 'user' | 'pressing' | 'order' | 'payment';
      message: string;
      timestamp: string;
      status: 'success' | 'warning' | 'error';
    }>, { limit?: number }>({
      query: ({ limit = 10 }) => `admin/activity?limit=${limit}`,
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
      providesTags: ['User', 'Pressing', 'Order'],
    }),

    getAllUsers: builder.query<{
      users: User[];
      total: number;
      hasNextPage: boolean;
    }, { page?: number; limit?: number; search?: string; role?: string }>({
      query: ({ page = 1, limit = 10, search, role }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (role) params.append('role', role);
        return `admin/users?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['User'],
    }),

    updateUserStatus: builder.mutation<User, { userId: string; status: 'active' | 'inactive' | 'banned' }>({
      query: ({ userId, status }) => ({
        url: `admin/users/${userId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      invalidatesTags: ['User'],
    }),

    getAllPressings: builder.query<{
      pressings: Pressing[];
      total: number;
      hasNextPage: boolean;
    }, { page?: number; limit?: number; search?: string; status?: string }>({
      query: ({ page = 1, limit = 10, search, status }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        return `admin/pressings?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Pressing'],
    }),

    updatePressingStatus: builder.mutation<Pressing, { pressingId: string; status: 'pending' | 'approved' | 'rejected' }>({
      query: ({ pressingId, status }) => ({
        url: `admin/pressings/${pressingId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Pressing }) => response.data,
      invalidatesTags: ['Pressing'],
    }),

    getAllPayments: builder.query<{
      payments: Payment[];
      total: number;
      hasNextPage: boolean;
    }, { page?: number; limit?: number; status?: PaymentStatus }>({
      query: ({ page = 1, limit = 10, status }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        return `admin/payments?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Payment'],
    }),

    getAnalytics: builder.query<{
      revenue: { daily: number[]; weekly: number[]; monthly: number[] };
      orders: { daily: number[]; weekly: number[]; monthly: number[] };
      users: { daily: number[]; weekly: number[]; monthly: number[] };
      topPressings: Array<{ id: string; name: string; orders: number; revenue: number }>;
      topClients: Array<{ id: string; name: string; orders: number; spent: number }>;
    }, { period?: 'daily' | 'weekly' | 'monthly' }>({
      query: ({ period = 'monthly' }) => `admin/analytics?period=${period}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['User', 'Pressing', 'Order', 'Payment'],
    }),

    // Endpoints pour les notifications
    getNotifications: builder.query<{
      notifications: Array<{
        id: string;
        type: string;
        subtype?: string;
        title: string;
        message: string;
        status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
        priority: number;
        createdAt: string;
        readAt?: string;
        data?: any;
        actions?: Array<{
          type: string;
          label: string;
          target: string;
        }>;
      }>;
      total: number;
      unreadCount: number;
    }, { page?: number; limit?: number; status?: string; type?: string }>({
      query: ({ page = 1, limit = 20, status, type }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        return `notifications?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Notification'],
    }),

    markNotificationAsRead: builder.mutation<{ success: boolean }, string>({
      query: (notificationId) => ({
        url: `notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      transformResponse: (response: { success: boolean }) => response,
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsAsRead: builder.mutation<{ success: boolean; count: number }, void>({
      query: () => ({
        url: 'notifications/mark-all-read',
        method: 'PATCH',
      }),
      transformResponse: (response: { success: boolean; data: { count: number } }) => ({
        success: response.success,
        count: response.data.count
      }),
      invalidatesTags: ['Notification'],
    }),

    getNotificationSettings: builder.query<{
      settings: Array<{
        id: string;
        type: string;
        label: string;
        description: string;
        enabled: boolean;
        channels: {
          inApp: boolean;
          email: boolean;
          sms: boolean;
          push: boolean;
        };
      }>;
    }, void>({
      query: () => 'notifications/settings',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['NotificationSettings'],
    }),

    updateNotificationSettings: builder.mutation<{ success: boolean }, {
      settingId: string;
      enabled?: boolean;
      channels?: {
        inApp?: boolean;
        email?: boolean;
        sms?: boolean;
        push?: boolean;
      };
    }>({
      query: ({ settingId, ...settings }) => ({
        url: `notifications/settings/${settingId}`,
        method: 'PATCH',
        body: settings,
      }),
      transformResponse: (response: { success: boolean }) => response,
      invalidatesTags: ['NotificationSettings'],
    }),

    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (notificationId) => ({
        url: `notifications/${notificationId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean }) => response,
      invalidatesTags: ['Notification'],
    }),

    // Additional payment endpoints
    getTransactions: builder.query<{
      transactions: Payment[];
      total: number;
      stats: { totalAmount: number; successRate: number; averageAmount: number };
    }, { page?: number; limit?: number; status?: PaymentStatus }>({
      query: ({ page = 1, limit = 10, status }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        return `payments/transactions?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Payment'],
    }),

    getTransactionById: builder.query<Payment, string>({
      query: (transactionId) => `payments/transactions/${transactionId}`,
      transformResponse: (response: { success: boolean; data: Payment }) => response.data,
      providesTags: (result, error, transactionId) => [{ type: 'Payment', id: transactionId }],
    }),

    // === FAVORIS ===
    getFavorites: builder.query<Pressing[], void>({
      query: () => 'users/favorites',
      transformResponse: (response: { success: boolean; data: Pressing[] }) => response.data || [],
      providesTags: ['Favorites'],
    }),

    addFavorite: builder.mutation<{ success: boolean; message: string }, string>({
      query: (pressingId) => ({
        url: `users/favorites/${pressingId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Favorites'],
    }),

    removeFavorite: builder.mutation<{ success: boolean; message: string }, string>({
      query: (pressingId) => ({
        url: `users/favorites/${pressingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),

    toggleFavorite: builder.mutation<{ success: boolean; message: string; isFavorite: boolean }, string>({
      query: (pressingId) => ({
        url: `users/favorites/${pressingId}/toggle`,
        method: 'POST',
      }),
      invalidatesTags: ['Favorites'],
    }),

    // === MÉTHODES DE PAIEMENT ===
    addPaymentMethod: builder.mutation<{ success: boolean; message: string; data: PaymentMethod }, Omit<PaymentMethod, 'id' | 'addedDate' | 'isVerified'>>({
      query: (paymentData) => ({
        url: 'users/payment-methods',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['User'],
    }),

    deletePaymentMethod: builder.mutation<{ success: boolean; message: string }, string>({
      query: (methodId) => ({
        url: `users/payment-methods/${methodId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    setDefaultPaymentMethod: builder.mutation<{ success: boolean; message: string }, string>({
      query: (methodId) => ({
        url: `users/payment-methods/${methodId}/default`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  // Géolocalisation
  useLazyReverseGeocodeQuery,
  
  // Authentification
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useUpdatePasswordMutation,
  
  // Pressings
  useGetNearbyPressingsQuery,
  useLazyGetNearbyPressingsQuery,
  useSearchPressingsQuery,
  useLazySearchPressingsQuery,
  useGetPressingByIdQuery,
  useLazyGetPressingByIdQuery,
  useGetPressingServicesQuery,
  useLazyGetPressingServicesQuery,
  
  // Commandes
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetOrderTrackingQuery,
  useLazyGetOrderTrackingQuery,
  
  // Paiements
  useInitiatePaymentMutation,
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
  useGetPaymentHistoryQuery,
  useLazyGetPaymentHistoryQuery,
  useVerifyPaymentMutation,
  useGetPaymentMethodsQuery,
  useLazyGetPaymentMethodsQuery,
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useLazyGetTransactionByIdQuery,
  
  // Administration
  useGetAdminStatsQuery,
  useLazyGetAdminStatsQuery,
  useGetRecentActivityQuery,
  useLazyGetRecentActivityQuery,
  useGetAllUsersQuery,
  useLazyGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useGetAllPressingsQuery,
  useLazyGetAllPressingsQuery,
  useUpdatePressingStatusMutation,
  useGetAllPaymentsQuery,
  useLazyGetAllPaymentsQuery,
  useGetAnalyticsQuery,
  useLazyGetAnalyticsQuery,
  
  // Notifications
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetNotificationSettingsQuery,
  useLazyGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useDeleteNotificationMutation,
  
  // Favoris
  useGetFavoritesQuery,
  useLazyGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useToggleFavoriteMutation,
  
  // Méthodes de paiement
  useAddPaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
} = api;
