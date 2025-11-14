import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Question {
  _id: string;
  type: string;
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  correctAnswer?: boolean | null;
  estimatedTime: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface QuestionFormData {
  type: string;
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  correctAnswer?: boolean | null;
  estimatedTime: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export interface QuestionListResponse {
  success: boolean;
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface QuestionTypeInfo {
  value: string;
  label: string;
  description: string;
}

export const questionApiSlice = createApi({
  reducerPath: "questionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      import.meta.env.VITE_API_URL || "http://103.179.45.68:4000"
    }/api/questions`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Question", "QuestionTypes"],
  endpoints: (builder) => ({
    // Get all questions with optional filtering
    getQuestions: builder.query<
      QuestionListResponse,
      {
        type?: string;
        courseId?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.type) searchParams.append("type", params.type);
        if (params.courseId) searchParams.append("courseId", params.courseId);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        return queryString ? `/?${queryString}` : "/";
      },
      providesTags: ["Question"],
    }),

    // Get question by ID
    getQuestionById: builder.query<
      { success: boolean; question: Question },
      string
    >({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Question", id }],
    }),

    // Create new question
    createQuestion: builder.mutation<ApiResponse<Question>, QuestionFormData>({
      query: (questionData) => ({
        url: "/",
        method: "POST",
        body: questionData,
      }),
      invalidatesTags: ["Question"],
    }),

    // Update question
    updateQuestion: builder.mutation<
      ApiResponse<Question>,
      { id: string; data: Partial<QuestionFormData> }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Question", id },
        "Question",
      ],
    }),

    // Delete question
    deleteQuestion: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Question"],
    }),

    // Get question types
    getQuestionTypes: builder.query<
      { success: boolean; questionTypes: QuestionTypeInfo[] },
      void
    >({
      query: () => "/types",
      providesTags: ["QuestionTypes"],
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetQuestionTypesQuery,
} = questionApiSlice;
