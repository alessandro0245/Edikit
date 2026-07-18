import { baseUrl } from "@/utils/constant";
import axios from "axios";

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const forgotPassword = async (email: string) => {
    try {
        const { data } = await api.post("/auth/forgot-password", { email });
        return data;
    } catch (error) {
        // throw error;
    }
}

export const resetPassword = async (token: string, password: string) => {
    try {
        const { data } = await api.post("/auth/reset-password", { token, password });
        return data;
    } catch (error) {
        throw error;
    }
}