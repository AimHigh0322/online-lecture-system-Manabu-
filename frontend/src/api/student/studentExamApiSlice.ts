import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Exam,
  Question,
  ExamAttempt,
  ExamAnswer,
  ApiResponse,
} from "../exam/examTypes";

export const studentExamApiSlice = createApi({
  reducerPath: "studentExamApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      import.meta.env.VITE_API_URL || "http://85.131.238.90:4000"
    }/api/student/exams`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["AvailableExams", "ExamHistory", "ExamAttempt"],
  endpoints: (builder) => ({
    // Get available exams for student
    getAvailableExams: builder.query<
      { success: boolean; exams: Exam[] },
      { courseId?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.courseId) searchParams.append("courseId", params.courseId);
        const queryString = searchParams.toString();
        return queryString ? `/?${queryString}` : "/";
      },
      providesTags: ["AvailableExams"],
    }),

    // Get student's exam history
    getExamHistory: builder.query<
      { success: boolean; attempts: ExamAttempt[] },
      void
    >({
      query: () => "/history",
      providesTags: ["ExamHistory"],
    }),

    // Start a new exam attempt
    startExam: builder.mutation<
      { success: boolean; attemptId: string; exam: Exam },
      { examId: string }
    >({
      query: ({ examId }) => ({
        url: `/${examId}/start`,
        method: "POST",
      }),
      invalidatesTags: ["ExamAttempt", "ExamHistory"],
    }),

    // Get exam questions for current attempt
    getExamQuestions: builder.query<
      { success: boolean; questions: Question[] },
      { attemptId: string }
    >({
      query: ({ attemptId }) => `/attempt/${attemptId}/questions`,
      providesTags: (_result, _error, { attemptId }) => [
        { type: "ExamAttempt", id: attemptId },
      ],
    }),

    // Save exam progress
    saveExamProgress: builder.mutation<
      ApiResponse<void>,
      {
        attemptId: string;
        answers: ExamAnswer[];
        currentQuestionIndex?: number;
      }
    >({
      query: ({ attemptId, answers, currentQuestionIndex }) => ({
        url: `/attempt/${attemptId}/progress`,
        method: "PATCH",
        body: { answers, currentQuestionIndex },
      }),
      invalidatesTags: (_result, _error, { attemptId }) => [
        { type: "ExamAttempt", id: attemptId },
      ],
    }),

    // Get specific exam attempt details
    getExamAttempt: builder.query<
      { success: boolean; attempt: ExamAttempt },
      { attemptId: string }
    >({
      query: ({ attemptId }) => `/attempt/${attemptId}`,
      providesTags: (_result, _error, { attemptId }) => [
        { type: "ExamAttempt", id: attemptId },
      ],
    }),

    // Submit exam with answers
    submitExam: builder.mutation<
      { success: boolean; message: string; attempt: ExamAttempt },
      { attemptId: string; answers: ExamAnswer[] }
    >({
      query: ({ attemptId, answers }) => ({
        url: `/attempt/${attemptId}/submit`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: (_result, _error, { attemptId }) => [
        { type: "ExamAttempt", id: attemptId },
        "ExamHistory",
      ],
    }),

    // Get exam results by attempt ID
    getExamResults: builder.query<
      { success: boolean; attempt: ExamAttempt },
      { attemptId: string }
    >({
      query: ({ attemptId }) => `/attempt/${attemptId}/results`,
      providesTags: (_result, _error, { attemptId }) => [
        { type: "ExamAttempt", id: attemptId },
      ],
    }),
  }),
});

export const {
  useGetAvailableExamsQuery,
  useGetExamHistoryQuery,
  useStartExamMutation,
  useGetExamQuestionsQuery,
  useSaveExamProgressMutation,
  useGetExamAttemptQuery,
  useSubmitExamMutation,
  useGetExamResultsQuery,
} = studentExamApiSlice;
