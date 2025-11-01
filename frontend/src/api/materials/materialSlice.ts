import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Material {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  videoUrl: string;
  videoFileName: string;
  videoSize: number;
  duration: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsResponse {
  success: boolean;
  materials: Material[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface MaterialResponse {
  success: boolean;
  material: Material;
}

export const materialApiSlice = createApi({
  reducerPath: "materialApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/materials",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Material"],
  endpoints: (builder) => ({
    // Get all materials
    getMaterials: builder.query<
      MaterialsResponse,
      { courseId?: string; page?: number; limit?: number }
    >({
      query: ({ courseId, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (courseId) params.append("courseId", courseId);
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        return `?${params.toString()}`;
      },
      providesTags: ["Material"],
    }),

    // Get materials by course ID
    getMaterialsByCourse: builder.query<MaterialsResponse, string>({
      query: (courseId) => `?courseId=${courseId}`,
      providesTags: ["Material"],
    }),

    // Get single material by ID
    getMaterialById: builder.query<MaterialResponse, string>({
      query: (id) => `/${id}`,
      providesTags: (_, __, id) => [{ type: "Material", id }],
    }),

    // Upload material (this would be used by admin)
    uploadMaterial: builder.mutation<MaterialResponse, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Material"],
    }),

    // Update material
    updateMaterial: builder.mutation<
      MaterialResponse,
      { id: string; data: Partial<Material> }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Material", id },
        "Material",
      ],
    }),

    // Delete material
    deleteMaterial: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Material"],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialsByCourseQuery,
  useGetMaterialByIdQuery,
  useUploadMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} = materialApiSlice;
