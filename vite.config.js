/**
 * File: admin-frontend/vite.config.js
 *
 * Purpose:
 * Vite development server configuration.
 *
 * Features:
 * - React plugin
 * - Admin backend API proxy
 * - Server-side Super Admin API key injection
 * - Staff JWT requests do not receive Super Admin API key
 *
 * Security:
 * ADMIN_API_KEY is read by the Vite server.
 * It is not exposed using VITE_ environment variables.
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
proxyReq.setHeader("x-admin-key", adminKey);

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

              // Staff requests contain Authorization: Bearer <JWT>.
              const hasStaffAuthorization =
                Boolean(req.headers.authorization);

              // Inject Super Admin key only when there is
              // no Authorization header.
              if (!hasStaffAuthorization && adminKey) {
                proxyReq.setHeader(
                  "x-admin-key",
                  adminKey
                );
              }
            });
          },
        },
      },
    },
  };
});