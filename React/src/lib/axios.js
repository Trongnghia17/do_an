import axios from 'axios';
import useAuth from '@/features/user/auth/store/auth.store';

// CHỈ DÙNG FASTAPI - Không còn Laravel
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${FASTAPI_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const { token } = useAuth.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
