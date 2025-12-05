/**
 * Admin Service - CHỈ DÙNG FASTAPI
 * Tất cả endpoints kết nối với FastAPI Backend (Python)
 */
import fastapiService from '@/services/fastapi.service';

const adminService = {
  // ========== Dashboard ==========
  getDashboardStats: async () => {
    const response = await fastapiService.user.getUserStats();
    return response.data;
  },

  // ========== User Management ==========
  getUsers: async (params) => {
    const response = await fastapiService.user.listUsers(params);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await fastapiService.user.getUser(id);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await fastapiService.auth.register(userData);
    return response.data;
  },

  // ========== Exam Management ==========
  getExams: async (params) => {
    const response = await fastapiService.exam.listExams(params);
    return response.data;
  },

  getExamById: async (id) => {
    const response = await fastapiService.exam.getExam(id);
    return response.data;
  },

  createExam: async (examData) => {
    const response = await fastapiService.exam.createExam(examData);
    return response.data;
  },

  updateExam: async (id, examData) => {
    const response = await fastapiService.exam.updateExam(id, examData);
    return response.data;
  },

  deleteExam: async (id) => {
    const response = await fastapiService.exam.deleteExam(id);
    return response.data;
  },

  getTestsByExamId: async (examId) => {
    const response = await fastapiService.exam.getExamTests(examId);
    return response.data;
  },

  // ========== Question Management ==========
  getQuestions: async (params) => {
    const response = await fastapiService.question.listQuestions(params);
    return response.data;
  },

  getQuestionById: async (id) => {
    const response = await fastapiService.question.getQuestion(id);
    return response.data;
  },

  createQuestion: async (questionData) => {
    const response = await fastapiService.question.createQuestion(questionData);
    return response.data;
  },

  updateQuestion: async (id, questionData) => {
    const response = await fastapiService.question.updateQuestion(id, questionData);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await fastapiService.question.deleteQuestion(id);
    return response.data;
  },

  // ========== AI Generation ==========
  generateQuestions: async (data) => {
    const response = await fastapiService.aiGeneration.generateQuestions(data);
    return response.data;
  },

  generateContent: async (data) => {
    const response = await fastapiService.aiGeneration.generateContent(data);
    return response.data;
  },

  generateExam: async (data) => {
    const response = await fastapiService.aiGeneration.generateExam(data);
    return response.data;
  },

  // ========== AI Grading ==========
  gradeWriting: async (data) => {
    const response = await fastapiService.aiGrading.gradeWriting(data);
    return response.data;
  },

  gradeSpeaking: async (data) => {
    const response = await fastapiService.aiGrading.gradeSpeaking(data);
    return response.data;
  },

  getFeedback: async (data) => {
    const response = await fastapiService.aiGrading.getFeedback(data);
    return response.data;
  },

  gradeBatch: async (data) => {
    const response = await fastapiService.aiGrading.gradeBatch(data);
    return response.data;
  },
};

export default adminService;
