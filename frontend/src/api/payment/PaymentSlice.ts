import { apiSlice } from "../apiSlice";

// Payment types
export interface PaymentMetadata {
  groupId?: string;
  groupName?: string;
  course?: string;
  country?: string;
  numberOfSeats?: number;
  [key: string]: string | number | undefined;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentStatusResponse {
  status: string;
  amount?: number;
  currency?: string;
  metadata?: PaymentMetadata;
}

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<
      PaymentIntentResponse,
      { amount: number; currency?: string; metadata?: PaymentMetadata }
    >({
      query: ({ amount, currency = "usd", metadata }) => ({
        url: "/api/payment/create-payment-intent",
        method: "POST",
        body: {
          amount,
          currency,
          metadata,
        },
      }),
      transformResponse: (response: PaymentIntentResponse) => {
        if (!response.clientSecret) {
          throw new Error("支払い処理の作成に失敗しました");
        }
        return response;
      },
      invalidatesTags: ["Payment"],
    }),

    getPaymentStatus: builder.query<PaymentStatusResponse, string>({
      query: (paymentIntentId) => ({
        url: `/api/payment/status/${paymentIntentId}`,
        method: "GET",
      }),
      transformResponse: (response: PaymentStatusResponse) => {
        if (!response.status) {
          throw new Error("支払いステータスの取得に失敗しました");
        }
        return response;
      },
      providesTags: (_result, _error, paymentIntentId) => [
        { type: "Payment", id: paymentIntentId },
      ],
    }),
  }),
});

export const { useCreatePaymentIntentMutation, useGetPaymentStatusQuery } =
  paymentApiSlice;
