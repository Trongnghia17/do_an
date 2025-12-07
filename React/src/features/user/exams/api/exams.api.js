import api from '@/lib/axios';

// Lấy danh sách exams
export const getExams = (params) => 
  api.get('/exams/', { params });
// lấy ra chi tiết bộ đề (sử dụng endpoint exam by id)
export const getExamsDetail = (id) => 
  api.get(`/exams/${id}/`);
// Lấy chi tiết exam
export const getExamById = (id, params) => 
  api.get(`/exams/${id}/`, { params });

// Lấy chi tiết test (cần exam_id)
export const getTestById = (examId, testId, params) => 
  api.get(`/exams/${examId}/tests/${testId}/`, { params });

// Lấy danh sách skills
export const getSkills = (params) => 
  api.get('/skills/', { params });

// Lấy chi tiết skill
export const getSkillById = (id, params) => 
  api.get(`/skills/${id}/`, { params });

// Lấy chi tiết section (có 2 cách: /sections/{id} hoặc /skills/{skill_id}/sections)
export const getSectionById = (id, params) => 
  api.get(`/sections/${id}/`, { params });

// Lấy question group và questions
export const getQuestionGroup = (id, params) => 
  api.get(`/groups/${id}/`, { params });

export const getQuestionsByGroup = (groupId, params) => 
  api.get(`/groups/${groupId}/questions/`, { params });
