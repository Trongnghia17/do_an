# 🔧 Hướng dẫn hoàn thiện chức năng Lịch sử làm bài

## ✅ Những gì đã làm

### Backend (FastAPI)
1. ✅ Tạo migration file để tạo 2 bảng mới
2. ✅ Thêm models: `ExamSubmission`, `UserExamAnswer`
3. ✅ Tạo API endpoints:
   - POST `/api/v1/submissions/submit` - Nộp bài
   - GET `/api/v1/submissions/my-submissions` - Lấy lịch sử
   - GET `/api/v1/submissions/submissions/{id}` - Chi tiết bài làm

### Frontend (React)
1. ✅ Thêm `submissionAPI` vào service
2. ✅ Cập nhật 4 test components (Reading, Listening, Writing, Speaking)
3. ✅ Cập nhật `ExamHistory.jsx` để hiển thị dữ liệu thực

---

## 🚀 Cách chạy Migration

### Cách 1: SQL Script thủ công (KHUYẾN NGHỊ - Nhanh nhất)

```bash
# Mở MySQL client
mysql -u your_username -p your_database_name

# Chạy script SQL
source /home/dell/Đồ\ án\ 2/FastAPI-Service/create_submissions_tables.sql

# Hoặc copy paste nội dung file vào MySQL
```

### Cách 2: Sử dụng Alembic CLI

```bash
cd "/home/dell/Đồ án 2/FastAPI-Service"

# Nếu chưa có alembic, cài đặt:
pip install alembic pymysql sqlalchemy

# Chạy migration
alembic upgrade head

# Kiểm tra
alembic current
```

### Cách 3: Import SQL bằng phpMyAdmin/MySQL Workbench
1. Mở phpMyAdmin hoặc MySQL Workbench
2. Chọn database của bạn
3. Import file: `/home/dell/Đồ án 2/FastAPI-Service/create_submissions_tables.sql`

---

## 📊 Kiểm tra Migration đã chạy thành công

Chạy các lệnh SQL sau:

```sql
-- Kiểm tra bảng đã tạo
SHOW TABLES LIKE '%submission%';
SHOW TABLES LIKE '%answer%';

-- Xem cấu trúc bảng
DESCRIBE exam_submissions;
DESCRIBE user_exam_answers;

-- Đếm số bản ghi (ban đầu = 0)
SELECT COUNT(*) FROM exam_submissions;
SELECT COUNT(*) FROM user_exam_answers;
```

Kết quả mong đợi:
```
exam_submissions     ✓
user_exam_answers    ✓
```

---

## 🧪 Test chức năng

### 1. Test Submit bài thi

1. Chạy FastAPI server:
```bash
cd "/home/dell/Đồ án 2/FastAPI-Service"
python run.py
# hoặc
uvicorn app.main:app --reload
```

2. Chạy React app:
```bash
cd "/home/dell/Đồ án 2/React"
npm run dev
```

3. Đăng nhập vào hệ thống
4. Làm một bài thi (Reading/Listening/Writing/Speaking)
5. Click "Nộp bài"
6. Kiểm tra:
   - Có thông báo "Nộp bài thành công!"
   - Chuyển đến trang kết quả
   - Kiểm tra database có dữ liệu

### 2. Test Lịch sử làm bài

1. Vào trang Profile > Lịch sử làm bài
2. Kiểm tra:
   - Hiển thị danh sách bài đã làm
   - Lọc theo tab (Listening/Speaking/Reading/Writing)
   - Click vào đề thi để xem chi tiết
   - Hiển thị đúng điểm số, thời gian

### 3. Kiểm tra Database

```sql
-- Xem dữ liệu submissions
SELECT 
    s.id,
    u.email as user_email,
    sk.name as skill_name,
    s.status,
    s.total_score,
    s.max_score,
    s.time_spent,
    s.submitted_at
FROM exam_submissions s
JOIN users u ON s.user_id = u.id
JOIN exam_skills sk ON s.exam_skill_id = sk.id
ORDER BY s.created_at DESC
LIMIT 10;

-- Xem câu trả lời
SELECT 
    a.id,
    s.id as submission_id,
    q.question_text,
    a.answer_text,
    a.is_correct,
    a.score
FROM user_exam_answers a
JOIN exam_submissions s ON a.submission_id = s.id
JOIN exam_questions q ON a.question_id = q.id
ORDER BY a.created_at DESC
LIMIT 20;
```

---

## 🔍 Troubleshooting

### Lỗi: "exam_submissions table doesn't exist"
→ **Giải pháp**: Chạy lại SQL script trong `create_submissions_tables.sql`

### Lỗi: "Foreign key constraint fails"
→ **Kiểm tra**: Các bảng `users`, `exam_skills`, `exam_sections`, `exam_questions` đã tồn tại chưa
→ **Giải pháp**: Chạy migration cũ trước

### Không hiển thị dữ liệu trong Lịch sử làm bài
→ **Kiểm tra**: 
1. Backend có chạy không?
2. API có trả về dữ liệu không? (Xem Console/Network tab)
3. Database có dữ liệu không?

### Lỗi CORS
→ **Kiểm tra**: File `.env` có cấu hình đúng `CORS_ORIGINS` không
→ **Thêm vào** `app/main.py` nếu cần:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 API Endpoints

### Submit bài thi
```bash
POST /api/v1/submissions/submit
Authorization: Bearer <token>

Body:
{
  "exam_skill_id": 1,
  "exam_section_id": 2,  // optional
  "answers": [
    {
      "question_id": 1,
      "answer_text": "A"
    },
    {
      "question_id": 2,
      "answer_text": "London"
    }
  ],
  "time_spent": 1800  // seconds
}
```

### Lấy lịch sử
```bash
GET /api/v1/submissions/my-submissions
Authorization: Bearer <token>

# Với filter (optional)
GET /api/v1/submissions/my-submissions?status_filter=completed
GET /api/v1/submissions/my-submissions?exam_skill_id=1
```

### Chi tiết bài làm
```bash
GET /api/v1/submissions/submissions/{submission_id}
Authorization: Bearer <token>
```

---

## 📚 File quan trọng đã tạo/sửa

### Backend
- ✅ `/alembic/versions/f1a2b3c4d5e6_create_user_exam_submissions_tables.py`
- ✅ `/app/models/exam_models.py` (thêm models)
- ✅ `/app/api/v1/endpoints/submissions.py` (mới)
- ✅ `/app/api/v1/__init__.py` (đăng ký router)
- ✅ `/alembic/env.py` (import models)
- ✅ `/create_submissions_tables.sql` (SQL script thủ công)
- ✅ `/MIGRATION_GUIDE.md` (hướng dẫn migration)

### Frontend
- ✅ `/src/services/fastapi.service.js` (thêm submissionAPI)
- ✅ `/src/features/user/exams/pages/ReadingTest.jsx`
- ✅ `/src/features/user/exams/pages/ListeningTest.jsx`
- ✅ `/src/features/user/exams/pages/WritingTest.jsx`
- ✅ `/src/features/user/exams/pages/SpeakingTest.jsx`
- ✅ `/src/features/user/exams/components/TestLayout.jsx`
- ✅ `/src/features/user/profile/ExamHistory.jsx`

---

## ✨ Tính năng hoàn thiện

- ✅ Lưu toàn bộ câu trả lời của học sinh
- ✅ Tự động chấm điểm câu trắc nghiệm
- ✅ Lưu thời gian làm bài
- ✅ Hiển thị lịch sử làm bài theo skill
- ✅ Xem chi tiết từng bài đã làm
- ✅ Tính tỷ lệ đúng/sai
- ✅ Support cả text và audio answers

---

Chúc bạn thành công! 🎉
