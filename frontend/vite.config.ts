/// <reference types="node" />
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  // Remote server configuration
  const remoteHost = process.env.VITE_REMOTE_HOST || "103.179.45.68";
  const backendDomain = process.env.VITE_BACKEND_DOMAIN || "api.manabou.co.jp";
  const frontendDomain = process.env.VITE_FRONTEND_DOMAIN || "manabou.co.jp";

  // Determine HMR host based on environment
  // When accessing via domain (manabou.co.jp), use WSS for HTTPS compatibility
  let hmrHost;
  let hmrProtocol;
  let hmrPort;

  if (process.env.VITE_REMOTE_HOST === "") {
    // Local development
    hmrHost = "localhost";
    hmrProtocol = "ws";
    hmrPort = 5173;
  } else {
    // Remote server - check if using domain (HTTPS) or IP (HTTP)
    const useHttps =
      process.env.VITE_USE_HTTPS === "true" ||
      mode === "production" ||
      process.env.VITE_USE_DOMAIN === "true" ||
      process.env.VITE_REMOTE_HOST?.includes("manabou.co.jp");

    if (useHttps) {
      // Using domain with HTTPS - use WSS (through reverse proxy like nginx)
      hmrHost = frontendDomain;
      hmrProtocol = "wss";
      // Use standard HTTPS port (443) - reverse proxy will handle WebSocket upgrade
      hmrPort = process.env.VITE_HMR_PORT
        ? parseInt(process.env.VITE_HMR_PORT)
        : 443;
    } else {
      // Development on remote server with IP (HTTP)
      hmrHost = remoteHost;
      hmrProtocol = "ws";
      hmrPort = 5173;
    }
  }

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
        port: hmrPort,
        protocol: hmrProtocol,
      },

      // ✅ API proxy configuration
      proxy: {
        "/api": {
          target:
            mode === "production"
              ? `https://${backendDomain}`
              : "http://localhost:4000",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
