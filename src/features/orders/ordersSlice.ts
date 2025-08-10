import { createSlice } from '@reduxjs/toolkit';
import { Order } from '../../types';
import { api } from '../../services/api';

interface OrdersState {
  items: Order[];
}

const initialState: OrdersState = {
  items: [],
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      ordersApi.endpoints.getOrders.matchFulfilled,
      (state, { payload }) => {
        state.items = payload;
      }
    );
  },
});

export default ordersSlice.reducer;

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => 'orders',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Order', id: 'LIST' }]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    createOrder: builder.mutation<Order, Partial<Order>>({
      query: (order) => ({
        url: 'orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),
  }),
});

export const { useGetOrdersQuery, useCreateOrderMutation, useUpdateOrderStatusMutation } = ordersApi;
