import axios from "axios";

function resolveBaseUrl() {
  const forceSameHost = process.env.NEXT_PUBLIC_API_USE_SAME_HOST === "1";
  if (!forceSameHost) {
    return process.env.NEXT_PUBLIC_API_ENDPOINT;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");

    if (isLocalHost) {
      const apiPort = process.env.NEXT_PUBLIC_API_DEV_PORT || "8000";
      return `${protocol}//${hostname}:${apiPort}`;
    }
  }

  return process.env.NEXT_PUBLIC_API_ENDPOINT;
}

export const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
