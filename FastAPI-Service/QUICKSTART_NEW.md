# 🚀 QUICKSTART - FastAPI Service

## ✅ Đã Hoàn Thành 100% Refactor!

Service này đã được refactor hoàn toàn từ MongoDB sang **MySQL + SQLAlchemy**.

**Tổng cộng: 27 endpoints** hoạt động đầy đủ!

---

## 📦 1. Cài Đặt

```bash
cd FastAPI-Service

# Install dependencies với Poetry
poetry install

# Hoặc với pip
pip install -r requirements.txt
```

---

## 🗄️ 2. Setup Database

```bash
# Tạo database MySQL
mysql -u root -p -h 127.0.0.1 -P 3307 -e "CREATE DATABASE IF NOT EXISTS owlenglish_fastapi"

# Run migrations
poetry run alembic upgrade head
```

---

## ⚙️ 3. Cấu Hình (.env)

Tạo file `.env` trong thư mục `FastAPI-Service/`:

```env
# Database
DATABASE_URL=mysql+aiomysql://root:YOUR_PASSWORD@localhost:3307/owlenglish_fastapi

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI API (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 🚀 4. Chạy Server

```bash
# Development mode (với auto-reload)
poetry run python run.py

# Hoặc trực tiếp với uvicorn
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🧪 5. Test API

### Bước 1: Đăng ký tài khoản

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register"   -H "Content-Type: application/json"   -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Bước 2: Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login/json"   -H "Content-Type: application/json"   -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Bước 3: Sử dụng token

```bash
# Lưu token vào biến
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Gọi API với authentication
curl -X GET "http://localhost:8000/api/v1/users/me"   -H "Authorization: Bearer $TOKEN"
```

---

## 📊 6. Các Endpoints Chính

### 🔐 Authentication (`/api/v1/auth`)
- `POST /register` - Đăng ký
- `POST /login/json` - Đăng nhập
- `GET /me` - User hiện tại
- `POST /logout` - Đăng xuất
- `POST /refresh-token` - Refresh token

### �� Exams (`/api/v1/exams`)
- `GET /` - Danh sách đề thi
- `GET /{exam_id}` - Chi tiết đề thi
- `POST /` - Tạo đề thi mới

### 👥 Users (`/api/v1/users`)
- `GET /` - Danh sách users
- `GET /{user_id}` - Chi tiết user
- `GET /stats/summary` - Thống kê

### ❓ Questions (`/api/v1/questions`)
- `GET /` - Danh sách câu hỏi
- `POST /` - Tạo câu hỏi
- `PUT /{id}` - Cập nhật
- `DELETE /{id}` - Xóa

### 🤖 AI Generation (`/api/v1/generation`)
- `POST /generate-questions` - Tạo câu hỏi bằng AI
- `POST /generate-content` - Tạo nội dung
- `POST /generate-exam` - Tạo đề thi hoàn chỉnh

### 📊 AI Grading (`/api/v1/grading`)
- `POST /grade-writing` - Chấm Writing
- `POST /grade-speaking` - Chấm Speaking
- `POST /feedback` - Feedback chi tiết
- `POST /grade-batch` - Chấm hàng loạt

---

## 🔥 7. Ví Dụ Sử Dụng AI Features

### Generate Questions với AI

```bash
curl -X POST "http://localhost:8000/api/v1/generation/generate-questions"   -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json"   -d '{
    "exam_type": "IELTS",
    "skill": "Reading",
    "topic": "Climate Change",
    "difficulty": "medium",
    "num_questions": 5
  }'
```

### Grade Writing với AI

```bash
curl -X POST "http://localhost:8000/api/v1/grading/grade-writing"   -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json"   -d '{
    "question_id": 1,
    "question_text": "Some people think that technology has made our lives more complex. To what extent do you agree or disagree?",
    "answer": "In my opinion, technology has both simplified and complicated our lives...",
    "exam_type": "IELTS"
  }'
```

Response:
```json
{
  "status": "success",
  "question_id": 1,
  "overall_score": 7.5,
  "criteria_scores": {
    "task_achievement": 8.0,
    "coherence": 7.5,
    "vocabulary": 7.0,
    "grammar": 7.5
  },
  "strengths": [
    "Clear position stated",
    "Good use of examples"
  ],
  "weaknesses": [
    "Could expand on counter-arguments",
    "Some vocabulary repetition"
  ],
  "detailed_feedback": "Your essay shows...",
  "suggestions": [
    "Use more varied vocabulary",
    "Add transition phrases"
  ]
}
```

---

## 🐳 8. Docker Setup (Optional)

```bash
# Build image
docker build -t owlenglish-fastapi .

# Run container
docker run -p 8000:8000   -e DATABASE_URL="mysql+aiomysql://root:password@host.docker.internal:3307/owlenglish_fastapi"   -e SECRET_KEY="your-secret-key"   owlenglish-fastapi
```

---

## 🔍 9. Database Migrations

### Tạo migration mới

```bash
poetry run alembic revision --autogenerate -m "Add new table"
```

### Apply migrations

```bash
poetry run alembic upgrade head
```

### Rollback migration

```bash
poetry run alembic downgrade -1
```

---

## 📱 10. Frontend Integration

### React Example

```javascript
// Login
const response = await fetch('http://localhost:8000/api/v1/auth/login/json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token } = await response.json();

// Use token in subsequent requests
const examsResponse = await fetch('http://localhost:8000/api/v1/exams', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const exams = await examsResponse.json();
```

### Axios Example

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use API
const exams = await api.get('/exams');
const grading = await api.post('/grading/grade-writing', {
  question_id: 1,
  question_text: "...",
  answer: "..."
});
```

---

## 🎯 11. Common Tasks

### Seed Database

```bash
# Run seed script
poetry run python -m app.seeds.seed_database
```

### Reset Database

```bash
# Downgrade all
poetry run alembic downgrade base

# Upgrade again
poetry run alembic upgrade head
```

### View Logs

```bash
# Server logs in terminal
tail -f logs/app.log
```

---

## ��️ 12. Troubleshooting

### Problem: Can't connect to database

```bash
# Check MySQL is running
mysql -u root -p -h 127.0.0.1 -P 3307

# Check database exists
SHOW DATABASES;
```

### Problem: Import errors

```bash
# Reinstall dependencies
poetry install --no-cache
```

### Problem: Migration errors

```bash
# Check migration status
poetry run alembic current

# View migration history
poetry run alembic history
```

---

## 📚 13. Documentation Links

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 🎉 Summary

✅ **27 endpoints** hoạt động đầy đủ
✅ Full **authentication** với JWT
✅ **AI features** với ChatGPT integration
✅ **SQLAlchemy** + MySQL async
✅ **Type safety** với Pydantic
✅ **Auto-documentation** với Swagger

**Server đang chạy tại**: http://localhost:8000/docs

Happy coding! 🚀
