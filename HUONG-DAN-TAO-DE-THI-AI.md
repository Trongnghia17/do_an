# 📚 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG TẠO ĐỀ THI AI

## 🎯 Tổng quan

Hệ thống cho phép tạo đề thi IELTS/TOEIC tự động bằng AI với format chuẩn, bao gồm:
- **Reading**: Passage + Question Groups (True/False/Not Given, Short Answer, Multiple Choice, etc.)
- **Listening**: Audio Script + Form Completion, Multiple Choice
- **Writing**: Essay, Chart Description
- **Speaking**: Interview, Cue Card, Discussion

---

## 🚀 Cách sử dụng trên giao diện

### Bước 1: Chọn thông tin cơ bản
1. Chọn **Bộ đề** (Exam): IELTS, TOEIC, v.v.
2. Chọn **ExamTest**: Test 1, Test 2, v.v.
3. Chọn **Skill**: Reading, Writing, Listening, Speaking
4. Nhập **Thời gian làm bài**: 60 phút

### Bước 2: Thêm Section
1. Nhập **Tên section**: "Reading Passage 1"
2. Nhập **Topic**: "Technology", "Environment", v.v.
3. Chọn **Difficulty**: Easy, Medium, Hard
4. Nhập **Số câu hỏi**: 13
5. Chọn **Loại câu hỏi** (tùy chọn):
   - **Reading**: Multiple Choice, Short Answer, True/False/Not Given, Yes/No/Not Given, Summary Completion, Matching
   - **Listening**: Form Completion, Note Completion, Multiple Choice, Matching
   - **Writing**: Essay, Chart Description, Letter, Report
   - **Speaking**: Cue Card, Interview, Discussion

### Bước 3: Generate câu hỏi
1. Nhấn nút **Generate** cho mỗi section
2. Hệ thống sẽ gọi AI để sinh:
   - **Passage** (với Reading/Listening)
   - **Question Groups** (nhóm câu hỏi theo loại)
   - **Questions** (từng câu hỏi với đáp án + giải thích)
3. Nhấn **Preview** để xem trước

### Bước 4: Tạo đề thi
1. Review lại tất cả sections
2. Nhấn **Tạo đề thi**
3. Hệ thống lưu vào database

---

## 📊 Cấu trúc dữ liệu

### Format Response từ AI (Reading)

```json
{
  "status": "success",
  "message": "Generated 13 questions with passage",
  "data": {
    "passage": {
      "title": "William Henry Perkin",
      "introduction": "You should spend about 20 minutes on Questions 1-13...",
      "content": "Full passage text (700-900 words)...",
      "topic": "chemistry",
      "word_count": 700
    },
    "question_groups": [
      {
        "group_name": "Questions 1-7",
        "question_type": "true_false_not_given",
        "instruction": "Do the following statements agree with...",
        "questions": [
          {
            "question_number": 1,
            "content": "Statement to verify...",
            "correct_answer": "TRUE",
            "explanation": "Explanation...",
            "points": 1.0
          }
        ]
      },
      {
        "group_name": "Questions 8-13",
        "question_type": "short_answer",
        "instruction": "Choose NO MORE THAN TWO WORDS...",
        "questions": [...]
      }
    ]
  }
}
```

### Cấu trúc trong Database

```
ExamSkill (Reading)
  └── ExamSection (Reading Passage 1)
       ├── content: "Passage introduction + title + content"
       └── ExamQuestionGroup 1 (Questions 1-7)
            ├── name: "Questions 1-7"
            ├── question_type: "true_false_not_given"
            ├── content: "Instruction..."
            └── ExamQuestion 1, 2, 3...
       └── ExamQuestionGroup 2 (Questions 8-13)
            ├── name: "Questions 8-13"
            ├── question_type: "short_answer"
            ├── content: "Instruction..."
            └── ExamQuestion 8, 9, 10...
```

---

## 🔧 API Endpoints

### 1. Generate Questions (Preview only)
```bash
POST /api/v1/generation/generate-questions
Content-Type: application/json
Authorization: Bearer {token}

{
  "exam_type": "IELTS",
  "skill": "Reading",
  "topic": "Technology",
  "difficulty": "medium",
  "num_questions": 13,
  "question_types": ["true_false_not_given", "short_answer"]
}
```

### 2. Generate Exam (Save to DB)
```bash
POST /api/v1/generation/generate-exam
Content-Type: application/json
Authorization: Bearer {token}

{
  "exam_id": 1,
  "exam_test_id": 1,
  "skill_type": "reading",
  "skill_name": "Reading",
  "time_limit": 60,
  "sections": [
    {
      "name": "Reading Passage 1",
      "topic": "Technology",
      "difficulty": "medium",
      "num_questions": 13,
      "question_types": ["true_false_not_given", "short_answer"],
      "content": "Passage content...",
      "question_groups": [...]
    }
  ]
}
```

---

## 📝 Loại câu hỏi theo Skill

### Reading
- ✅ Multiple Choice
- ✅ Short Answer (NO MORE THAN TWO WORDS)
- ✅ Yes/No/Not Given
- ✅ True/False/Not Given
- ✅ Summary Completion
- ✅ Matching (Headings, Information, etc.)

### Listening
- ✅ Form Completion
- ✅ Note Completion
- ✅ Multiple Choice
- ✅ Matching
- ✅ Labeling (Maps, Diagrams)

### Writing
- ✅ Essay (Task 2)
- ✅ Chart/Graph Description (Task 1)
- ✅ Letter Writing
- ✅ Report Writing

### Speaking
- ✅ Cue Card (Part 2 - Long Turn)
- ✅ Interview Questions (Part 1)
- ✅ Discussion Questions (Part 3)

---

## 🎨 UI Components

### Preview Modal
- Hiển thị **Passage** đầy đủ
- Hiển thị **Question Groups** với instruction riêng
- Hiển thị **Questions** với đáp án + giải thích
- Highlight đáp án đúng (màu xanh)

### Question Types Badge
- `true_false_not_given` → Tag màu xanh
- `short_answer` → Tag màu vàng
- `multiple_choice` → Tag màu tím
- `essay` → Tag màu đỏ

---

## 🐛 Troubleshooting

### Lỗi: "No pre-generated questions"
→ Hệ thống đang gọi AI để sinh câu hỏi. Nếu OpenAI hết quota, sẽ dùng mock data.

### Lỗi: "Invalid response format"
→ Check log backend để xem response từ ChatGPT có đúng format JSON không.

### Preview không hiển thị passage
→ Check `generatedQuestions[sectionId]` có chứa `passage` và `question_groups` không.

---

## 📦 File tham khảo

- `example-ielts-reading-payload.json` - Ví dụ payload đầy đủ để test
- `AIExamGenerator.jsx` - UI component chính
- `chatgpt_service.py` - Backend AI service
- `generation.py` - API endpoints

---

## ✅ Checklist

- [x] Backend: Prompt sinh đúng format passage + question_groups
- [x] Backend: Parse response thành cấu trúc đúng
- [x] Backend: Lưu vào DB với ExamSection → ExamQuestionGroup → ExamQuestion
- [x] Backend: Mock data fallback khi hết quota
- [x] Frontend: Form với question types động theo skill
- [x] Frontend: Preview modal hiển thị passage + groups
- [x] Frontend: Gửi data đúng format lên backend

---

Chúc bạn tạo đề thi thành công! 🎉
