# Prompts Structure Refactoring

## Tổ chức lại cấu trúc prompts cho ChatGPT Service

### 📁 Cấu trúc mới

```
app/services/prompts/
├── __init__.py                          # Export prompt_loader
├── prompt_loader.py                      # Central prompt manager
├── generation/                           # Question generation prompts
│   ├── __init__.py
│   ├── ielts_reading.py                 # IELTS Reading prompts
│   ├── ielts_listening.py               # IELTS Listening prompts
│   ├── ielts_writing.py                 # IELTS Writing prompts
│   └── ielts_speaking.py                # IELTS Speaking prompts
├── grading/                              # Grading prompts
│   ├── __init__.py
│   ├── ielts_writing_grading.py         # IELTS Writing grading
│   └── ielts_speaking_grading.py        # IELTS Speaking grading
└── templates/                            # Reusable templates (future)
    └── __init__.py
```

### 🎯 Lợi ích

1. **Dễ bảo trì**: Mỗi prompt được tách riêng thành function
2. **Dễ mở rộng**: Thêm exam types và skills mới dễ dàng
3. **Tái sử dụng**: Các component có thể được sử dụng lại
4. **Dễ cải tiến**: Chỉnh sửa từng phần mà không ảnh hưởng các phần khác
5. **Dễ đọc**: Code gọn gàng, có tổ chức khoa học

### 📝 Cách sử dụng

#### 1. Import prompt loader

```python
from app.services.prompts import prompt_loader
```

#### 2. Get system prompt

```python
# Get system prompt for question generation
system_prompt = prompt_loader.get_system_prompt(
    prompt_type="generation",
    exam_type="IELTS",
    skill="reading"
)

# Get system prompt for grading
system_prompt = prompt_loader.get_system_prompt(
    prompt_type="grading",
    exam_type="IELTS",
    skill="writing"
)
```

#### 3. Get generation prompt

```python
# Generate IELTS Reading questions
prompt = prompt_loader.get_generation_prompt(
    exam_type="IELTS",
    skill="reading",
    topic="Climate Change",
    difficulty="medium",
    num_questions=40,
    question_types=["multiple_choice", "true_false_not_given"]
)

# Generate IELTS Listening questions
prompt = prompt_loader.get_generation_prompt(
    exam_type="IELTS",
    skill="listening",
    topic="University Life",
    difficulty="hard",
    num_questions=40,
    question_types=["multiple_choice", "short_text"],
    part_number=1  # Generate specific part
)
```

#### 4. Get grading prompt

```python
# Grade IELTS Writing
prompt = prompt_loader.get_grading_prompt(
    exam_type="IELTS",
    skill="writing",
    question="Describe the chart...",
    answer="Student's essay..."
)

# Grade IELTS Speaking
prompt = prompt_loader.get_grading_prompt(
    exam_type="IELTS",
    skill="speaking",
    question="Talk about your hometown",
    answer="Student's transcript..."
)
```

#### 5. Get feedback prompt

```python
prompt = prompt_loader.get_feedback_prompt(
    question="What is the capital of France?",
    user_answer="London",
    correct_answer="Paris",
    skill="reading"
)
```

### 🔧 Thêm exam type mới

#### Bước 1: Tạo file prompts mới

```python
# app/services/prompts/generation/toeic_reading.py

def get_reading_system_prompt():
    return "You are an expert TOEIC examiner..."

def get_reading_generation_prompt(topic, difficulty, num_questions, question_types):
    return f"""
Generate TOEIC Reading test...
Topic: {topic}
Difficulty: {difficulty}
...
"""
```

#### Bước 2: Register trong prompt_loader.py

```python
self._generation_modules = {
    "IELTS": {...},
    "TOEIC": {
        "reading": toeic_reading,
        # ... other skills
    }
}
```

### 📊 So sánh

#### Trước (Old Structure)

```python
# Tất cả prompts nằm trong 1 file chatgpt_service.py (1700 dòng)
# ❌ Khó tìm kiếm
# ❌ Khó bảo trì
# ❌ Dễ trùng lặp
# ❌ Khó mở rộng

def _build_question_generation_prompt(...):
    # 500+ dòng code với nhiều if-else
    if skill == "reading":
        # Hàng trăm dòng prompt...
    elif skill == "listening":
        # Hàng trăm dòng prompt...
    ...
```

#### Sau (New Structure)

```python
# Prompts được tổ chức theo modules
# ✅ Dễ tìm kiếm
# ✅ Dễ bảo trì
# ✅ Không trùng lặp
# ✅ Dễ mở rộng

# File chỉ ~300 dòng, tập trung vào business logic
system_prompt = prompt_loader.get_system_prompt("generation", "IELTS", "reading")
user_prompt = prompt_loader.get_generation_prompt(
    exam_type="IELTS",
    skill="reading",
    ...
)
```

### 🎨 Best Practices

1. **Một file một mục đích**: Mỗi file chỉ chứa prompts cho một skill cụ thể
2. **Functions nhỏ gọn**: Mỗi function trả về một loại prompt cụ thể
3. **Đặt tên rõ ràng**: `get_reading_generation_prompt`, `get_writing_grading_prompt`
4. **Tài liệu đầy đủ**: Docstrings giải thích rõ mục đích và parameters
5. **Type hints**: Sử dụng type hints để IDE hỗ trợ tốt hơn

### 🔄 Migration từ code cũ

chatgpt_service.py đã được cập nhật để sử dụng prompt_loader:

```python
# Thay thế
prompt = self._build_question_generation_prompt(...)

# Bằng
user_prompt = prompt_loader.get_generation_prompt(...)
```

Tất cả các methods `_build_*` đã được xóa khỏi chatgpt_service.py và chuyển vào các file prompts riêng biệt.

### 📚 Files đã tạo

1. `prompts/__init__.py` - Export prompt_loader
2. `prompts/prompt_loader.py` - Central manager
3. `prompts/generation/ielts_reading.py` - IELTS Reading
4. `prompts/generation/ielts_listening.py` - IELTS Listening
5. `prompts/generation/ielts_writing.py` - IELTS Writing
6. `prompts/generation/ielts_speaking.py` - IELTS Speaking
7. `prompts/grading/ielts_writing_grading.py` - Writing grading
8. `prompts/grading/ielts_speaking_grading.py` - Speaking grading

### ✅ Testing

Sau khi refactor, test các chức năng:

```bash
# Test generation
python -m app.services.chatgpt_service

# Test với API
curl -X POST http://localhost:8000/api/v1/ai/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"exam_type": "IELTS", "skill": "reading", ...}'
```

---

**Tác giả**: GitHub Copilot  
**Ngày tạo**: 2026-02-02  
**Version**: 1.0.0
