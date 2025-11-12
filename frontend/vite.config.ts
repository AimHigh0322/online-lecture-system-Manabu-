import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  // Remote server configuration
  const remoteHost = process.env.VITE_REMOTE_HOST || "85.131.238.90";
  const isDev = mode === "development";

  // For remote deployments, WebSocket connections often fail due to firewall/network issues
  // HMR is disabled by default for remote servers to avoid connection errors
  // Set VITE_ENABLE_HMR=true to enable HMR (requires proper WebSocket configuration)
  const enableHMR = process.env.VITE_ENABLE_HMR === "true";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0", // Listen on all interfaces for VPS deployment
      port: 5173,
      strictPort: false,
      // HMR is disabled by default for remote deployments to prevent WebSocket errors
      // The application will work normally, you'll just need to manually refresh after changes
      // To enable HMR, set VITE_ENABLE_HMR=true and ensure port 5173 is open for WebSocket connections
      hmr:
        isDev && enableHMR
          ? {
              host: remoteHost,
              port: 5173,
              protocol: "ws",
            }
          : false,
      watch: {
        usePolling: process.env.VITE_USE_POLLING === "true",
      },
      proxy: {
        "/api": {
          target:
            mode === "production"
              ? `http://${remoteHost}:4000`
              : "http://localhost:4000",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
