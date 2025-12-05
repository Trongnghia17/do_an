import api from '@/lib/axios';

// FastAPI Auth Endpoints
export const register = (payload) =>
  api.post('/auth/register', payload);

export const passwordLogin = (payload) =>
  api.post('/auth/login/json', payload);

export const logout = () =>
  api.post('/auth/logout');

export const getCurrentUser = () =>
  api.get('/auth/me');

export const refreshToken = (payload) =>
  api.post('/auth/refresh-token', payload);

export const changePassword = (payload) =>
  api.post('/auth/password/change', payload);

export const getLoginHistory = () =>
  api.get('/auth/login-history');

// Note: OTP và Social login có thể cần thêm vào FastAPI sau
export const requestOtp = (payload) =>
  api.post('/auth/otp/request', payload); 

export const verifyOtp = (payload) =>
  api.post('/auth/otp/verify', payload);
