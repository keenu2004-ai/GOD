/// <reference types="vite/client" />
import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || '/api/v1';
const baseURL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('theiakshi_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('theiakshi_refresh_token');
        if (!refreshToken) {
          localStorage.removeItem('theiakshi_access_token');
          window.location.reload();
          return Promise.reject(error);
        }
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        if (res.data?.success && res.data.data?.accessToken) {
          localStorage.setItem('theiakshi_access_token', res.data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('theiakshi_access_token');
        localStorage.removeItem('theiakshi_refresh_token');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

