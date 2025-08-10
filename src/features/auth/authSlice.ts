import { createSlice } from '@reduxjs/toolkit';
import { User } from '../../types';
import { api } from '../../services/api';

// Définir l'interface de l'état d'authentification
interface AuthState {
  user: User | null;
  token: string | null;
}

// Fonction pour charger l'état initial depuis localStorage
const loadInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData && userData !== 'undefined' && userData !== 'null') {
      const user = JSON.parse(userData);
      console.log('🔄 État d\'authentification restauré depuis localStorage:', { user: user.email, role: user.role });
      return { user, token };
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement de l\'état d\'authentification:', error);
    // Nettoyer localStorage en cas d'erreur
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
  
  return { user: null, token: null };
};

// État initial
const initialState: AuthState = loadInitialState();

// Action types
const LOGIN_SUCCESS = 'auth/loginSuccess';

// Interface pour la réponse de connexion flexible
interface LoginResponse {
  success?: boolean;
  token: string;
  data?: User;
  user?: User; // Pour la compatibilité avec l'ancien format
}

// Créer l'API d'authentification avant de l'utiliser dans le slice
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, any>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          if (result.data) {
            // Handle different response formats
            const token = result.data.token;
            const userData = result.data.data || result.data.user;
            
            if (token && userData) {
              // Save to localStorage
              localStorage.setItem('authToken', token);
              localStorage.setItem('userData', JSON.stringify(userData));
              
              // Update Redux state
              dispatch(authSlice.actions.loginSuccess({
                success: true,
                token,
                data: userData
              }));
              
              // Update RTK Query cache
              api.util.resetApiState();
            }
          }
        } catch (error) {
          console.error('Erreur lors de la connexion:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          api.util.resetApiState();
        }
      },
      transformErrorResponse: (response: { status: number; data: any }) => {
        console.error('🔥 Erreur de connexion détaillée:', response);
        return {
          status: response.status,
          data: response.data
        };
      },
    }),
    register: builder.mutation<{
      success: boolean;
      token: string;
      data: User;
    }, any>({ // Le body est maintenant `any` pour permettre le mapping
      query: (userData) => ({
        url: 'auth/register/client', // Endpoint client spécifique
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: { success: boolean; token: string; data: User }) => {
        console.log('✅ Réponse d\'inscription réussie:', response);
        return response;
      },
      transformErrorResponse: (response: { status: number; data: any }) => {
        console.error('🔥 Erreur d\'inscription détaillée:', {
          status: response.status,
          data: response.data,
          message: response.data?.message,
          details: response.data?.details,
          field: response.data?.field
        });
        return {
          status: response.status,
          data: response.data
        };
      },
      invalidatesTags: ['User'],
    }),
    registerPressing: builder.mutation<{
      success: boolean;
      token: string;
      data: User;
    }, any>({
      query: (userData) => ({
        url: 'auth/register/pressing', // Endpoint pressing spécifique
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: { success: boolean; token: string; data: User }) => {
        console.log('✅ Réponse d\'inscription pressing réussie:', response);
        return response;
      },
      transformErrorResponse: (response: { status: number; data: any }) => {
        console.error('🔥 Erreur d\'inscription pressing détaillée:', response);
        return {
          status: response.status,
          data: response.data
        };
      },
      invalidatesTags: ['User'],
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (credentials) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: credentials,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: `auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
    }),
    resendVerificationEmail: builder.mutation<{ message: string }, { email: string }>({
      query: (credentials) => ({
        url: 'auth/resend-verification-email',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

// Extraire les hooks d'authentification
export const { useLoginMutation, useRegisterMutation, useRegisterPressingMutation, useForgotPasswordMutation, useResetPasswordMutation, useResendVerificationEmailMutation } = authApi;

// Créer le slice d'authentification
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action pour déconnecter l'utilisateur
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Réinitialiser l'état de l'API pour effacer le cache
      api.util.resetApiState(); 
    },
    // Action pour synchroniser l'état depuis localStorage
    syncFromLocalStorage: (state) => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData && userData !== 'undefined' && userData !== 'null') {
          const user = JSON.parse(userData);
          state.token = token;
          state.user = user;
          console.log('🔄 État Redux synchronisé depuis localStorage:', { user: user.email, role: user.role });
        }
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation depuis localStorage:', error);
        // Nettoyer localStorage en cas d'erreur
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    },
    loginSuccess: (state, action) => {
      // Update Redux state
      state.user = action.payload.data;
      state.token = action.payload.token;
      
      // Save to localStorage
      localStorage.setItem('authToken', action.payload.token);
      localStorage.setItem('userData', JSON.stringify(action.payload.data));
      
      // Reset RTK Query cache
      api.util.resetApiState();
    },
  },
  extraReducers: (builder) => {
    // Gérer la réponse de connexion réussie
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        console.log('🔄 Login fulfilled, payload:', payload);
        
        // Avec le nouveau transformResponse, payload a la structure { user, token }
        const { user, token } = payload;
        
        // Vérifier que nous avons les données nécessaires
        if (user && token && user.role) {
          console.log('✅ Données de connexion valides:', { userId: user._id, role: user.role, hasToken: !!token });
          
          // Mettre à jour l'état Redux
          state.token = token;
          state.user = user;

          // Persister dans localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          
          console.log('💾 Données sauvegardées dans localStorage et Redux');
          
          // Reset the API state to clear cache after login
          api.util.resetApiState();
          return;
        }
        
        // Si nous arrivons ici, les données sont invalides
        console.error('❌ Réponse de connexion invalide:', payload);
        state.token = null;
        state.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    );
    
    // Gérer la réponse d'inscription client réussie
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, { payload }) => {
        console.log('🎉 Inscription client réussie, mise à jour de l\'état:', payload);
        state.token = payload.token;
        state.user = payload.data;
        // Sauvegarder dans localStorage
        localStorage.setItem('authToken', payload.token);
        localStorage.setItem('userData', JSON.stringify(payload.data));
      }
    );
    
    // Gérer la réponse d'inscription pressing réussie
    builder.addMatcher(
      authApi.endpoints.registerPressing.matchFulfilled,
      (state, { payload }) => {
        console.log('🎉 Inscription pressing réussie, mise à jour de l\'état:', payload);
        state.token = payload.token;
        state.user = payload.data;
        // Sauvegarder dans localStorage
        localStorage.setItem('authToken', payload.token);
        localStorage.setItem('userData', JSON.stringify(payload.data));
      }
    );
    
    // Gérer la déconnexion
    builder.addMatcher(
      authApi.endpoints.logout.matchFulfilled,
      (state) => {
        state.token = null;
        state.user = null;
        // Nettoyer localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    );
  },
});

// Exporter les actions et le réducteur
export const { logout, syncFromLocalStorage } = authSlice.actions;

export default authSlice.reducer;
