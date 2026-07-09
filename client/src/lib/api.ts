import { baseUrl } from "@/utils/constant";
import axios from "axios";

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add Bearer token if cookie not available (mobile browser fallback)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("user_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 Token added to request header");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
