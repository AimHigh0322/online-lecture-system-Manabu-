import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all interfaces for VPS deployment
    proxy: {
      "/api": {
        target:
          mode === "production"
            ? "http://85.131.238.90:4000"
            : "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));
