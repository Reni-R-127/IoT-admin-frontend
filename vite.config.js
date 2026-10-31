/**
 * File: admin-frontend/vite.config.js
 * Purpose: Admin frontend development server and backend API proxy.
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const target =
    env.ADMIN_API_TARGET || "http://localhost:5001";

  const adminKey = env.ADMIN_API_KEY || "";

  return {
    plugins: [react()],

    server: {
      port: 5174,
      strictPort: true,

      proxy: {
        "/api/admin": {
          target,
          changeOrigin: true,

          configure(proxy) {
            proxy.on("proxyReq", (proxyReq, req) => {
              const hasAuthorization =
                Boolean(req.headers.authorization);

              // Super Admin requests only.
              if (!hasAuthorization && adminKey) {
                proxyReq.setHeader(
                  "x-admin-key",
                  adminKey
                );
              }

              // Staff JWT requests must not receive Admin API key.
              if (hasAuthorization) {
                proxyReq.removeHeader("x-admin-key");
              }
            });
          },
        },
      },
    },
  };
});