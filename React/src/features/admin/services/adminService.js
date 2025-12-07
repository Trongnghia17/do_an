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

  updateUser: async (id, userData) => {
    const response = await fastapiService.user.updateUser(id, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await fastapiService.user.deleteUser(id);
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

  createTest: async (examId, testData) => {
    const response = await fastapiService.exam.createExamTest(examId, testData);
    return response.data;
  },

  updateTest: async (examId, testId, testData) => {
    const response = await fastapiService.exam.updateExamTest(examId, testId, testData);
    return response.data;
  },

  deleteTest: async (examId, testId) => {
    const response = await fastapiService.exam.deleteExamTest(examId, testId);
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

  // ========== Skills Management ==========
  getAllSkills: async (params) => {
    const response = await fastapiService.skill.listSkills(params);
    return response.data;
  },

  getSkillById: async (id) => {
    const response = await fastapiService.skill.getSkill(id);
    return response.data;
  },

  createSkill: async (skillData) => {
    const response = await fastapiService.skill.createSkill(skillData);
    return response.data;
  },

  updateSkill: async (id, skillData) => {
    const response = await fastapiService.skill.updateSkill(id, skillData);
    return response.data;
  },

  deleteSkill: async (id) => {
    const response = await fastapiService.skill.deleteSkill(id);
    return response.data;
  },

  // ========== Sections Management ==========
  getSectionsBySkillId: async (skillId) => {
    const response = await fastapiService.section.listSections(skillId);
    return response.data;
  },

  getSectionById: async (sectionId) => {
    const response = await fastapiService.section.getSection(sectionId);
    return response.data;
  },

  createSection: async (skillId, sectionData) => {
    const response = await fastapiService.section.createSection(skillId, sectionData);
    return response.data;
  },

  updateSection: async (sectionId, sectionData) => {
    const response = await fastapiService.section.updateSection(sectionId, sectionData);
    return response.data;
  },

  deleteSection: async (sectionId) => {
    const response = await fastapiService.section.deleteSection(sectionId);
    return response.data;
  },

  // ========== Question Groups Management ==========
  getGroupsBySectionId: async (sectionId) => {
    const response = await fastapiService.group.listGroupsBySection(sectionId);
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await fastapiService.group.getGroup(groupId);
    return response.data;
  },

  getQuestionsByGroupId: async (groupId) => {
    const response = await fastapiService.group.getQuestionsByGroup(groupId);
    return response.data;
  },

  createGroup: async (sectionId, groupData) => {
    const response = await fastapiService.group.createGroup(sectionId, groupData);
    return response.data;
  },

  updateGroup: async (groupId, groupData) => {
    const response = await fastapiService.group.updateGroup(groupId, groupData);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await fastapiService.group.deleteGroup(groupId);
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

  // ========== File Upload ==========
  uploadImage: async (file) => {
    const response = await fastapiService.upload.uploadImage(file);
    return response.data;
  },

  deleteImage: async (filename) => {
    const response = await fastapiService.upload.deleteImage(filename);
    return response.data;
  },

  uploadAudio: async (file) => {
    const response = await fastapiService.upload.uploadAudio(file);
    return response.data;
  },

  deleteAudio: async (filename) => {
    const response = await fastapiService.upload.deleteAudio(filename);
    return response.data;
  },
};

export default adminService;
