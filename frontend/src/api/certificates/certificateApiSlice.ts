import { apiSlice } from "../apiSlice";

export interface Certificate {
  _id: string;
  userId: string;
  certificateNumber: string;
  name: string;
  gender: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  issuedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueCertificateRequest {
  userId: string;
}

export interface IssueCertificateResponse {
  success: boolean;
  message: string;
  data?: Certificate;
}

export interface CertificateResponse {
  success: boolean;
  data?: Certificate;
  message?: string;
}

export interface CheckCertificateResponse {
  success: boolean;
  data: {
    exists: boolean;
    certificate: Certificate | null;
  };
}

export const certificateApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Issue certificate (admin only)
    issueCertificate: builder.mutation<
      IssueCertificateResponse,
      IssueCertificateRequest
    >({
      query: (data) => ({
        url: "/api/certificates/issue",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: IssueCertificateResponse) => {
        if (!response.success) {
          throw new Error(
            response.message || "修了証の発行に失敗しました"
          );
        }
        return response;
      },
      invalidatesTags: ["Notifications"],
    }),

    // Get certificate for a user
    getCertificate: builder.query<Certificate, string>({
      query: (userId) => ({
        url: `/api/certificates/${userId}`,
        method: "GET",
      }),
      transformResponse: (response: CertificateResponse) => {
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "修了証の取得に失敗しました"
          );
        }
        return response.data;
      },
    }),

    // Check if certificate exists
    checkCertificate: builder.query<
      { exists: boolean; certificate: Certificate | null },
      string
    >({
      query: (userId) => ({
        url: `/api/certificates/check/${userId}`,
        method: "GET",
      }),
      transformResponse: (response: CheckCertificateResponse) => {
        if (!response.success) {
          throw new Error(
            response.message || "修了証の確認に失敗しました"
          );
        }
        return response.data;
      },
    }),
  }),
});

export const {
  useIssueCertificateMutation,
  useGetCertificateQuery,
  useCheckCertificateQuery,
} = certificateApiSlice;

