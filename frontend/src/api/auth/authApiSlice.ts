import { apiSlice } from "../apiSlice";
import type {
  LoginCredentials,
  LoginResponse,
  UserProfile,
} from "./authService";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: LoginResponse) => {
        if (!response.success) {
          throw new Error(response.message || "ログインに失敗しました");
        }
        // Store token and user data
        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        return response;
      },
    }),

    getUserProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: "/api/auth/profile",
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        profile?: UserProfile;
        message?: string;
      }) => {
        if (!response.success || !response.profile) {
          throw new Error(
            response.message || "プロフィールの取得に失敗しました"
          );
        }
        return response.profile;
      },
      providesTags: ["Auth"],
    }),

    getStudents: builder.query<
      { id: string; password: string; email: string; seatNumber: number }[],
      string
    >({
      query: (groupId) => ({
        url: `/api/auth/students/${groupId}`,
        method: "GET",
      }),
      transformResponse: (response: {
        success: boolean;
        students?: {
          id: string;
          password: string;
          email: string;
          seatNumber: number;
        }[];
        message?: string;
      }) => {
        if (!response.success || !response.students) {
          throw new Error(response.message || "学生情報の取得に失敗しました");
        }
        return response.students;
      },
      providesTags: (_result, _error, groupId) => [
        { type: "Students", id: groupId },
      ],
    }),
  }),
});

export const { useLoginMutation, useGetUserProfileQuery, useGetStudentsQuery } =
  authApiSlice;
