import api from '@/lib/axios';

// Lấy danh sách exams
export const getExams = (params) => 
  api.get('/api/public/exams', { params });
// lấy ra chi tiết bộ đề
export const getExamsDetail = (id) => 
  api.get(`/api/public/exams_detail/${id}`);
// Lấy chi tiết exam
export const getExamById = (id, params) => 
  api.get(`/api/public/exams/${id}`, { params });

// Lấy chi tiết test
export const getTestById = (id, params) => 
  api.get(`/api/public/tests/${id}`, { params });

// Lấy danh sách skills
export const getSkills = (params) => 
  api.get('/api/public/skills', { params });

// Lấy chi tiết skill
export const getSkillById = (id, params) => 
  api.get(`/api/public/skills/${id}`, { params });

// Lấy chi tiết section
export const getSectionById = (id, params) => 
  api.get(`/api/public/sections/${id}`, { params });

// Lấy question group và questions
export const getQuestionGroup = (id, params) => 
  api.get(`/api/public/question-groups/${id}`, { params });

export const getQuestionsByGroup = (groupId, params) => 
  api.get(`/api/public/question-groups/${groupId}/questions`, { params });
