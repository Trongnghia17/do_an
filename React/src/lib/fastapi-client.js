import axios from 'axios';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${FASTAPI_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Generation API
export const aiGenerationAPI = {
  // Sinh câu hỏi tự động
  generateQuestions: async (data) => {
    const response = await apiClient.post('/generation/generate-questions', data);
    return response.data;
  },

  // Sinh nội dung (passage, dialogue)
  generateContent: async (data) => {
    const response = await apiClient.post('/generation/generate-content', data);
    return response.data;
  },

  // Sinh toàn bộ đề thi
  generateExam: async (data) => {
    const response = await apiClient.post('/generation/generate-exam', data);
    return response.data;
  },
};

// AI Grading API
export const aiGradingAPI = {
  // Chấm bài Writing
  gradeWriting: async (data) => {
    const response = await apiClient.post('/grading/grade-writing', data);
    return response.data;
  },

  // Chấm bài Speaking
  gradeSpeaking: async (data) => {
    const response = await apiClient.post('/grading/grade-speaking', data);
    return response.data;
  },

  // Lấy feedback chi tiết
  getFeedback: async (data) => {
    const response = await apiClient.post('/grading/feedback', data);
    return response.data;
  },

  // Chấm hàng loạt
  gradeBatch: async (data) => {
    const response = await apiClient.post('/grading/grade-batch', data);
    return response.data;
  },
};

// Exam Management API
export const examAPI = {
  // List exams
  listExams: async (params = {}) => {
    const response = await apiClient.get('/exams/', { params });
    return response.data;
  },

  // Get exam by ID
  getExam: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}`);
    return response.data;
  },

  // Create exam
  createExam: async (data) => {
    const response = await apiClient.post('/exams/', data);
    return response.data;
  },

  // Update exam
  updateExam: async (examId, data) => {
    const response = await apiClient.put(`/exams/${examId}`, data);
    return response.data;
  },

  // Delete exam
  deleteExam: async (examId) => {
    const response = await apiClient.delete(`/exams/${examId}`);
    return response.data;
  },

  // Get exam tests
  getExamTests: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/tests`);
    return response.data;
  },
};

// Questions Management API
export const questionAPI = {
  // List questions
  listQuestions: async (params = {}) => {
    const response = await apiClient.get('/questions/', { params });
    return response.data;
  },

  // Get question by ID
  getQuestion: async (questionId) => {
    const response = await apiClient.get(`/questions/${questionId}`);
    return response.data;
  },

  // Create question
  createQuestion: async (data) => {
    const response = await apiClient.post('/questions/', data);
    return response.data;
  },

  // Update question
  updateQuestion: async (questionId, data) => {
    const response = await apiClient.put(`/questions/${questionId}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (questionId) => {
    const response = await apiClient.delete(`/questions/${questionId}`);
    return response.data;
  },
};

export default apiClient;
