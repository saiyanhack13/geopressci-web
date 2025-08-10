// @ts-nocheck
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import { api } from '../services/api';
import { pressingApi } from '../services/pressingApi';
import authReducer from '../features/auth/authSlice';
import pressingsReducer from '../features/pressings/pressingsSlice';
import ordersReducer from '../features/orders/ordersSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import uiReducer from '../features/ui/uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Seul le slice 'auth' sera persisté
};

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [pressingApi.reducerPath]: pressingApi.reducer,
  auth: authReducer,
  pressings: pressingsReducer,
  orders: ordersReducer,
  payments: paymentsReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE', 
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH'
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['_persist'],
      },
    }).concat(api.middleware, pressingApi.middleware),
});

export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
