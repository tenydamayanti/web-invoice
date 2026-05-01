import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    return `${protocol}//${hostname}:8000/api`;
  }

  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
}

const api = axios.create({
  // Ikuti host yang sedang dibuka user, supaya aplikasi bisa diakses
  // baik lewat localhost maupun IP LAN tanpa rebuild ulang.
  baseURL: resolveApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

let requestInterceptorRegistered = false;
let responseInterceptorRegistered = false;

if (typeof window !== "undefined") {
  if (!requestInterceptorRegistered) {
    api.interceptors.request.use((config) => {
      const token = getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    requestInterceptorRegistered = true;
  }

  if (!responseInterceptorRegistered) {
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          removeToken();

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      },
    );

    responseInterceptorRegistered = true;
  }
}

export default api;
