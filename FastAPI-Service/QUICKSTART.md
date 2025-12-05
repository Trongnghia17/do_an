# FastAPI AI Service - Quick Start Guide

## Hướng dẫn cài đặt và chạy nhanh

### 1. Cài đặt môi trường

```bash
# Di chuyển vào thư mục FastAPI-Service
cd FastAPI-Service

# Cài đặt Poetry (nếu chưa có)
curl -sSL https://install.python-poetry.org | python3 -

# Cài đặt dependencies
poetry install
```

### 2. Cấu hình

```bash
# Copy file environment
cp .env.example .env

# Chỉnh sửa .env và thêm:
# - OPENAI_API_KEY: API key từ OpenAI
# - MONGODB_URL: MongoDB connection string
# - Các cấu hình khác nếu cần
```

### 3. Chạy service

**Option 1: Chạy local (development)**
```bash
poetry run python run.py
```

**Option 2: Sử dụng Docker Compose**
```bash
docker-compose up -d
```

Service sẽ chạy tại: http://localhost:8000

### 4. Test API

Truy cập Swagger UI để test: http://localhost:8000/docs

### 5. Tích hợp với Laravel

Thêm vào `config/services.php`:
```php
'fastapi' => [
    'url' => env('FASTAPI_URL', 'http://localhost:8000'),
    'api_key' => env('FASTAPI_API_KEY', ''),
],
```

Trong `.env` của Laravel:
```
FASTAPI_URL=http://localhost:8000
```

### 6. Tích hợp với React

Trong `.env` của React:
```
VITE_FASTAPI_URL=http://localhost:8000
```

## API Examples

### Sinh câu hỏi
```bash
curl -X POST "http://localhost:8000/api/v1/generation/generate-questions" \
  -H "Content-Type: application/json" \
  -d '{
    "exam_type": "IELTS",
    "skill": "Reading",
    "topic": "Technology",
    "difficulty": "medium",
    "num_questions": 5
  }'
```

### Chấm Writing
```bash
curl -X POST "http://localhost:8000/api/v1/grading/grade-writing" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q123",
    "question_text": "Write about environmental protection",
    "answer": "Environmental protection is important...",
    "exam_type": "IELTS"
  }'
```

## Troubleshooting

### Import errors
- Errors về import là do chưa cài đặt packages. Chạy: `poetry install`

### MongoDB connection error
- Kiểm tra MongoDB đang chạy: `sudo systemctl status mongodb`
- Hoặc chạy MongoDB bằng Docker: `docker run -d -p 27017:27017 mongo:7`

### OpenAI API errors
- Kiểm tra API key trong `.env`
- Kiểm tra credit balance trong OpenAI account

## Next Steps

1. Customize prompts trong `chatgpt_service.py` để phù hợp với requirements
2. Thêm authentication/authorization nếu cần
3. Setup monitoring và logging
4. Deploy lên production server
