import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pressing } from '../../types';
import { api } from '../../services/api';

interface PressingsState {
  items: Pressing[];
  selectedPressing: Pressing | null;
  filters: {
    search?: string;
    neighborhood?: string;
  };
}

const initialState: PressingsState = {
  items: [],
  selectedPressing: null,
  filters: {},
};

const pressingsSlice = createSlice({
  name: 'pressings',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PressingsState['filters']>) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      pressingsApi.endpoints.getPressings.matchFulfilled,
      (state, { payload }) => {
        state.items = payload;
      }
    );
  },
});

export const { setFilters } = pressingsSlice.actions;

export default pressingsSlice.reducer;

export const pressingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPressings: builder.query<Pressing[], void>({
      query: () => 'pressings',
      providesTags: ['Pressing'],
    }),
    getPressingById: builder.query<Pressing, string>({
      query: (id) => `pressings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Pressing', id }],
    }),
  }),
});

export const { useGetPressingsQuery, useGetPressingByIdQuery } = pressingsApi;
