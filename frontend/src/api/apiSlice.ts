import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Support both local and VPS environments based on NODE_ENV
const getApiUrl = () => {
  // Check if we have an explicit API URL from environment variables
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Determine environment and set appropriate API URL
  const isProduction =
    import.meta.env.MODE === "production" ||
    import.meta.env.VITE_NODE_ENV === "production";

  if (isProduction) {
    return "http://85.131.238.90:4000";
  } else {
    return "http://localhost:4000";
  }
};

const API_URL = getApiUrl();

// Base API slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Profile", "Auth", "Payment", "Students", "Notifications"],
  endpoints: () => ({}),
});
