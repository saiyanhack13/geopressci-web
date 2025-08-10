import { Middleware, MiddlewareAPI, Dispatch, AnyAction, UnknownAction } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { logout } from '../features/auth/authSlice';
import type { RootState } from '../store';

export const validateToken = async (
  dispatch: Dispatch<AnyAction>,
  getState: () => RootState
): Promise<string | null> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token not found');
    }
    return token;
  } catch (error) {
    console.error('Token validation failed:', error);
    dispatch(logout());
    return null;
  }
};

// Middleware to validate token before API calls
export const authMiddleware = (api: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => 
  (next: Dispatch<AnyAction>) => 
  async (action: AnyAction) => {
    // Skip token validation for RTK Query actions and auth actions
    if (
      typeof action === 'object' &&
      action.type &&
      (action.type.includes('login') || 
       action.type.includes('register') || 
       action.type.includes('auth') || 
       action.type.includes('query') || 
       action.type.includes('mutation'))
    ) {
      return next(action);
    }

    // Only intercept function actions (thunks)
    if (typeof action === 'function') {
      try {
        const token = await validateToken(api.dispatch, api.getState);
        if (!token) {
          window.location.href = '/login';
          return;
        }
        return next(action);
      } catch (error) {
        console.error('Authentication middleware error:', error);
        window.location.href = '/login';
        return;
      }
    }
    return next(action);
  };

// RTK Query will handle middleware initialization internally
