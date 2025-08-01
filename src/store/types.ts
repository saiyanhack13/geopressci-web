import { store } from './index';

// Inférez les types `RootState` et `AppDispatch` depuis le store lui-même
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
