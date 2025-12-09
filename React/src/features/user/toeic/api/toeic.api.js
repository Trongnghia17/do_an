import api from '@/lib/axios';
// Lấy chi tiết skill
export const getSkillById = (id, params) => 
  api.get(`/skills/${id}/`, { params });

// Lấy chi tiết section
export const getSectionById = (id, params) => 
  api.get(`/sections/${id}/`, { params });