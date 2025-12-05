# React Frontend - CHỈ DÙNG FASTAPI

## ✅ Đã Loại Bỏ Hoàn Toàn Laravel

Frontend này **chỉ kết nối với FastAPI Backend** (Python). Không còn sử dụng Laravel (PHP) nữa.

---

## 🔧 Cấu Hình

### File `.env`

```env
# FastAPI Backend URL - CHỈ CẦN DUY NHẤT CÁI NÀY
VITE_FASTAPI_URL=http://127.0.0.1:8000
```

---

## 📁 Files Quan Trọng

1. **`src/lib/axios.js`** - Base axios → FastAPI
2. **`src/services/fastapi.service.js`** - Tất cả API functions
3. **`src/features/admin/services/adminService.js`** - Admin wrapper
4. **`src/features/auth/api/auth.api.js`** - Auth functions

---

## 🚀 27 Endpoints Có Sẵn

### Authentication (8)
- POST /auth/register
- POST /auth/login/json
- POST /auth/logout
- GET /auth/me
- POST /auth/refresh-token
- POST /auth/password/change
- GET /auth/login-history

### Exams (4)
- GET /exams
- GET /exams/{id}
- POST /exams
- PUT /exams/{id}
- DELETE /exams/{id}
- GET /exams/{id}/tests

### Users (3)
- GET /users
- GET /users/{id}
- GET /users/stats/summary

### Questions (5)
- GET /questions
- GET /questions/{id}
- POST /questions
- PUT /questions/{id}
- DELETE /questions/{id}

### AI Generation (3)
- POST /generation/generate-questions
- POST /generation/generate-content
- POST /generation/generate-exam

### AI Grading (4)
- POST /grading/grade-writing
- POST /grading/grade-speaking
- POST /grading/feedback
- POST /grading/grade-batch

---

## 💻 Sử Dụng

```javascript
import fastapiService from '@/services/fastapi.service';

// Login
const response = await fastapiService.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// List exams
const exams = await fastapiService.exam.listExams();

// Create exam
const newExam = await fastapiService.exam.createExam({
  name: 'IELTS Test',
  type: 'ielts',
  is_active: true
});

// AI Generate
const questions = await fastapiService.aiGeneration.generateQuestions({
  exam_type: 'IELTS',
  skill: 'Reading',
  topic: 'Climate',
  difficulty: 'medium',
  num_questions: 5
});
```

---

## ✅ Summary

- ❌ **Laravel**: REMOVED
- ✅ **FastAPI**: ONLY Backend
- ✅ **27 endpoints** ready
- ✅ **JWT auth** integrated
- ✅ **AI features** working

**React → FastAPI → MySQL**
