import { baseUrl } from "@/utils/constant";
import axios from "axios";

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isClearingAuth = false;

// Global response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isLoginOrRegister =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register");

      // Don't intercept normal bad password / credential errors on login or signup forms
      if (!isLoginOrRegister && !isClearingAuth) {
        isClearingAuth = true;

        // Clear cookies asynchronously with keepalive
        fetch("/api/auth/clear-cookie", { method: "POST", keepalive: true }).catch(() => {});
        document.cookie = "user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        const currentPath = window.location.pathname;
        const isProtectedRoute =
          currentPath === "/dashboard" || currentPath.startsWith("/dashboard/");

        // Immediately redirect if user is currently on a protected route
        if (isProtectedRoute) {
          window.location.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

