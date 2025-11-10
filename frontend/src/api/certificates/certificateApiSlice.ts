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
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateResponse {
  success: boolean;
  data: Certificate;
  message?: string;
}

export const certificateApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCertificate: builder.query<Certificate | null, string>({
      // Handle 404 as a valid response (certificate doesn't exist)
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          console.log("Fetching certificate for userId:", arg);
          const result = await fetchWithBQ(`/api/certificates/${arg}`);
          console.log("Certificate API result:", result);
          if (result.error) {
            console.log("Certificate API error:", result.error);
            // If 404, return null (certificate doesn't exist)
            if (result.error.status === 404) {
              console.log("Certificate not found (404)");
              return { data: null };
            }
            return { error: result.error };
          }
          console.log("Certificate data received:", result.data);
          return { data: (result.data as CertificateResponse).data };
        } catch (error) {
          console.error("Certificate fetch error:", error);
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      providesTags: ["Certificate"],
    }),
  }),
});

export const { useGetCertificateQuery } = certificateApiSlice;

