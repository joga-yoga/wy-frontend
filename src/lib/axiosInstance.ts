// lib/axiosInstance.ts
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
});

// Optionally add an interceptor to attach token from localStorage on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
