import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Tải biến môi trường dựa trên mode (development, production,...)
  const env = loadEnv(mode, process.cwd());

  // Log cấu hình để debug
  const apiPrefix = env.VITE_API_PREFIX || "/api";
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:5000";

  console.log("=== Cấu hình Vite ===");
  console.log("Mode:", mode);
  console.log("API Prefix:", apiPrefix);
  console.log("API Base URL:", apiBaseUrl);

  const config = {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://backend:5000",
          changeOrigin: true,
        },
      },
    },
  };

  console.log(
    "Proxy configuration:",
    JSON.stringify(config.server.proxy, null, 2)
  );

  return config;
});
