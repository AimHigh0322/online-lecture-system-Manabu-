import { apiSlice } from "../apiSlice";

export interface LectureProgress {
  materialName: string;
  progress: number;
}

export interface CourseData {
  courseId: string;
  courseName: string;
  studentId: string;
  password: string;
  status: string;
  lectureProgress: LectureProgress[];
}

export interface ProfileData {
  displayName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  avatar?: string;
  courses?: CourseData[];
}

export interface ProfileResponse {
  success: boolean;
  profile?: ProfileData;
  message?: string;
}

export const profileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileData, void>({
      query: () => ({
        url: "/api/profile",
        method: "GET",
      }),
      transformResponse: (response: ProfileResponse) => {
        if (!response.success || !response.profile) {
          throw new Error(
            response.message || "プロフィールの取得に失敗しました"
          );
        }
        return response.profile;
      },
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<ProfileResponse, ProfileData>({
      query: (profileData) => ({
        url: "/api/profile",
        method: "PUT",
        body: profileData,
      }),
      transformResponse: (response: ProfileResponse) => {
        if (!response.success) {
          throw new Error(
            response.message || "プロフィールの更新に失敗しました"
          );
        }
        return response;
      },
      invalidatesTags: ["Profile"],
    }),

    uploadAvatar: builder.mutation<ProfileResponse, FormData>({
      query: (formData) => ({
        url: "/api/profile/avatar",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ProfileResponse) => {
        if (!response.success) {
          throw new Error(
            response.message || "アバターのアップロードに失敗しました"
          );
        }
        return response;
      },
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = profileApiSlice;
