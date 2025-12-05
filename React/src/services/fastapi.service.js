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
};

// ========== Exam Management ==========
export const examAPI = {
  listExams: (params) => api.get('/exams', { params }),
  getExam: (examId) => api.get(`/exams/${examId}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (examId, data) => api.put(`/exams/${examId}`, data),
  deleteExam: (examId) => api.delete(`/exams/${examId}`),
  getExamTests: (examId) => api.get(`/exams/${examId}/tests`),
};

// ========== Question Management ==========
export const questionAPI = {
  listQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (questionId) => api.get(`/questions/${questionId}`),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (questionId, data) => api.put(`/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),
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

// Export all as default
export default {
  auth: authAPI,
  user: userAPI,
  exam: examAPI,
  question: questionAPI,
  aiGeneration: aiGenerationAPI,
  aiGrading: aiGradingAPI,
};
