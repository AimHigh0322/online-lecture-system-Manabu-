import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  // Remote server configuration
  const remoteHost = process.env.VITE_REMOTE_HOST || "85.131.238.90";
  const hmrHost =
    process.env.VITE_REMOTE_HOST === "" ? "localhost" : remoteHost;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0", // Listen on all interfaces for VPS deployment
      port: 5173,
      strictPort: false,

      // ✅ Allow your production domain(s)
      allowedHosts: ["www.manabou.co.jp", "manabou.co.jp"],

      // ✅ Configure HMR for remote access
      hmr: {
        host: hmrHost,
        port: 5173,
        protocol: "ws",
      },

      // ✅ API proxy configuration
      proxy: {
        "/api": {
          target:
            mode === "production"
              ? `http://${remoteHost}:4000`
              : "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
