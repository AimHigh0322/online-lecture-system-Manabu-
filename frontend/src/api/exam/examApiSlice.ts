import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "../auth/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";

export const examApiSlice = createApi({
  reducerPath: "examApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/courses`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ExamEligibility"],
  endpoints: (builder) => ({
    getExamEligibility: builder.query({
      query: () => "/exam-eligibility",
      providesTags: ["ExamEligibility"],
    }),
    checkExamEligibility: builder.mutation({
      query: () => ({
        url: "/exam-eligibility/check",
        method: "POST",
      }),
      invalidatesTags: ["ExamEligibility"],
    }),
  }),
});

export const { useGetExamEligibilityQuery, useCheckExamEligibilityMutation } =
  examApiSlice;
