# OwlEnglish AI Service

AI-powered exam generation and grading service built with FastAPI, MySQL, and ChatGPT API.

## 🚀 Tính năng chính

### 1. Sinh đề thi tự động (AI Generation)
- Tạo câu hỏi theo loại đề thi (IELTS, TOEIC, etc.)
- Hỗ trợ tất cả kỹ năng: Listening, Reading, Writing, Speaking
- Tùy chỉnh độ khó và số lượng câu hỏi
- Sinh nội dung đoạn văn, hội thoại cho Listening/Reading

### 2. Chấm điểm tự động (AI Grading)
- Chấm Writing với feedback chi tiết theo tiêu chí chuẩn
- Chấm Speaking từ transcript
- Cung cấp điểm số và gợi ý cải thiện
- Hỗ trợ chấm hàng loạt

### 3. Quản lý đề thi
- CRUD operations cho Exams, Questions, Sections
- Cấu trúc dữ liệu tương tự Laravel models
- Soft delete support
- MySQL với SQLAlchemy ORM

## 🏗️ Cấu trúc dự án

```
FastAPI-Service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # MySQL async connection
│   ├── models/                 # SQLAlchemy models
│   │   ├── base.py
│   │   ├── exam_models.py
│   │   ├── auth_models.py
│   │   └── user.py
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── exams.py        # Exam CRUD
│   │           ├── questions.py    # Question CRUD
│   │           ├── generation.py   # AI generation endpoints
│   │           └── grading.py      # AI grading endpoints
│   └── services/
│       └── chatgpt_service.py  # ChatGPT integration
├── pyproject.toml              # Poetry dependencies
├── .env.example
├── .gitignore
├── run.py                      # Run script
└── README.md
```

## 📦 Installation

### Prerequisites
- Python 3.10+
- Poetry
- MySQL 8.0+
- Redis (optional, for caching)
- OpenAI API Key

### Setup

1. **Clone repository và di chuyển vào thư mục:**
```bash
cd FastAPI-Service
```

2. **Install Poetry (nếu chưa có):**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

3. **Install dependencies:**
```bash
poetry install
```

4. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env và thêm các keys cần thiết
```

5. **Cấu hình MySQL:**
- Install MySQL 8.0+ hoặc MariaDB
- Tạo database: `CREATE DATABASE owlenglish_fastapi;`
- Update các settings `DB_*` trong `.env`

6. **Thêm OpenAI API Key:**
```bash
# Trong file .env
OPENAI_API_KEY=sk-your-api-key-here
```

## 🚀 Chạy service

### Development mode:
```bash
poetry run python run.py
```

Hoặc:
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode:
```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Service sẽ chạy tại: `http://localhost:8000`

## 📚 API Documentation

Sau khi chạy service, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

#### 1. AI Generation

**Sinh câu hỏi:**
```bash
POST /api/v1/generation/generate-questions
```

Request body:
```json
{
  "exam_type": "IELTS",
  "skill": "Reading",
  "topic": "Environment",
  "difficulty": "medium",
  "num_questions": 5,
  "question_types": ["multiple_choice", "fill_blank"]
}
```

**Sinh nội dung (passage, dialogue):**
```bash
POST /api/v1/generation/generate-content
```

**Sinh toàn bộ đề thi:**
```bash
POST /api/v1/generation/generate-exam
```

#### 2. AI Grading

**Chấm Writing:**
```bash
POST /api/v1/grading/grade-writing
```

Request body:
```json
{
  "question_id": "question_123",
  "question_text": "Write an essay about environmental protection...",
  "answer": "Student's essay content here...",
  "exam_type": "IELTS",
  "user_id": "user_123"
}
```

**Chấm Speaking:**
```bash
POST /api/v1/grading/grade-speaking
```

**Feedback chi tiết:**
```bash
POST /api/v1/grading/feedback
```

#### 3. Exam Management

**List exams:**
```bash
GET /api/v1/exams/
GET /api/v1/exams/?type=IELTS&is_active=true
```

**Get exam:**
```bash
GET /api/v1/exams/{exam_id}
```

**Create exam:**
```bash
POST /api/v1/exams/
```

**Update exam:**
```bash
PUT /api/v1/exams/{exam_id}
```

**Delete exam:**
```bash
DELETE /api/v1/exams/{exam_id}
```

#### 4. Questions Management

**List questions:**
```bash
GET /api/v1/questions/
GET /api/v1/questions/?section_id=section_123
```

**Create question:**
```bash
POST /api/v1/questions/
```

## 🔗 Tích hợp với Laravel & React

### Tích hợp với Laravel Backend

Laravel có thể gọi FastAPI service để:
1. Sinh đề thi mới
2. Chấm điểm Writing/Speaking
3. Lấy feedback cho học sinh

Example Laravel service:

```php
// app/Services/AIService.php
class AIService
{
    protected $fastApiUrl;
    
    public function __construct()
    {
        $this->fastApiUrl = config('services.fastapi.url');
    }
    
    public function generateQuestions($data)
    {
        $response = Http::post("{$this->fastApiUrl}/api/v1/generation/generate-questions", $data);
        return $response->json();
    }
    
    public function gradeWriting($questionId, $answer)
    {
        $response = Http::post("{$this->fastApiUrl}/api/v1/grading/grade-writing", [
            'question_id' => $questionId,
            'answer' => $answer,
            'exam_type' => 'IELTS',
        ]);
        return $response->json();
    }
}
```

### Tích hợp với React Frontend

React có thể:
1. Gọi trực tiếp FastAPI để get real-time grading
2. Display AI feedback cho user
3. Show AI-generated questions

Example React hook:

```javascript
// src/hooks/useAIGrading.js
import { useState } from 'react';
import axios from 'axios';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL;

export const useAIGrading = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const gradeWriting = async (questionId, questionText, answer) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${FASTAPI_URL}/api/v1/grading/grade-writing`,
        {
          question_id: questionId,
          question_text: questionText,
          answer: answer,
          exam_type: 'IELTS',
        }
      );
      setResult(response.data);
      return response.data;
    } catch (error) {
      console.error('Grading error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return { gradeWriting, loading, result };
};
```

Component sử dụng:

```javascript
// Component example
import { useAIGrading } from '@/hooks/useAIGrading';

function WritingGrading({ questionId, questionText }) {
  const [answer, setAnswer] = useState('');
  const { gradeWriting, loading, result } = useAIGrading();
  
  const handleSubmit = async () => {
    const gradingResult = await gradeWriting(questionId, questionText, answer);
    // Display result
  };
  
  return (
    <div>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Grading...' : 'Submit for AI Grading'}
      </button>
      
      {result && (
        <div className="grading-result">
          <h3>Score: {result.overall_score}/9</h3>
          <p>{result.detailed_feedback}</p>
          <div>
            <h4>Strengths:</h4>
            <ul>
              {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4>Areas for improvement:</h4>
            <ul>
              {result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Application
APP_NAME=OwlEnglish AI Service
APP_ENV=development
DEBUG=True
PORT=8000

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=owlenglish_fastapi
DB_USERNAME=root
DB_PASSWORD=your_password

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# JWT Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (React URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Laravel Integration
LARAVEL_API_URL=http://localhost:8001/api
LARAVEL_API_KEY=your-laravel-api-key
```

## 🧪 Testing

```bash
# Run tests
poetry run pytest

# With coverage
poetry run pytest --cov=app
```

## 📊 MySQL Database Schema

Service sử dụng các bảng:

- `exams` - Danh sách đề thi
- `exam_tests` - Tests trong exam
- `exam_skills` - Skills (Listening, Reading, etc.)
- `users` - Người dùng
- `roles` - Vai trò
- `login_activities` - Lịch sử đăng nhập
- `exam_sections` - Sections trong skill
- `exam_question_groups` - Nhóm câu hỏi
- `exam_questions` - Câu hỏi cụ thể
- `user_exam_answers` - Câu trả lời của học sinh
- `exam_submissions` - Bài nộp hoàn chỉnh

## 🚀 Deployment

### Using Docker

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t owlenglish-ai-service .
docker run -p 8000:8000 --env-file .env owlenglish-ai-service
```

### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  fastapi:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_DATABASE=owlenglish_fastapi
      - DB_USERNAME=root
      - DB_PASSWORD=password
    depends_on:
      - mysql
    
  mysql:
    image: mysql:8.0
    ports:
      - "3307:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=owlenglish_fastapi
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## 📝 Notes

- Service này thay thế hoàn toàn Laravel backend
- Sử dụng MySQL với SQLAlchemy ORM
- ChatGPT API costs - cần monitor usage
- Có thể extend với Celery cho background tasks
- React frontend có thể tái sử dụng components hiện có
- Database migrations được quản lý bằng Alembic

## 🤝 Contributing

Contributions are welcome! Please follow the code style and add tests for new features.

## 📄 License

MIT License
