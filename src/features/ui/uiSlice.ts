import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isModalOpen: boolean;
  modalContent: string | null;
  isLoading: boolean;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

const initialState: UIState = {
  isModalOpen: false,
  modalContent: null,
  isLoading: false,
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<string>) => {
      state.isModalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.modalContent = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setNotification: (state, action: PayloadAction<UIState['notification']>) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  openModal,
  closeModal,
  setLoading,
  setNotification,
  clearNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
