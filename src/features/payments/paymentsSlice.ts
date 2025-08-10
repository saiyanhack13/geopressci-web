import { createSlice } from '@reduxjs/toolkit';
import { Payment } from '../../types';
import { api } from '../../services/api';

interface PaymentsState {
  items: Payment[];
}

const initialState: PaymentsState = {
  items: [],
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      paymentsApi.endpoints.getPayments.matchFulfilled,
      (state, { payload }) => {
        state.items = payload;
      }
    );
  },
});

export default paymentsSlice.reducer;

export const paymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], void>({
      query: () => 'payments',
      providesTags: ['Payment'],
    }),
    initiatePayment: builder.mutation<Payment, Partial<Payment>>({
      query: (payment) => ({
        url: 'payments/initiate',
        method: 'POST',
        body: payment,
      }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const { useGetPaymentsQuery, useInitiatePaymentMutation } = paymentsApi;
