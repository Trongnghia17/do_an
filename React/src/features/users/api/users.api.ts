import api from '@/lib/axios';
export const getMe = () => api.get('/api/me');
