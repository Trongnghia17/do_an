/**
 * FastAPI Service - Tất cả API endpoints cho FastAPI Backend
 * CHỈ DÙNG FASTAPI - Không còn Laravel
 */
import api from '@/lib/axios';

// ========== Authentication ==========
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login/json', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  changePassword: (data) => api.post('/auth/password/change', data),
  getLoginHistory: () => api.get('/auth/login-history'),
};

// ========== User Management ==========
export const userAPI = {
  listUsers: (params) => api.get('/users', { params }),
  getUser: (userId) => api.get(`/users/${userId}`),
  getUserStats: () => api.get('/users/stats/summary'),
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// ========== Exam Management ==========
export const examAPI = {
  listExams: (params) => api.get('/exams', { params }),
  getExam: (examId) => api.get(`/exams/${examId}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (examId, data) => api.put(`/exams/${examId}`, data),
  deleteExam: (examId) => api.delete(`/exams/${examId}`),
  
  // Exam Tests
  getExamTests: (examId) => api.get(`/exams/${examId}/tests`),
  createExamTest: (examId, data) => api.post(`/exams/${examId}/tests`, data),
  updateExamTest: (examId, testId, data) => api.put(`/exams/${examId}/tests/${testId}`, data),
  deleteExamTest: (examId, testId) => api.delete(`/exams/${examId}/tests/${testId}`),
};

// ========== Question Management ==========
export const questionAPI = {
  listQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (questionId) => api.get(`/questions/${questionId}`),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (questionId, data) => api.put(`/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),
};

// ========== Skills Management ==========
export const skillAPI = {
  listSkills: (params) => api.get('/skills', { params }),
  getSkill: (skillId) => api.get(`/skills/${skillId}`),
  createSkill: (data) => api.post('/skills', data),
  updateSkill: (skillId, data) => api.put(`/skills/${skillId}`, data),
  deleteSkill: (skillId) => api.delete(`/skills/${skillId}`),
};

// ========== Sections Management ==========
export const sectionAPI = {
  listSections: (skillId) => api.get(`/skills/${skillId}/sections`),
  getSection: (sectionId) => api.get(`/sections/${sectionId}`),
  createSection: (skillId, data) => api.post(`/skills/${skillId}/sections`, data),
  updateSection: (sectionId, data) => api.put(`/sections/${sectionId}`, data),
  deleteSection: (sectionId) => api.delete(`/sections/${sectionId}`),
};

// ========== AI Generation ==========
export const aiGenerationAPI = {
  generateQuestions: (data) => api.post('/generation/generate-questions', data),
  generateContent: (data) => api.post('/generation/generate-content', data),
  generateExam: (data) => api.post('/generation/generate-exam', data),
};

// ========== AI Grading ==========
export const aiGradingAPI = {
  gradeWriting: (data) => api.post('/grading/grade-writing', data),
  gradeSpeaking: (data) => api.post('/grading/grade-speaking', data),
  getFeedback: (data) => api.post('/grading/feedback', data),
  gradeBatch: (data) => api.post('/grading/grade-batch', data),
};

// ========== File Upload ==========
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (filename) => api.delete('/upload/image', { params: { filename } }),
};

// Export all as default
export default {
  auth: authAPI,
  user: userAPI,
  exam: examAPI,
  question: questionAPI,
  aiGeneration: aiGenerationAPI,
  aiGrading: aiGradingAPI,
  upload: uploadAPI,
  skill: skillAPI,
  section: sectionAPI,
};

