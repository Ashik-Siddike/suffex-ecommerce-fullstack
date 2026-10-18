import axios from "axios";
import { baseUrl } from "../config/baseURL";

const axiosClient = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach Bearer token if present in localStorage
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const rawToken = localStorage.getItem("token");
      if (rawToken) {
        const token =
          rawToken.startsWith('"') && rawToken.endsWith('"')
            ? JSON.parse(rawToken)
            : rawToken;

        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not parse token from localStorage:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error formatting & clean session handling
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    try {
      // Check token expiration timestamp
      const userInfoStr = localStorage.getItem("userInfo");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const isTokenExpired = userInfo?.exp && userInfo.exp * 1000 < Date.now();

        if (isTokenExpired && !originalRequest?._retry) {
          if (originalRequest) originalRequest._retry = true;
          localStorage.removeItem("token");
          localStorage.removeItem("userInfo");
        }
      }
    } catch (e) {
      console.warn("Could not check token expiration:", e);
    }

    // Handle 401 Unauthorized from backend - clear invalid session without abrupt hard redirect
    if (error?.response?.status === 401) {
      if (originalRequest) originalRequest._retry = true;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      console.warn("401 Unauthorized - Cleared invalid session token:", error?.config?.url);
    }

    const formattedError = {
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected network error occurred.",
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(formattedError);
  }
);

export default axiosClient;
