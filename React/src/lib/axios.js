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
  // Try to get token from Zustand store first
  let { token } = useAuth.getState();
  
  // Fallback to localStorage if Zustand store doesn't have token
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  console.log('Axios interceptor - token:', token ? `${token.substring(0, 20)}...` : 'null'); // Debug log
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No token found! Request may fail with 401');
  }
  
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      console.error('401 Unauthorized - Token invalid or expired');
      
      // Only logout if this is not a login request
      const isLoginRequest = err.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        console.warn('Logging out due to 401 error');
        useAuth.getState().logout();
        localStorage.clear();
        
        // Redirect to admin login if on admin page
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
